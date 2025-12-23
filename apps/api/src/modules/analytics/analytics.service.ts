import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AnalyticsService {
	constructor(private prisma: PrismaService) {}

	async exportAwardsCsv() {
		const rows = await this.prisma.awardEvent.findMany({ orderBy: { awardDate: 'desc' } })
		const headers = ['Portal','TenderRef','Client','Title','AwardDate','Winners','AwardValue','Codes']
		const lines = [headers.join(',')]
		for (const r of rows) {
			lines.push([
				esc(r.portal),
				esc(r.tenderRef || ''),
				esc(r.client || ''),
				esc(r.title || ''),
				esc(r.awardDate ? r.awardDate.toISOString().slice(0,10) : ''),
				esc(r.winners.join(';')),
				esc(r.awardValue?.toString() || ''),
				esc(r.codes.join(';'))
			].join(','))
		}
		return lines.join('\\n')
	}

	async generateReportContext() {
		// TODO: Use AI (Gemini/ChatGPT via MCP) to generate context
		return {
			summary: 'Executive summary of the current pipeline performance based on recent awards and opportunities.',
			trends: ['Win rate increased by 5% in Q4', 'Healthcare sector showing strong growth'],
			recommendations: ['Focus on Hamad Medical Corporation tenders', 'Review lost bids for pricing patterns']
		}
	}

	async exportOpportunitiesCsv(tenantId: string) {
		const rows = await this.prisma.opportunity.findMany({
			where: { tenantId },
			include: { client: true },
			orderBy: [{ submissionDate: 'asc' }]
		})
		const headers = ['OpportunityId','Client','TenderRef','Title','Stage','Status','SubmissionDate','DaysLeft','Rank','CreatedAt']
		const lines = [headers.join(',')]
		for (const r of rows) {
			lines.push([
				esc(r.id),
				esc(r.client?.name || ''),
				esc(r.tenderRef || ''),
				esc(r.title),
				esc(r.stage || ''),
				esc(r.status || ''),
				esc(r.submissionDate ? r.submissionDate.toISOString().slice(0,10) : ''),
				esc(r.daysLeft?.toString() || ''),
				esc(r.priorityRank?.toString() || ''),
				esc(r.createdAt.toISOString())
			].join(','))
		}
		return lines.join('\\n')
	}
}

function esc(s: string) {
	if (s.includes(',') || s.includes('"') || s.includes('\\n')) return '"' + s.replace(/"/g, '""') + '"'
	return s
}

