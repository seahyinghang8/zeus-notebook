import { getLoadedLibraries, parsePythonError } from '$lib/functions/parser';
import { applyMatplotlibPatch } from '$lib/functions/patch';
import type { MessageToWorker, MessageFromWorker } from '$lib/types/messages';
import type { loadPyodide, PyodideInterface } from '$lib/types/pyodide';

let pyodide: PyodideInterface | undefined;
const stdin: () => string = () => {
    console.warn("Requesting for stdin. Feature not supported. Stdin will be an empty string.")
    return ""
}

async function loadPyodideModule() {
    // @ts-expect-error importing a js library from the web
    await import("https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js");
}

function stdout(msg: string) {
    const message: MessageFromWorker<string> = {
        type: 'stdout',
        data: msg
    }
    postMessage(message);
}

function stderr(msg: string) {
    const message: MessageFromWorker<string> = {
        type: 'stderr',
        data: msg
    }
    postMessage(message);
}

async function main() {
    await loadPyodideModule();
    // @ts-expect-error add custom function to draw on a JS canvas as a WebWorker
    globalThis.drawDOMCanvas = (pixelsPy: pyodide.ffi.PyProxy, height: number, width: number) => {
        const pixels: Uint8Array = pixelsPy.toJs();
        const message: MessageFromWorker<{ pixels: Uint8Array; height: number; width: number }> = {
            type: 'drawDOMCanvas',
            data: {
                pixels, height, width
            }
        }
        postMessage(message);
    }
    // @ts-expect-error loadPyodide is only used for its typing
    pyodide = await loadPyodide({
        stdout,
        stderr,
        stdin,
    })
    const pyodideLoadedMessage: MessageFromWorker = {
        type: 'pyodideLoaded'
    }
    postMessage(pyodideLoadedMessage);
}

async function handleRunPythonAsync(pyodide: PyodideInterface, code: string) {
    try {
        let returnValue = await pyodide.runPythonAsync(code);

        if (returnValue !== undefined) {
            let format = "string";

            if (returnValue instanceof pyodide.ffi.PyProxy) {
                if (returnValue._repr_html_ !== undefined) {
                    returnValue = returnValue._repr_html_();
                    format = "html";
                } else if (returnValue._repr_latex_ !== undefined) {
                    returnValue = returnValue._repr_latex_();
                    format = "latex";
                } else {
                    returnValue = returnValue.__str__();
                    format = "string"
                }
            }

            const message: MessageFromWorker<{ value: string, format: string }> = {
                type: 'returnValue',
                data: {
                    value: returnValue,
                    format
                }
            }
            postMessage(message);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        if (e.message !== undefined) {
            const message: MessageFromWorker<string> = {
                type: 'pythonError',
                data: parsePythonError(e.message)
            }
            postMessage(message);
        }
    }
    const message: MessageFromWorker = {
        type: 'runPythonAsyncCompleted'
    }
    postMessage(message);
}

async function handleLoadPackagesFromImports(pyodide: PyodideInterface, code: string) {
    await pyodide.loadPackagesFromImports(code, {
        messageCallback: (message) => {
            const libraries = getLoadedLibraries(message);
            if (libraries.includes("matplotlib")) {
                applyMatplotlibPatch(pyodide);
            }
        }
    });
    const message: MessageFromWorker = {
        type: 'loadPackagesFromImportsCompleted'
    }
    postMessage(message);
}

function handleMessage({ data: { type, data } }: MessageEvent<MessageToWorker<unknown>>) {
    if (pyodide == undefined) {
        console.error("Pyodide is not loaded yet")
        return;
    }

    switch (type) {
        case 'runPythonAsync':
            handleRunPythonAsync(pyodide, data as string);
            break;
        case 'loadPackagesFromImports':
            handleLoadPackagesFromImports(pyodide, data as string);
            break;
    }
}

onmessage = handleMessage;
main();