export interface MessageToWorker<T = void> {
    type: 'runPythonAsync' | 'loadPackagesFromImports';
    data?: T;
}

export interface MessageFromWorker<T = void> {
    type: 'pyodideLoaded' | 'loadPackagesFromImportsCompleted' | 'runPythonAsyncCompleted' | 'stdout' | 'stderr' | 'pythonError' | 'returnValue' | 'drawDOMCanvas';
    data?: T;
}