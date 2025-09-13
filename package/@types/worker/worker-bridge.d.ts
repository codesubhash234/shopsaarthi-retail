import { WorkerBridgeInitOptions } from "../core/worker-bridge";
export declare class WorkerBridge {
    static ASM_JS: string;
    private core;
    /** Will be resolved once the core is initialized */
    private coreInitializationSuccessful;
    constructor(path: string, options: WorkerBridgeInitOptions, initializeArgs: any[]);
    awaitInitialized(): Promise<void>;
    postByCopyingArgs(command: string, args: any[]): Promise<any>;
    postByTransferringArgs(command: string, args: any[]): Promise<any>;
    private getCoreForCommand;
}
