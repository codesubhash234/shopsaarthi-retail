import { CroppingResult } from "../model/response/cropping-result";
export interface ICroppingViewHandle {
    apply(): Promise<CroppingResult>;
    rotate(rotations: number): Promise<void>;
    detect(): Promise<void>;
    dispose(): void;
}
