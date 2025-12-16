import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AwardsService {
	constructor(private prisma: PrismaService) {}

	listStaging(limit = 100) {
		return this.prisma.awardStaging.findMany({
			orderBy: { createdAt: 'desc' },
			take: limit
		})
	}

	createStaging(data: any) {
		return this.prisma.awardStaging.create({
			data: {
				portal: data.portal,
				tenderRef: data.tenderRef,
				buyer: data.buyer,
				title: data.title,
				closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
				awardDate: data.awardDate ? new Date(data.awardDate) : undefined,
				winners: data.winners || [],
				awardValue: data.awardValue !== undefined ? Number(data.awardValue) : undefined,
				codes: data.codes || [],
				notes: data.notes,
				rawPath: data.rawPath,
				sourceUrl: data.sourceUrl,
				status: data.status || 'new'
			}
		})
	}

	async curate(id: string) {
		const row = await this.prisma.awardStaging.findUnique({ where: { id } })
		if (!row) return null
		const event = await this.prisma.awardEvent.create({
			data: {
				portal: row.portal,
				tenderRef: row.tenderRef || undefined,
				buyer: row.buyer || undefined,
				title: row.title || undefined,
				awardDate: row.awardDate || undefined,
				winners: row.winners,
				awardValue: row.awardValue || undefined,
				codes: row.codes,
				sourceUrl: row.sourceUrl || undefined
			}
		})
		await this.prisma.awardStaging.update({ where: { id }, data: { status: 'curated' } })
		return event
	}

	listEvents(limit = 200) {
		return this.prisma.awardEvent.findMany({
			orderBy: { awardDate: 'desc' },
			take: limit
		})
	}
}


