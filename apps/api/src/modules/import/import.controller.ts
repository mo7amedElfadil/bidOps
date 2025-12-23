import { BadRequestException, Controller, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
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
			'Sno',
			'Customer',
			'Tender Details',
			'Description',
			'Target Submission date',
			'Submission Date',
			'Notes',
			'Status',
			'Business Owner',
			'Bid Owner',
			'Tender Bond Readiness',
			'Tender Value',
			'Mode of Submission',
			'Days Left',
			'Reformatted Date',
			'Rank',
			'Validity',
			'N/A'
		]
		return headers.join(',') + '\\n'
	}

	@Post('tracker')
	@UseInterceptors(FileInterceptor('file'))
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	async importTracker(@UploadedFile() file?: any, @Req() req?: any) {
		if (!file) throw new BadRequestException('file is required')
		const tenantId = req?.user?.tenantId || 'default'
		const importDateFormat = await this.getImportDateFormat()
		const text = file.buffer.toString('utf-8')
		const records = parse(text, { columns: true, skip_empty_lines: true, trim: true })

		let clientsCreated = 0
		let oppsUpserted = 0
		const users = await this.prisma.user.findMany({
			where: { tenantId },
			select: { id: true, name: true, email: true }
		})
		const usersByEmail = new Map(users.map(user => [user.email.toLowerCase(), user.id]))
		const usersByName = new Map(users.map(user => [user.name.toLowerCase(), user.id]))

		const issues: Array<{
			opportunityId: string
			fieldName: string
			columnName?: string
			rowIndex: number
			rawValue?: string
			message: string
		}> = []

		for (const [index, row] of (records as any[]).entries()) {
			const clientName = getField(row, ['Customer', 'Client'])?.trim()
			if (!clientName) continue
			const client = await this.prisma.client.upsert({
				where: { name_tenantId: { name: clientName, tenantId } },
				update: {},
				create: { name: clientName, sector: undefined, tenantId }
			})
			if (client) clientsCreated += 0 // upsert may be update; we skip counting

			const submissionField = getFieldInfo(row, ['Submission Date', 'Target Submission date', 'Reformatted Date'])
			const submissionDate = parseDate(submissionField?.value, importDateFormat)
			if (submissionField?.value && !submissionDate) {
				issues.push({
					opportunityId: 'pending',
					fieldName: 'submissionDate',
					columnName: submissionField.columnName,
					rowIndex: index + 2,
					rawValue: submissionField.value,
					message: 'Invalid date; value left empty'
				})
			}
			const daysField = getFieldInfo(row, ['Days Left', 'Days left'])
			const daysLeft = toNumber(daysField?.value)
			if (daysField?.value && daysLeft === undefined) {
				issues.push({
					opportunityId: 'pending',
					fieldName: 'daysLeft',
					columnName: daysField.columnName,
					rowIndex: index + 2,
					rawValue: daysField.value,
					message: 'Invalid number; value left empty'
				})
			}
			const rankField = getFieldInfo(row, ['Rank'])
			const priorityRank = toNumber(rankField?.value)
			if (rankField?.value && priorityRank === undefined) {
				issues.push({
					opportunityId: 'pending',
					fieldName: 'priorityRank',
					columnName: rankField.columnName,
					rowIndex: index + 2,
					rawValue: rankField.value,
					message: 'Invalid number; value left empty'
				})
			}
			const validityField = getFieldInfo(row, ['Validity'])
			const validityDays = toNumber(validityField?.value)
			if (validityField?.value && validityDays === undefined) {
				issues.push({
					opportunityId: 'pending',
					fieldName: 'validityDays',
					columnName: validityField.columnName,
					rowIndex: index + 2,
					rawValue: validityField.value,
					message: 'Invalid number; value left empty'
				})
			}
			const bidOwnerField = getFieldInfo(row, ['Bid Owner', 'Bid Owners'])
			const bidOwnerNames = bidOwnerField?.value ? splitOwners(bidOwnerField.value) : []
			const bidOwnerIds: string[] = []
			for (const ownerName of bidOwnerNames) {
				const resolved = await resolveUser(ownerName, tenantId, usersByEmail, usersByName, this.prisma)
				if (!resolved.isExisting) {
					issues.push({
						opportunityId: 'pending',
						fieldName: 'bidOwners',
						columnName: bidOwnerField?.columnName,
						rowIndex: index + 2,
						rawValue: ownerName,
						message: 'Bid owner not found; temp user created'
					})
				}
				bidOwnerIds.push(resolved.userId)
			}
			const businessOwnerField = getFieldInfo(row, ['Business Owner'])
			const businessOwnerName = businessOwnerField?.value
			let ownerId: string | undefined
			if (businessOwnerName) {
				const resolved = await resolveUser(businessOwnerName, tenantId, usersByEmail, usersByName, this.prisma)
				ownerId = resolved.userId
				if (!resolved.isExisting) {
					issues.push({
						opportunityId: 'pending',
						fieldName: 'ownerId',
						columnName: businessOwnerField?.columnName,
						rowIndex: index + 2,
						rawValue: businessOwnerName,
						message: 'Business owner not found; temp user created'
					})
				}
			}

			const created = await this.prisma.opportunity.create({
				data: {
					clientId: client.id,
					tenderRef: getField(row, ['Tender Details']) || null,
					title:
						getField(row, ['Description']) ||
						getField(row, ['Tender Details']) ||
						'Untitled',
					description: getField(row, ['Description']) || null,
					submissionDate: submissionDate ?? undefined,
					status: getField(row, ['Status']) || undefined,
					modeOfSubmission: getField(row, ['Mode of Submission']) || undefined,
					daysLeft,
					priorityRank,
					validityDays,
					dataOwner: businessOwnerName || undefined,
					ownerId: ownerId ?? undefined,
					tenantId
				}
			})
			if (bidOwnerIds.length) {
				await this.prisma.opportunityBidOwner.createMany({
					data: bidOwnerIds.map(userId => ({
						opportunityId: created.id,
						userId
					})),
					skipDuplicates: true
				})
			}
			for (const issue of issues) {
				if (issue.opportunityId === 'pending' && issue.rowIndex === index + 2) {
					issue.opportunityId = created.id
				}
			}
			oppsUpserted += 1
		}

		const readyIssues = issues.filter(issue => issue.opportunityId !== 'pending')
		if (readyIssues.length) {
			await this.prisma.importIssue.createMany({
				data: readyIssues.map(({ opportunityId, ...rest }) => ({ opportunityId, ...rest }))
			})
		}

		return { clientsCreated, oppsUpserted, issues: readyIssues }
	}

	@Get('issues')
	listIssues(@Req() req: any, @Query('opportunityId') opportunityId?: string, @Query('resolved') resolved?: string) {
		const tenantId = req?.user?.tenantId || 'default'
		const resolvedAt = resolved === 'true' ? { not: null } : resolved === 'false' ? null : undefined
		return this.prisma.importIssue.findMany({
			where: {
				opportunity: { tenantId },
				...(opportunityId ? { opportunityId } : {}),
				...(resolvedAt === undefined ? {} : { resolvedAt })
			},
			orderBy: [{ createdAt: 'desc' }]
		})
	}

	@Patch('issues/:id/resolve')
	resolveIssue(@Param('id') id: string) {
		return this.prisma.importIssue.update({
			where: { id },
			data: { resolvedAt: new Date() }
		})
	}

	private async getImportDateFormat(): Promise<ImportDateFormat> {
		const row = await this.prisma.appSetting.findUnique({ where: { key: 'import.dateFormat' } })
		const value = (row?.value || 'MDY').toUpperCase()
		return value === 'DMY' ? 'DMY' : value === 'AUTO' ? 'AUTO' : 'MDY'
	}
}

