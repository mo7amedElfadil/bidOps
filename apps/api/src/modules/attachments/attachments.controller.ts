import { Body, Controller, Get, Inject, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { PrismaService } from '../../prisma/prisma.service'
import { STORAGE_SERVICE, StorageService } from '../../files/storage.interface'
import { SearchService } from '../../search/search.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
	constructor(
		private prisma: PrismaService,
		@Inject(STORAGE_SERVICE) private storage: StorageService,
		private search: SearchService
	) {}

	@Get()
	list(@Query('entityType') entityType: string, @Query('entityId') entityId: string, @Req() req: any) {
		return this.prisma.attachment.findMany({
			where: { entityType, entityId, tenantId: req.user?.tenantId || 'default' },
			orderBy: { createdAt: 'desc' }
		})
	}

	@Post()
	@UseInterceptors(FileInterceptor('file'))
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	async upload(
		@UploadedFile() file: any,
		@Body('entityType') entityType: string,
		@Body('entityId') entityId: string,
		@Req() req: any
	) {
		const tenantId = req.user?.tenantId || 'default'
		const info = await this.storage.uploadBuffer(process.env.ATTACHMENTS_CONTAINER || 'attachments', file.buffer, file.originalname)
		const row = await this.prisma.attachment.create({
			data: {
				entityType,
				entityId,
				filename: file.originalname,
				size: info.size,
				hash: info.hash,
				storagePath: info.path,
				tenantId
			}
		})
		try {
			await this.search.indexAttachment({
				id: row.id,
				filename: row.filename,
				path: row.storagePath,
				size: row.size,
				hash: row.hash,
				createdAt: row.createdAt.toISOString(),
				tenantId
			})
		} catch {}
		return row
	}
}
