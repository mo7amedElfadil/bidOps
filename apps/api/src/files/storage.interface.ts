/**
 * Storage service interface for file operations.
 * Implementations: LocalStorageService (dev), BlobService (Azure prod)
 */

export interface UploadResult {
	url: string
	path: string
	hash: string
	size: number
}

export interface StorageService {
	/**
	 * Upload a file buffer to storage
	 */
	uploadBuffer(container: string, buffer: Buffer, filename: string): Promise<UploadResult>

	/**
	 * Download a file from storage
	 */
	downloadBuffer(container: string, path: string): Promise<Buffer>

	/**
	 * Delete a file from storage
	 */
	deleteFile(container: string, path: string): Promise<void>

	/**
	 * Check if a file exists
	 */
	exists(container: string, path: string): Promise<boolean>
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE'

