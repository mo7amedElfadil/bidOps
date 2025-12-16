import { BadRequestException, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { parse } from 'csv-parse/sync'
import { PrismaService } from '../../prisma/prisma.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
	constructor(private readonly prisma: PrismaService) {}

	@Get('templates/tracker.csv')
	template() {
		const headers = [
			'Customer',
			'Tender Details',
			'Description',
			'Submission Date',
			'Status',
			'Business Owner',
			'Bid Owner',
			'Mode of Submission',
			'Days Left',
			'Rank',
			'Validity'
		]
		return headers.join(',') + '\\n'
	}

	@Post('tracker')
	@UseInterceptors(FileInterceptor('file'))
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	async importTracker(@UploadedFile() file?: any, @Req() req?: any) {
		if (!file) throw new BadRequestException('file is required')
		const tenantId = req?.user?.tenantId || 'default'
		const text = file.buffer.toString('utf-8')
		const records = parse(text, { columns: true, skip_empty_lines: true, trim: true })

		let clientsCreated = 0
		let oppsUpserted = 0

		for (const row of records as any[]) {
			const clientName = row['Customer']?.toString()?.trim()
			if (!clientName) continue
			const client = await this.prisma.client.upsert({
				where: { name_tenantId: { name: clientName, tenantId } },
				update: {},
				create: { name: clientName, sector: undefined, tenantId }
			})
			if (client) clientsCreated += 0 // upsert may be update; we skip counting

			const submissionDate = row['Submission Date'] ? new Date(row['Submission Date']) : null
			const daysLeft = row['Days Left'] ? Number(row['Days Left']) : undefined
			const priorityRank = row['Rank'] ? Number(row['Rank']) : undefined

			await this.prisma.opportunity.create({
				data: {
					clientId: client.id,
					tenderRef: row['Tender Details']?.toString()?.trim() || null,
					title: row['Description']?.toString()?.trim() || row['Tender Details']?.toString()?.trim() || 'Untitled',
					description: row['Description']?.toString()?.trim() || null,
					submissionDate: submissionDate || undefined,
					status: row['Status']?.toString()?.trim() || undefined,
					modeOfSubmission: row['Mode of Submission']?.toString()?.trim() || undefined,
					daysLeft: typeof daysLeft === 'number' && !Number.isNaN(daysLeft) ? daysLeft : undefined,
					priorityRank: typeof priorityRank === 'number' && !Number.isNaN(priorityRank) ? priorityRank : undefined,
					validityDays: row['Validity'] ? Number(row['Validity']) : undefined,
					dataOwner: row['Business Owner']?.toString()?.trim() || undefined,
					tenantId
				}
			})
			oppsUpserted += 1
		}

		return { clientsCreated, oppsUpserted }
	}
}


