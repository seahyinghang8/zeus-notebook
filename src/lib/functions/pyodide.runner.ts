import type { MessageToWorker, MessageFromWorker } from '$lib/types/messages';
import type { DrawCanvasValue, Output } from '$lib/components/CellOutput.svelte';

interface ExecutionChunk {
    index: number;
    code: string;
}

export default class PyodideRunner {
    public onPyodideLoaded?: () => void;
    public pyodideLoaded = false;
    public onOutput?: (output: Output<unknown>) => void;
    public onExecutionStart?: (index: number) => boolean;
    public onExecutionCompleted?: (index: number) => void;

    private pyodideWorker?: Worker;
    private executionCount = 0;
    private executionQueue: ExecutionChunk[] = [];
    private processingQueue = false;
    private onLoadPackagesFromImportsCompleted?: () => void;
    private onPythonAsyncCompleted?: () => void;

    public addWorker(pyodideWorker: Worker) {
        this.pyodideWorker = pyodideWorker;
        this.pyodideWorker.onmessage = this.handleWorkerMessage.bind(this);
    }

    private handleWorkerMessage({ data: { type, data } }: MessageEvent<MessageFromWorker<unknown>>) {
        switch (type) {
            case 'pyodideLoaded':
                {
                    this.pyodideLoaded = true
                    if (this.onPyodideLoaded !== undefined) {
                        this.onPyodideLoaded();
                    }
                    break;
                }
            case 'loadPackagesFromImportsCompleted':
                {
                    if (this.onLoadPackagesFromImportsCompleted !== undefined) {
                        this.onLoadPackagesFromImportsCompleted();
                    }
                    break;
                }
            case 'runPythonAsyncCompleted':
                {
                    if (this.onPythonAsyncCompleted !== undefined) {
                        this.onPythonAsyncCompleted();
                    }
                    break;
                }
            case 'stdout':
            case 'stderr':
            case 'pythonError':
                {
                    if (this.onOutput !== undefined) {
                        this.onOutput({ type, format: 'string', value: data as string });
                    }
                    break;
                }
            case 'returnValue':
                {
                    if (this.onOutput !== undefined) {
                        const { value, format } = data as { value: string, format: 'string' | 'html' | 'latex' };
                        this.onOutput({ type, format, value });
                    }
                    break;
                }
            case 'drawDOMCanvas':
                {
                    if (this.onOutput !== undefined) {
                        const { pixels, height, width } = data as DrawCanvasValue
                        this.onOutput({ type, format: 'canvas', value: { pixels, height, width } });
                    }
                    break;
                }
        }
    }

    // adds code chunk to the queue and return the execution order number
    public addToExecutionQueue(code: string): number {
        this.executionCount += 1;
        this.executionQueue.push({ index: this.executionCount, code });
        setTimeout(this.processExecutionQueue.bind(this));
        return this.executionCount;
    }

    // processingQueue serves as a lock to ensure only one thread is processing at a time
    private async processExecutionQueue() {
        if (this.processingQueue) return;
        this.processingQueue = true
        while (this.executionQueue.length > 0) {
            const chunk = this.executionQueue.shift();
            if (chunk === undefined) continue;
            const { index, code } = chunk;
            if (this.onExecutionStart !== undefined) {
                if (!this.onExecutionStart(index)) {
                    // skip this code chunk
                    continue;
                }
            }
            await this.loadPackagesFromImports(code);
            await this.runPythonAsync(code);
            if (this.onExecutionCompleted !== undefined) this.onExecutionCompleted(index);
        }
        this.processingQueue = false;
    }

    private async loadPackagesFromImports(code: string) {
        const message: MessageToWorker<string> = {
            type: 'loadPackagesFromImports',
            data: code
        }
        this.pyodideWorker?.postMessage(message);
        this.onLoadPackagesFromImportsCompleted
        await new Promise<void>(resolve => {
            this.onLoadPackagesFromImportsCompleted = resolve;
        });
    }

    private async runPythonAsync(code: string) {
        const message: MessageToWorker<string> = {
            type: 'runPythonAsync',
            data: code
        }
        this.pyodideWorker?.postMessage(message);
        await new Promise<void>(resolve => {
            this.onPythonAsyncCompleted = resolve;
        });
    }
}