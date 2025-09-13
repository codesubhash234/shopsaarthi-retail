export declare class PartiallyConstructible {
    /** @internal */
    _marker(): void;
}
export type DeepPartial<T> = T extends PartiallyConstructible ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
