import { splitIntoClauses } from '@itsq-bidops/parser-tools'
import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { BlobService } from '../../files/blob.service'
import pdf from 'pdf-parse'
import { parse } from 'csv-parse/sync'

@Injectable()
export class ComplianceService {
	constructor(private prisma: PrismaService, private blob: BlobService) {}

	async list(opportunityId: string) {
		return this.prisma.complianceClause.findMany({
			where: { opportunityId },
			orderBy: [{ section: 'asc' }, { clauseNo: 'asc' }, { createdAt: 'asc' }]
		})
	}

	async update(id: string, data: Partial<{ response: string; status: string; owner: string; evidence: string; mandatoryFlag: boolean }>) {
		return this.prisma.complianceClause.update({
			where: { id },
			data
		})
	}

	async importPdf(opportunityId: string, file: any) {
		if (!file) throw new BadRequestException('file is required')
		// Store original file
		const info = await this.blob.uploadBuffer(process.env.ATTACHMENTS_CONTAINER || 'attachments', file.buffer, file.originalname)
		// Parse text from PDF
		const parsed = await pdf(file.buffer).catch(() => ({ text: '' as string }))
		const text = parsed.text || ''
		const parts = splitIntoClauses(text)
		const createData = parts.slice(0, 500).map((t, i) => ({
			opportunityId,
			section: undefined,
			clauseNo: String(i + 1),
			requirementText: t,
			mandatoryFlag: false
		}))
		if (createData.length === 0) {
			// Fallback: create one row noting file stored
			createData.push({
				opportunityId,
				section: undefined,
				clauseNo: '1',
				requirementText: `See attached file: ${file.originalname} (${info.path})`,
				mandatoryFlag: false
			})
		}
		await this.prisma.complianceClause.createMany({ data: createData })
		return { created: createData.length }
	}

	async importCsv(opportunityId: string, file: any) {
		if (!file) throw new BadRequestException('file is required')
		const text = file.buffer.toString('utf-8')
		const records = parse(text, { columns: true, skip_empty_lines: true, trim: true })
		const createData = (records as any[]).map((row, index) => ({
			opportunityId,
			section: row['Section']?.toString()?.trim() || undefined,
			clauseNo: row['ClauseNo']?.toString()?.trim() || String(index + 1),
			requirementText: row['Requirement']?.toString()?.trim() || '',
			mandatoryFlag: String(row['Mandatory'] || '').toLowerCase() === 'yes',
			response: row['Response']?.toString()?.trim() || undefined,
			status: row['Status']?.toString()?.trim() || undefined,
			owner: row['Owner']?.toString()?.trim() || undefined,
			evidence: row['Evidence']?.toString()?.trim() || undefined
		})).filter(row => row.requirementText)
		if (!createData.length) {
			throw new BadRequestException('No valid compliance rows found in CSV')
		}
		await this.prisma.complianceClause.createMany({ data: createData })
		return { created: createData.length }
	}

	async exportCsv(opportunityId: string) {
		const rows = await this.list(opportunityId)
		const headers = ['ClauseNo','Section','Mandatory','Requirement','Response','Status','Owner','Evidence']
		const lines = [headers.join(',')]
		for (const r of rows) {
			const line = [
				escapeCsv(r.clauseNo || ''),
				escapeCsv(r.section || ''),
				escapeCsv(r.mandatoryFlag ? 'Yes' : 'No'),
				escapeCsv(r.requirementText),
				escapeCsv(r.response || ''),
				escapeCsv(r.status || ''),
				escapeCsv(r.owner || ''),
				escapeCsv(r.evidence || '')
			].join(',')
			lines.push(line)
		}
		return lines.join('\\n')
	}
}

function escapeCsv(s: string) {
	if (s.includes(',') || s.includes('"') || s.includes('\\n')) {
		return '"' + s.replace(/"/g, '""') + '"'
	}
	return s
}

