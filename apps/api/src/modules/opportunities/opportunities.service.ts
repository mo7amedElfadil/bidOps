import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateOpportunityDto } from './dto/create-opportunity.dto'
import { UpdateOpportunityDto } from './dto/update-opportunity.dto'
import { QueryOpportunityDto } from './dto/query-opportunity.dto'
import { parsePagination } from '../../utils/pagination'
import { UpdateChecklistDto } from './dto/update-checklist.dto'

@Injectable()
export class OpportunitiesService {
	constructor(private readonly prisma: PrismaService) {}

	private computeDaysLeft(submissionDate?: Date | string | null): number | null {
		if (!submissionDate) return null
		const date = submissionDate instanceof Date ? submissionDate : new Date(submissionDate)
		if (Number.isNaN(date.getTime())) return null
		const now = new Date()
		// difference in full days, ceiling to count partial days as full
		const diffMs = date.getTime() - now.getTime()
		return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
	}

	async list(query: QueryOpportunityDto, tenantId: string) {
		const where: Prisma.OpportunityWhereInput = { tenantId }
		if (query.clientId) where.clientId = query.clientId
		if (query.status) where.status = query.status
		if (query.stage) where.stage = query.stage
		if (typeof query.maxDaysLeft === 'number') where.daysLeft = { lte: query.maxDaysLeft }
		if (typeof query.minRank === 'number') where.priorityRank = { gte: query.minRank }
		const searchTerm = query.q?.trim()
		if (searchTerm) {
			const like = { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode }
			where.OR = [
				{ title: like },
				{ description: like },
				{ tenderRef: like },
				{ sourcePortal: like },
				{ dataOwner: like },
				{ status: like },
				{ stage: like },
				{ client: { name: like } },
				{
					bidOwners: {
						some: {
							user: {
								OR: [
									{ name: like },
									{ email: like }
								]
							}
						}
					}
				}
			]
		}
		const { page, pageSize, skip } = parsePagination(query, 25, 200)
		const [rows, total] = await this.prisma.$transaction([
			this.prisma.opportunity.findMany({
				where,
				orderBy: [{ submissionDate: 'asc' }, { priorityRank: 'asc' }],
				include: { client: true, bidOwners: { include: { user: true } } },
				skip,
				take: pageSize
			}),
			this.prisma.opportunity.count({ where })
		])

		// Recompute daysLeft for freshness on read
		const items = rows.map(r => {
			const { client, bidOwners, startDate, ...rest } = r
			return {
				...rest,
				clientName: client?.name,
				bidOwners: bidOwners?.map(link => ({
					id: link.userId,
					name: link.user?.name,
					email: link.user?.email
				})) || [],
				daysLeft: this.computeDaysLeft(r.submissionDate),
				startDate
			}
		})
		return { items, total, page, pageSize }
	}

	async create(input: CreateOpportunityDto, tenantId: string) {
		if (!input.clientId && !input.clientName) {
			throw new BadRequestException('clientId or clientName is required')
		}
		let clientId = input.clientId
		const { clientName, ...rest } = input
		if (!clientId && input.clientName) {
			const name = input.clientName.trim()
			if (!name) throw new BadRequestException('clientName cannot be empty')
			const client = await this.prisma.client.upsert({
				where: { name_tenantId: { name, tenantId } },
				create: { name, tenantId },
				update: {}
			})
			clientId = client.id
		}
		const submissionDate = input.submissionDate ? new Date(input.submissionDate) : undefined
		const now = new Date()
		let startDate = now
		if (submissionDate && startDate > submissionDate) {
			startDate = new Date(submissionDate.getTime() - 7 * 24 * 60 * 60 * 1000)
		}
		const daysLeft = this.computeDaysLeft(submissionDate ?? undefined)
		const createData: Prisma.OpportunityCreateInput = {
			client: { connect: { id: clientId! } },
			title: input.title,
			description: input.description ?? null,
			tenderRef: input.tenderRef ?? null,
			boqTemplate: input.boqTemplateId ? { connect: { id: input.boqTemplateId } } : undefined,
			packTemplate: input.packTemplateId ? { connect: { id: input.packTemplateId } } : undefined,
			owner: input.ownerId ? { connect: { id: input.ownerId } } : undefined,
			submissionDate,
			startDate,
			status: input.status ?? undefined,
			stage: input.stage ?? undefined,
			priorityRank: input.priorityRank ?? undefined,
			daysLeft,
			modeOfSubmission: input.modeOfSubmission ?? undefined,
			sourcePortal: input.sourcePortal ?? undefined,
			bondRequired: input.bondRequired ?? undefined,
			validityDays: input.validityDays ?? undefined,
			dataOwner: input.dataOwner ?? undefined,
			tenantId
		}
		return this.prisma.opportunity.create({ data: createData })
	}

