
export class WorkerBridgeInitOptions {
    allowSimd?: boolean;
    allowThreads?: boolean;
    requestSuffix?: string;
}

export class WorkerBridge {
    constructor(basePath: string, options: WorkerBridgeInitOptions);

    post(command: string, args: any[], copyArgs: boolean): Promise<any>;

    // Create a copy and pass it to the worker
    postByCopyingArgs(command: string, args: any[]): Promise<any>;

    // Directly transfer the args to the worker
    postByTransferringArgs(command: string, args: any[]): Promise<any>;

    destroy(): void;
}
