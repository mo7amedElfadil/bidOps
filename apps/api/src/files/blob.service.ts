import { Injectable } from '@nestjs/common'
import { BlobServiceClient } from '@azure/storage-blob'
import * as crypto from 'node:crypto'
import { StorageService, UploadResult } from './storage.interface'

/**
 * Azure Blob Storage implementation for production.
 * Uses AZURE_STORAGE_CONNECTION_STRING for connection.
 */
@Injectable()
export class BlobService implements StorageService {
	private getClient() {
		const connectionString =
			process.env.AZURE_STORAGE_CONNECTION_STRING ||
			'UseDevelopmentStorage=true;'
		return BlobServiceClient.fromConnectionString(connectionString)
	}

	private async ensureContainer(containerName: string) {
		const client = this.getClient().getContainerClient(containerName)
		await client.createIfNotExists()
		return client
	}

	async uploadBuffer(container: string, buffer: Buffer, filename: string): Promise<UploadResult> {
		const containerClient = await this.ensureContainer(container)
		const blobName = crypto.randomUUID()
		const block = containerClient.getBlockBlobClient(blobName)
		await block.uploadData(buffer, {
			blobHTTPHeaders: { blobContentType: inferContentType(filename) }
		})
		const hash = crypto.createHash('sha256').update(buffer).digest('hex')
		return {
			url: block.url,
			path: `${container}/${blobName}`,
			hash,
			size: buffer.length
		}
	}

	async downloadBuffer(container: string, filePath: string): Promise<Buffer> {
		const containerClient = await this.ensureContainer(container)
		// filePath might be "container/filename" or just "filename"
		const blobName = filePath.startsWith(container + '/')
			? filePath.substring(container.length + 1)
			: filePath
		const block = containerClient.getBlockBlobClient(blobName)
		const downloadResponse = await block.download()
		const chunks: Buffer[] = []
		for await (const chunk of downloadResponse.readableStreamBody as AsyncIterable<Buffer>) {
			chunks.push(chunk)
		}
		return Buffer.concat(chunks)
	}

	async deleteFile(container: string, filePath: string): Promise<void> {
		const containerClient = await this.ensureContainer(container)
		const blobName = filePath.startsWith(container + '/')
			? filePath.substring(container.length + 1)
			: filePath
		const block = containerClient.getBlockBlobClient(blobName)
		await block.deleteIfExists()
	}

	async exists(container: string, filePath: string): Promise<boolean> {
		const containerClient = await this.ensureContainer(container)
		const blobName = filePath.startsWith(container + '/')
			? filePath.substring(container.length + 1)
			: filePath
		const block = containerClient.getBlockBlobClient(blobName)
		return block.exists()
	}
}

function inferContentType(name: string): string {
	const lower = name.toLowerCase()
	if (lower.endsWith('.pdf')) return 'application/pdf'
	if (lower.endsWith('.csv')) return 'text/csv'
	if (lower.endsWith('.txt')) return 'text/plain'
	if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
	if (lower.endsWith('.png')) return 'image/png'
	if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	if (lower.endsWith('.zip')) return 'application/zip'
	return 'application/octet-stream'
}
