import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class OutcomesService {
	constructor(private prisma: PrismaService) {}

	get(opportunityId: string) {
		return this.prisma.outcome.findFirst({ where: { opportunityId }, orderBy: { date: 'desc' } })
	}

	set(opportunityId: string, data: { status: 'WON'|'LOST'|'WITHDRAWN'|'CANCELLED'; date?: string; winner?: string; awardValue?: number; notes?: string; reasonCodes?: string[] }) {
		return this.prisma.outcome.create({
			data: {
				opportunityId,
				status: data.status as any,
				date: data.date ? new Date(data.date) : new Date(),
				winner: data.winner,
				awardValue: data.awardValue,
				notes: data.notes,
				reasonCodes: data.reasonCodes || []
			}
		})
	}
}


