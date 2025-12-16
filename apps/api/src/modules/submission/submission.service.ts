import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { STORAGE_SERVICE, StorageService } from '../../files/storage.interface'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver = require('archiver') as typeof import('archiver')
import { createHash } from 'crypto'

@Injectable()
export class SubmissionService {
	constructor(
		private prisma: PrismaService,
		@Inject(STORAGE_SERVICE) private storage: StorageService
	) {}

	async build(opportunityId: string) {
		const attachments = await this.prisma.attachment.findMany({
			where: { entityType: 'Opportunity', entityId: opportunityId },
			orderBy: { createdAt: 'asc' }
		})
		// Create zip in memory
		const archive = archiver('zip', { zlib: { level: 9 } })
		const chunks: Buffer[] = []
		archive.on('data', (d: any) => chunks.push(Buffer.from(d)))
		const manifest: any = { generatedAt: new Date().toISOString(), files: [] as any[] }

		for (const a of attachments) {
			// We don't have the raw buffer; include a manifest entry pointing to storage and hash recorded on upload
			manifest.files.push({
				filename: a.filename,
				storagePath: a.storagePath,
				size: a.size,
				hash: a.hash
			})
		}
		archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })
		await archive.finalize()
		const zipBuffer = Buffer.concat(chunks)
		const checksum = createHash('sha256').update(zipBuffer).digest('hex')
		const uploaded = await this.storage.uploadBuffer('submission-packs', zipBuffer, `submission-${opportunityId}.zip`)
		return { path: uploaded.path, checksum, count: attachments.length }
	}
}
