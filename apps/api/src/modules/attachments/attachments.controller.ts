import { Body, Controller, Get, Inject, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { PrismaService } from '../../prisma/prisma.service'
import { STORAGE_SERVICE, StorageService } from '../../files/storage.interface'
import { SearchService } from '../../search/search.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { parsePagination } from '../../utils/pagination'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

class ListAttachmentsQuery {
	@IsString()
	entityType!: string

	@IsString()
	entityId!: string

	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	page?: number

	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	pageSize?: number
}

class UploadAttachmentDto {
	@IsString()
	entityType!: string

	@IsString()
	entityId!: string
}

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
	constructor(
		private prisma: PrismaService,
		@Inject(STORAGE_SERVICE) private storage: StorageService,
		private search: SearchService
	) {}

	@Get()
	list(
		@Query() query: ListAttachmentsQuery,
		@Req() req: any
	) {
		const { page: p, pageSize: size, skip } = parsePagination(query, 25, 200)
		const where = { entityType: query.entityType, entityId: query.entityId, tenantId: req.user?.tenantId || 'default' }
		return this.prisma.$transaction([
			this.prisma.attachment.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: size
			}),
			this.prisma.attachment.count({ where })
		]).then(([items, total]) => ({ items, total, page: p, pageSize: size }))
	}

	@Post()
	@UseInterceptors(FileInterceptor('file'))
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	async upload(
		@UploadedFile() file: any,
		@Body() body: UploadAttachmentDto,
		@Req() req: any
	) {
		const tenantId = req.user?.tenantId || 'default'
		const { entityType, entityId } = body
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

	@Get(':id/download')
	async download(@Param('id') id: string, @Res() res: any, @Req() req: any) {
		const attachment = await this.prisma.attachment.findFirst({
			where: { id, tenantId: req.user?.tenantId || 'default' }
		})
		if (!attachment) return res.status(404).send('Attachment not found')
		const buffer = await this.storage.downloadBuffer(
			process.env.ATTACHMENTS_CONTAINER || 'attachments',
			attachment.storagePath
		)
		res.setHeader('Content-Type', 'application/octet-stream')
		res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`)
		return res.send(buffer)
	}
}
