export interface UploadResult {
    url: string;
    path: string;
    hash: string;
    size: number;
}
export interface StorageService {
    uploadBuffer(container: string, buffer: Buffer, filename: string): Promise<UploadResult>;
    downloadBuffer(container: string, path: string): Promise<Buffer>;
    deleteFile(container: string, path: string): Promise<void>;
    exists(container: string, path: string): Promise<boolean>;
}
export declare const STORAGE_SERVICE = "STORAGE_SERVICE";
