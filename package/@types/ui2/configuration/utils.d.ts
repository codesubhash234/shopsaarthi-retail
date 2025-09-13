export type DeepPartial<T> = Uint8Array extends T ? T : T extends Function ? T : T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export declare class PartiallyConstructible {
}
export type GenericDocument = any;