	async update(id: string, input: UpdateOpportunityDto, tenantId: string) {
		let clientId = input.clientId
		const { clientName, ...rest } = input
		if (!clientId && input.clientName) {
			const name = input.clientName.trim()
			if (!name) throw new BadRequestException('clientName cannot be empty')
			const client = await this.prisma.client.upsert({
				where: { name_tenantId: { name, tenantId } },
				create: { name, tenantId },
				update: {}
			})
			clientId = client.id
		}
		const submissionDate = input.submissionDate ? new Date(input.submissionDate) : undefined
		const daysLeft = this.computeDaysLeft(submissionDate ?? undefined)
		const updateData: Prisma.OpportunityUpdateInput = {
			client: clientId ? { connect: { id: clientId } } : undefined,
			title: input.title ?? undefined,
			description: input.description ?? undefined,
			tenderRef: input.tenderRef ?? undefined,
			boqTemplate: input.boqTemplateId ? { connect: { id: input.boqTemplateId } } : undefined,
			packTemplate: input.packTemplateId ? { connect: { id: input.packTemplateId } } : undefined,
			owner: input.ownerId ? { connect: { id: input.ownerId } } : undefined,
			submissionDate,
			status: input.status ?? undefined,
			stage: input.stage ?? undefined,
			priorityRank: input.priorityRank ?? undefined,
			daysLeft: daysLeft ?? undefined,
			modeOfSubmission: input.modeOfSubmission ?? undefined,
			sourcePortal: input.sourcePortal ?? undefined,
			bondRequired: input.bondRequired ?? undefined,
			validityDays: input.validityDays ?? undefined,
			dataOwner: input.dataOwner ?? undefined
		}
		return this.prisma.opportunity.update({ where: { id }, data: updateData }).then(async updated => {
			const resolveFields: string[] = []
			if (input.submissionDate) resolveFields.push('submissionDate')
			if (input.priorityRank !== undefined) resolveFields.push('priorityRank')
			if (input.validityDays !== undefined) resolveFields.push('validityDays')
			if (input.daysLeft !== undefined) resolveFields.push('daysLeft')
			if (input.dataOwner !== undefined) resolveFields.push('ownerId')
			if (input.ownerId !== undefined) resolveFields.push('ownerId')
			if (resolveFields.length) {
				await this.prisma.importIssue.updateMany({
					where: { opportunityId: updated.id, fieldName: { in: resolveFields }, resolvedAt: null },
					data: { resolvedAt: new Date() }
				})
			}
			return updated
		})
	}

	async setBidOwners(id: string, userIds: string[], tenantId: string) {
		const users = await this.prisma.user.findMany({
			where: { tenantId, id: { in: userIds } },
			select: { id: true }
		})
		const validIds = users.map(user => user.id)
		await this.prisma.$transaction([
			this.prisma.opportunityBidOwner.deleteMany({ where: { opportunityId: id } }),
			...(validIds.length
				? [
						this.prisma.opportunityBidOwner.createMany({
							data: validIds.map(userId => ({ opportunityId: id, userId }))
						})
					]
				: [])
		])
		await this.prisma.importIssue.updateMany({
			where: { opportunityId: id, fieldName: 'bidOwners', resolvedAt: null },
			data: { resolvedAt: new Date() }
		})
		return { userIds: validIds }
	}