function normalizeHeader(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getField(row: Record<string, any>, keys: string[]) {
	const keyMap = new Map(Object.keys(row).map(k => [normalizeHeader(k), k]))
	for (const key of keys) {
		const actual = keyMap.get(normalizeHeader(key))
		const value = actual ? row[actual] : undefined
		if (value !== undefined && value !== null && String(value).trim() !== '') {
			return String(value).trim()
		}
	}
	return undefined
}

function getFieldInfo(row: Record<string, any>, keys: string[]) {
	const keyMap = new Map(Object.keys(row).map(k => [normalizeHeader(k), k]))
	for (const key of keys) {
		const actual = keyMap.get(normalizeHeader(key))
		const value = actual ? row[actual] : undefined
		if (value !== undefined && value !== null && String(value).trim() !== '') {
			return { value: String(value).trim(), columnName: actual }
		}
	}
	return undefined
}

function toNumber(value?: string) {
	if (!value) return undefined
	const num = Number(String(value).replace(/,/g, ''))
	return Number.isFinite(num) ? num : undefined
}

type ImportDateFormat = 'MDY' | 'DMY' | 'AUTO'

function parseDate(value?: string, format: ImportDateFormat = 'MDY') {
	if (!value) return undefined
	const trimmed = value.trim()
	const match = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/)
	if (match) {
		const first = Number(match[1])
		const second = Number(match[2])
		const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3])
		const hour = match[4] ? Number(match[4]) : 0
		const minute = match[5] ? Number(match[5]) : 0
		let day = first
		let month = second
		if (format === 'MDY') {
			month = first
			day = second
		} else if (format === 'DMY') {
			day = first
			month = second
		} else {
			if (second > 12 && first <= 12) {
				day = second
				month = first
			}
			if (first > 12 && second <= 12) {
				day = first
				month = second
			}
		}
		if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
		const date = new Date(Date.UTC(year, month - 1, day, hour, minute))
		return Number.isNaN(date.getTime()) ? undefined : date
	}
	const parsed = new Date(trimmed)
	return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function splitOwners(value: string) {
	return value
		.split(/[,;/\n]+/g)
		.map(part => part.trim())
		.filter(Boolean)
}

function normalizeUserKey(value: string) {
	return value.toLowerCase().trim()
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40) || 'user'
}

async function resolveUser(
	value: string,
	tenantId: string,
	usersByEmail: Map<string, string>,
	usersByName: Map<string, string>,
	prisma: PrismaService
) {
	const lookup = normalizeUserKey(value)
	const existingId = usersByEmail.get(lookup) || usersByName.get(lookup)
	if (existingId) {
		return { userId: existingId, isExisting: true }
	}
	const slug = slugify(value)
	const email = value.includes('@')
		? value
		: `temp+${slug}+${Date.now()}@bidops.local`
	const created = await prisma.user.create({
		data: {
			email,
			name: value.trim(),
			role: 'VIEWER',
			isActive: false,
			userType: 'TEMP',
			tenantId
		}
	})
	usersByEmail.set(created.email.toLowerCase(), created.id)
	usersByName.set(created.name.toLowerCase(), created.id)
	return { userId: created.id, isExisting: false }
}
