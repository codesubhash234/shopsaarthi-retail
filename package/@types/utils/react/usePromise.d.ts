type LoadingState<T> = {
    loading: boolean;
    value: T | undefined;
    error: {
        reason: any;
    } | null;
};
/**
 * Returns null if no promise is given.
 * Otherwise, it returns the loading state of the promise.
 * This loading state is correct, even if in the first call to this function, the promise is already resolved.
 */
export declare function usePromise<T>(promise: Promise<T> | undefined): null | LoadingState<T>;
export {};