	async get(id: string) {
		const row = await this.prisma.opportunity.findUnique({
			where: { id },
			include: { client: true, bidOwners: { include: { user: true } } }
		})
		if (!row) return null
		const { client, bidOwners, ...rest } = row
		return {
			...rest,
			clientName: client?.name,
			bidOwners: bidOwners?.map(link => ({
				id: link.userId,
				name: link.user?.name,
				email: link.user?.email
			})) || [],
			daysLeft: this.computeDaysLeft(row.submissionDate)
		}
	}

	async delete(id: string) {
		return this.prisma.opportunity.delete({ where: { id } })
	}

	async getChecklist(opportunityId: string) {
		const checklist = await this.prisma.opportunityChecklist.findUnique({
			where: { opportunityId }
		})
		if (checklist) return checklist
		return this.prisma.opportunityChecklist.create({
			data: { opportunityId }
		})
	}

	async updateChecklist(opportunityId: string, input: UpdateChecklistDto, userId: string) {
		const current = await this.prisma.opportunityChecklist.findUnique({
			where: { opportunityId }
		})
		const notes: Record<string, any> = { ...(current?.notes as any || {}) }

		const applyItem = (
			key: string,
			fieldBase: {
				flag: keyof Prisma.OpportunityChecklistUpdateInput
				at: keyof Prisma.OpportunityChecklistUpdateInput
				by: keyof Prisma.OpportunityChecklistUpdateInput
				attachment: keyof Prisma.OpportunityChecklistUpdateInput
			},
			item?: { done?: boolean; attachmentId?: string; notes?: string }
		) => {
			const data: Record<string, any> = {}
			if (!item) return data
			if (item.done !== undefined) {
				if (item.done) {
					data[fieldBase.flag] = true
					data[fieldBase.at] = new Date()
					data[fieldBase.by] = userId
				} else {
					data[fieldBase.flag] = false
					data[fieldBase.at] = null
					data[fieldBase.by] = null
				}
			}
			if (item.attachmentId !== undefined) {
				data[fieldBase.attachment] = item.attachmentId || null
			}
			if (item.notes !== undefined) {
				notes[key] = item.notes
			}
			return data
		}

		const updateData = {
			...applyItem(
				'bondPurchased',
				{
					flag: 'bondPurchased',
					at: 'bondPurchasedAt',
					by: 'bondPurchasedById',
					attachment: 'bondPurchaseAttachmentId'
				},
				input.bondPurchased
			),
			...applyItem(
				'formsCompleted',
				{
					flag: 'formsCompleted',
					at: 'formsCompletedAt',
					by: 'formsCompletedById',
					attachment: 'formsAttachmentId'
				},
				input.formsCompleted
			),
			...applyItem(
				'finalPdfReady',
				{
					flag: 'finalPdfReady',
					at: 'finalPdfReadyAt',
					by: 'finalPdfReadyById',
					attachment: 'finalPdfAttachmentId'
				},
				input.finalPdfReady
			),
			...applyItem(
				'portalCredentialsVerified',
				{
					flag: 'portalCredentialsVerified',
					at: 'portalCredentialsVerifiedAt',
					by: 'portalCredentialsVerifiedById',
					attachment: 'portalCredentialsAttachmentId'
				},
				input.portalCredentialsVerified
			)
		} as Prisma.OpportunityChecklistUpdateInput
		if (Object.keys(notes).length) {
			updateData.notes = notes
		}

		if (current) {
			return this.prisma.opportunityChecklist.update({
				where: { opportunityId },
				data: updateData
			})
		}
		const createData: Prisma.OpportunityChecklistUncheckedCreateInput = {
			opportunityId,
			...(updateData as Record<string, any>)
		}
		return this.prisma.opportunityChecklist.create({
			data: createData
		})
	}
}
