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

	async getOnboardingMetrics(tenantId: string) {
		const [firstAdmin, firstNonAdmin, firstRole, firstDefault] = await Promise.all([
			this.prisma.user.findFirst({
				where: { tenantId, role: 'ADMIN' },
				orderBy: { createdAt: 'asc' }
			}),
			this.prisma.user.findFirst({
				where: { tenantId, role: { not: 'ADMIN' } },
				orderBy: { createdAt: 'asc' }
			}),
			this.prisma.businessRole.findFirst({
				where: { tenantId },
				orderBy: { createdAt: 'asc' }
			}),
			this.prisma.notificationRoutingDefault.findFirst({
				where: { tenantId },
				orderBy: { createdAt: 'asc' }
			})
		])

		const startedAt = firstAdmin?.createdAt ?? null
		const usersCompletedAt = firstNonAdmin?.createdAt ?? null
		const rolesCompletedAt = firstRole?.createdAt ?? null
		const defaultsCompletedAt = firstDefault?.createdAt ?? null

		const durationHours = (start?: Date | null, end?: Date | null) => {
			if (!start || !end) return null
			return Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 10) / 10
		}

		const approvals = await this.prisma.approval.findMany({
			where: {
				decidedAt: { not: null, gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
				pack: { opportunity: { tenantId } }
			},
			select: { decidedAt: true, requestedAt: true, createdAt: true, lateDecision: true }
		})
		const durations = approvals
			.map(row => {
				const start = row.requestedAt || row.createdAt
				if (!row.decidedAt || !start) return null
				return (row.decidedAt.getTime() - start.getTime()) / (1000 * 60 * 60)
			})
			.filter((value): value is number => value !== null && Number.isFinite(value))
		const average = durations.length
			? durations.reduce((sum, value) => sum + value, 0) / durations.length
			: null
		const median = durations.length
			? durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
			: null
		const lateCount = approvals.filter(row => row.lateDecision).length

		const completionDates = [usersCompletedAt, rolesCompletedAt, defaultsCompletedAt].filter(Boolean) as Date[]
		const overallCompletion = completionDates.length
			? completionDates.sort((a, b) => a.getTime() - b.getTime())[completionDates.length - 1]
			: null

		return {
			startedAt,
			usersCompletedAt,
			rolesCompletedAt,
			defaultsCompletedAt,
			durationsHours: {
				users: durationHours(startedAt, usersCompletedAt),
				roles: durationHours(startedAt, rolesCompletedAt),
				defaults: durationHours(startedAt, defaultsCompletedAt),
				overall: durationHours(startedAt, overallCompletion)
			},
			approvalsTurnaround: {
				count: durations.length,
				averageHours: average ? Math.round(average * 10) / 10 : null,
				medianHours: median ? Math.round(median * 10) / 10 : null,
				lateCount
			}
		}
	}
}

function esc(s: string) {
	if (s.includes(',') || s.includes('"') || s.includes('\\n')) return '"' + s.replace(/"/g, '""') + '"'
	return s
}
