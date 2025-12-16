import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ClarificationsService {
	constructor(private prisma: PrismaService) {}

	list(opportunityId: string) {
		return this.prisma.clarification.findMany({
			where: { opportunityId },
			orderBy: [{ questionNo: 'asc' }]
		})
	}

	create(opportunityId: string, data: { questionNo: string; text: string; status?: string }) {
		return this.prisma.clarification.create({
			data: { opportunityId, questionNo: data.questionNo, text: data.text, status: data.status || 'open' }
		})
	}

	update(id: string, data: Partial<{ text: string; status: string; responseText: string; submittedOn: string; responseOn: string }>) {
		return this.prisma.clarification.update({
			where: { id },
			data: {
				text: data.text,
				status: data.status,
				responseText: data.responseText,
				submittedOn: data.submittedOn ? new Date(data.submittedOn) : undefined,
				responseOn: data.responseOn ? new Date(data.responseOn) : undefined
			}
		})
	}

	async exportCsv(opportunityId: string) {
		const rows = await this.list(opportunityId)
		const headers = ['QuestionNo','Text','Status','SubmittedOn','ResponseOn','ResponseText']
		const lines = [headers.join(',')]
		for (const r of rows) {
			const line = [
				esc(r.questionNo),
				esc(r.text),
				esc(r.status || ''),
				esc(r.submittedOn ? r.submittedOn.toISOString().slice(0,10) : ''),
				esc(r.responseOn ? r.responseOn.toISOString().slice(0,10) : ''),
				esc(r.responseText || '')
			].join(',')
			lines.push(line)
		}
		return lines.join('\\n')
	}
}

function esc(s: string) {
	if (s.includes(',') || s.includes('"') || s.includes('\\n')) return '"' + s.replace(/"/g, '""') + '"'
	return s
}


