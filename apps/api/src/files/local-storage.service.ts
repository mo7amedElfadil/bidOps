import { Injectable } from '@nestjs/common'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import { StorageService, UploadResult } from './storage.interface'

/**
 * Local filesystem storage implementation for development.
 * Stores files in LOCAL_STORAGE_PATH (default: ./data/storage)
 */
@Injectable()
export class LocalStorageService implements StorageService {
	private getBasePath(): string {
		return process.env.LOCAL_STORAGE_PATH || './data/storage'
	}

	private getContainerPath(container: string): string {
		return path.join(this.getBasePath(), container)
	}

	private ensureDir(dirPath: string): void {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true })
		}
	}

	async uploadBuffer(container: string, buffer: Buffer, filename: string): Promise<UploadResult> {
		const containerPath = this.getContainerPath(container)
		this.ensureDir(containerPath)

		// Generate unique filename with UUID
		const ext = path.extname(filename)
		const uniqueName = `${crypto.randomUUID()}${ext}`
		const filePath = path.join(containerPath, uniqueName)

		// Write file
		fs.writeFileSync(filePath, buffer)

		// Calculate hash
		const hash = crypto.createHash('sha256').update(buffer).digest('hex')

		// Return result matching interface
		const storagePath = `${container}/${uniqueName}`
		return {
			url: `file://${path.resolve(filePath)}`,
			path: storagePath,
			hash,
			size: buffer.length
		}
	}

	async downloadBuffer(container: string, filePath: string): Promise<Buffer> {
		// filePath might be "container/filename" or just "filename"
		const relativePath = filePath.startsWith(container + '/')
			? filePath.substring(container.length + 1)
			: filePath
		const fullPath = path.join(this.getContainerPath(container), relativePath)

		if (!fs.existsSync(fullPath)) {
			throw new Error(`File not found: ${fullPath}`)
		}

		return fs.readFileSync(fullPath)
	}

	async deleteFile(container: string, filePath: string): Promise<void> {
		const relativePath = filePath.startsWith(container + '/')
			? filePath.substring(container.length + 1)
			: filePath
		const fullPath = path.join(this.getContainerPath(container), relativePath)

		if (fs.existsSync(fullPath)) {
			fs.unlinkSync(fullPath)
		}
	}

	async exists(container: string, filePath: string): Promise<boolean> {
		const relativePath = filePath.startsWith(container + '/')
			? filePath.substring(container.length + 1)
			: filePath
		const fullPath = path.join(this.getContainerPath(container), relativePath)

		return fs.existsSync(fullPath)
	}
}

