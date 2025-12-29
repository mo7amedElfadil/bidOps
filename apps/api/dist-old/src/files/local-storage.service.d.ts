import { StorageService, UploadResult } from './storage.interface';
export declare class LocalStorageService implements StorageService {
    private getBasePath;
    private getContainerPath;
    private ensureDir;
    uploadBuffer(container: string, buffer: Buffer, filename: string): Promise<UploadResult>;
    downloadBuffer(container: string, filePath: string): Promise<Buffer>;
    deleteFile(container: string, filePath: string): Promise<void>;
    exists(container: string, filePath: string): Promise<boolean>;
}
