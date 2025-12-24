import { Injectable, BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import * as crypto from 'crypto'
import { ApprovalStatus, ApprovalType } from '@prisma/client'
import { buildFrontendUrl } from '../../utils/frontend-url'
import { RequestWorkApprovalDto } from './dto/request-work-approval.dto'
import { ApprovalDecisionDto } from './dto/approval-decision.dto'
import { NotificationsService } from '../notifications/notifications.service'
import { NotificationActivities } from '../notifications/notifications.constants'
import { RejectWorkApprovalDto } from './dto/reject-work-approval.dto'

const stageOrderMap: Record<string, number> = {
	GO_NO_GO: 1,
	WORKING: 2,
	PRICING: 3,
	FINAL_SUBMISSION: 4,
	LEGAL: 2,
	FINANCE: 3,
	EXECUTIVE: 4
}

const pendingStatuses = new Set<ApprovalStatus>([
	'PENDING',
	'IN_REVIEW',
	'CHANGES_REQUESTED',
	'RESUBMITTED'
])

const stageLabelMap: Record<string, string> = {
	GO_NO_GO: 'Go/No-Go',
	WORKING: 'Working',
	PRICING: 'Pricing',
	FINAL_SUBMISSION: 'Final submission',
	LEGAL: 'Working',
	FINANCE: 'Pricing',
	EXECUTIVE: 'Final submission'
}

const actionLabelMap: Record<string, string> = {
	LEGAL: 'Approve Working Stage',
	FINANCE: 'Approve Pricing Stage',
	EXECUTIVE: 'Approve Final Submission'
}

function getStageLabel(stage?: string | null, type?: string | null) {
	return stageLabelMap[stage || ''] ?? stageLabelMap[type || ''] ?? 'Approval'
}

function getActionLabel(type?: string | null) {
	return actionLabelMap[type || ''] ?? 'Approve'
}

function getStageOrderScore(approval: { stage?: string | null; type?: string | null }) {
	return stageOrderMap[approval.stage || approval.type || ''] ?? 99
}

interface UserContext {
	id?: string
	role?: string
	tenantId?: string
}

@Injectable()
export class ApprovalsService {
	constructor(
		private prisma: PrismaService,
		private notifications: NotificationsService
	) {}

	list(packId: string) {
		return this.prisma.approval.findMany({
			where: { packId },
			orderBy: [{ createdAt: 'asc' }]
		})
	}

	async reviewOverview(tenantId: string, user?: UserContext, scope?: 'mine' | 'all') {
		const packs = await this.prisma.pricingPack.findMany({
			where: {
				opportunity: {
					tenantId
				}
			},
			include: {
				opportunity: {
					include: {
						client: true
					}
				},
				approvals: true
			},
			orderBy: [{ updatedAt: 'desc' }]
		})
		const userId = user?.id
		if (scope !== 'mine' || !userId) {
			return packs.map(pack => this.enrichPack(pack))
		}

		const roleLinks = await this.prisma.userBusinessRole.findMany({
			where: { userId: user.id },
			include: { businessRole: true }
		})
		const roleIds = roleLinks.map(link => link.businessRoleId)
		const roleNames = roleLinks.map(link => link.businessRole?.name).filter(Boolean) as string[]
		const userRole = user.role
		const pendingStatuses = new Set(['PENDING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'RESUBMITTED'])

		return packs
			.map(pack => this.enrichPack(pack))
			.filter(pack =>
				pack.approvals?.some((approval: any) => {
					if (!pendingStatuses.has(approval.status)) return false
					if (approval.approverId && approval.approverId === userId) return true
					if (approval.approverIds?.length && approval.approverIds.includes(userId)) return true
					if (approval.approverRole) {
						if (roleIds.includes(approval.approverRole)) return true
						if (roleNames.includes(approval.approverRole)) return true
						if (userRole && userRole === approval.approverRole) return true
					}
					return false
				})
			)
	}

	private enrichPack(pack: any) {
		const approvals = (pack.approvals || []).slice().sort((a: any, b: any) => {
			return getStageOrderScore(a) - getStageOrderScore(b)
		})
		const nextApproval =
			approvals.filter((approval: any) => pendingStatuses.has(approval.status))[0] || null
		const nextStageLabel = nextApproval ? getStageLabel(nextApproval.stage, nextApproval.type) : null
		const nextActionLabel = nextApproval ? getActionLabel(nextApproval.type) : null
		const blockedReason = nextApproval ? `Waiting for ${nextStageLabel}` : null
		const allApproved =
			approvals.length > 0 &&
			approvals.every((approval: any) => ['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(approval.status))
		const hasRejected = approvals.some((approval: any) => approval.status === 'REJECTED')
		return {
			...pack,
			approvals,
			nextApproval,
			nextStageLabel,
			nextActionLabel,
			blockedReason,
			readyToFinalize: allApproved && !hasRejected && approvals.length > 0
		}
	}

	async requestWorkApproval(dto: RequestWorkApprovalDto, user: UserContext) {
		const tender = await this.prisma.ministryTender.findUnique({
			where: { id: dto.sourceTenderId }
		})
		if (!tender) throw new BadRequestException('Tender not found')
		const tenantId = user.tenantId || 'default'

		const clientName = tender.ministry?.trim() || tender.title || tender.tenderRef || 'Unknown buyer'

		const client = await this.prisma.client.upsert({
			where: { name_tenantId: { name: clientName, tenantId } },
			create: { name: clientName, tenantId },
			update: {}
		})

		let opportunity = await this.prisma.opportunity.findFirst({
			where: {
				sourceTenderId: tender.id,
				tenantId
			}
		})
		if (!opportunity) {
			opportunity = await this.prisma.opportunity.create({
				data: {
					clientId: client.id,
					title: tender.title || tender.tenderRef || 'New Opportunity',
					tenderRef: tender.tenderRef ?? undefined,
					sourcePortal: tender.portal,
					sourceTenderId: tender.id,
					discoveryDate: tender.publishDate || undefined,
					tenantId,
					goNoGoStatus: 'PENDING'
				}
			})
		} else {
			await this.prisma.opportunity.update({
				where: { id: opportunity.id },
				data: { goNoGoStatus: 'PENDING', goNoGoUpdatedAt: new Date() }
			})
		}

		let pack = await this.prisma.pricingPack.findFirst({
			where: { opportunityId: opportunity.id },
			orderBy: { version: 'desc' }
		})
		if (!pack) {
			pack = await this.prisma.pricingPack.create({
				data: { opportunityId: opportunity.id, version: 1 }
			})
		}

		const approval = await this.prisma.approval.create({
			data: {
				packId: pack.id,
				type: 'LEGAL',
				stage: 'GO_NO_GO',
				status: 'PENDING',
				requestedAt: new Date(),
				comment: dto.comment || undefined,
				attachments: dto.attachments ?? [],
				sourceTenderId: tender.id
			}
		})

		const reviewerUserIds = dto.reviewerUserIds?.filter(Boolean) || []
		const reviewerRoleIds = dto.reviewerRoleIds?.filter(Boolean) || []
		const resolvedRecipients = await this.notifications.resolveRecipients({
			tenantId,
			activity: NotificationActivities.REVIEW_REQUESTED,
			stage: 'GO_NO_GO',
			userIds: reviewerUserIds,
			roleIds: reviewerRoleIds
		})
		if (resolvedRecipients.length) {
			await this.prisma.approval.update({
				where: { id: approval.id },
				data: {
					approverIds: resolvedRecipients.map(r => r.id)
				}
			})
		}

		if (dto.assignBidOwnerIds?.length) {
			const users = await this.prisma.user.findMany({
				where: { tenantId, id: { in: dto.assignBidOwnerIds } },
				select: { id: true }
			})
			const validIds = users.map(u => u.id)
			if (validIds.length) {
				await this.prisma.opportunityBidOwner.createMany({
					data: validIds.map(userId => ({ opportunityId: opportunity.id, userId })),
					skipDuplicates: true
				})
			}
		}

		try {
			await this.notifications.dispatch({
				activity: NotificationActivities.REVIEW_REQUESTED,
				stage: 'GO_NO_GO',
				tenantId,
				subject: `Review requested: ${opportunity.title}`,
				body: `A Go/No-Go review has been requested for "${opportunity.title}".`,
				userIds: reviewerUserIds,
				roleIds: reviewerRoleIds,
				opportunityId: opportunity.id,
				actorId: user.id,
				payload: {
					actionUrl: buildFrontendUrl(`/opportunity/${opportunity.id}/approvals`),
					actionLabel: 'Review Go/No-Go'
				}
			})
		} catch (err) {
			console.warn('[notifications] Failed to dispatch review.requested', err)
		}

		return { opportunity, packId: pack.id, approvalId: approval.id }
	}

	async rejectWorkApproval(dto: RejectWorkApprovalDto, user: UserContext) {
		const tender = await this.prisma.ministryTender.findUnique({
			where: { id: dto.sourceTenderId }
		})
		if (!tender) throw new BadRequestException('Tender not found')
		const tenantId = user.tenantId || 'default'

		const clientName = tender.ministry?.trim() || tender.title || tender.tenderRef || 'Unknown buyer'

		const client = await this.prisma.client.upsert({
			where: { name_tenantId: { name: clientName, tenantId } },
			create: { name: clientName, tenantId },
			update: {}
		})

		let opportunity = await this.prisma.opportunity.findFirst({
			where: {
				sourceTenderId: tender.id,
				tenantId
			}
		})
		if (!opportunity) {
			opportunity = await this.prisma.opportunity.create({
				data: {
					clientId: client.id,
					title: tender.title || tender.tenderRef || 'New Opportunity',
					tenderRef: tender.tenderRef ?? undefined,
					sourcePortal: tender.portal,
					sourceTenderId: tender.id,
					discoveryDate: tender.publishDate || undefined,
					tenantId,
					goNoGoStatus: 'REJECTED',
					goNoGoUpdatedAt: new Date()
				}
			})
		} else {
			await this.prisma.opportunity.update({
				where: { id: opportunity.id },
				data: { goNoGoStatus: 'REJECTED', goNoGoUpdatedAt: new Date() }
			})
		}

		let pack = await this.prisma.pricingPack.findFirst({
			where: { opportunityId: opportunity.id },
			orderBy: { version: 'desc' }
		})
		if (!pack) {
			pack = await this.prisma.pricingPack.create({
				data: { opportunityId: opportunity.id, version: 1 }
			})
		}

		const existingApproval = await this.prisma.approval.findFirst({
			where: { packId: pack.id, stage: 'GO_NO_GO' },
			orderBy: { createdAt: 'desc' }
		})

		const timestamp = new Date()
		const updateData: any = {
			status: 'REJECTED' as ApprovalStatus,
			comment: dto.comment || undefined,
			remarks: dto.comment || undefined,
			decidedAt: timestamp,
			signedOn: timestamp,
			approverId: user.id || undefined
		}

		if (existingApproval) {
			await this.prisma.approval.update({
				where: { id: existingApproval.id },
				data: updateData
			})
			return { opportunity, packId: pack.id, approvalId: existingApproval.id }
		}

		const approval = await this.prisma.approval.create({
			data: {
				packId: pack.id,
				type: 'LEGAL',
				stage: 'GO_NO_GO',
				status: 'REJECTED',
				requestedAt: timestamp,
				decidedAt: timestamp,
				signedOn: timestamp,
				comment: dto.comment || undefined,
				remarks: dto.comment || undefined,
				approverId: user.id || undefined,
				sourceTenderId: tender.id
			}
		})

		return { opportunity, packId: pack.id, approvalId: approval.id }
	}

    /**
     * Bootstrap an approval chain with role-based and/or user-specific assignments.
     * @param packId The ID of the pricing pack
     * @param chain An optional array defining the hierarchy. If not provided, defaults to LEGAL -> FINANCE -> EXECUTIVE (Role based)
     */
	async bootstrap(packId: string, chain?: { role?: string; userId?: string; type: ApprovalType; stage?: string }[]) {
        // Default chain
        const steps = chain || [
            { type: 'LEGAL', role: 'Project Manager', stage: 'PRICING' },
            { type: 'FINANCE', role: 'Bid Manager', stage: 'PRICING' },
            { type: 'EXECUTIVE', role: 'Executive', stage: 'FINAL_SUBMISSION' }
        ]

        await this.prisma.approval.deleteMany({ where: { packId, status: 'PENDING' } })

		const pack = await this.prisma.pricingPack.findUnique({
			where: { id: packId },
			select: { opportunity: { select: { tenantId: true } } }
		} as any)
		const tenantId = (pack as any)?.opportunity?.tenantId || 'default'
		const approvalsData = []
		for (const step of steps) {
			let approverIds: string[] = []
			if (step.userId) {
				approverIds = [step.userId]
			} else if (step.role) {
				const roleMatches = await this.prisma.businessRole.findMany({
					where: { tenantId, OR: [{ id: step.role }, { name: step.role }] }
				})
				const roleIds = roleMatches.map(role => role.id)
				if (roleIds.length) {
					const roleUsers = await this.notifications.resolveRecipients({
						tenantId,
						activity: NotificationActivities.REVIEW_REQUESTED,
						stage: step.stage,
						roleIds
					})
					approverIds = roleUsers.map(user => user.id)
				}
			}
			approvalsData.push({
				packId,
				type: step.type,
				stage: (step.stage as any) || 'PRICING',
				approverId: step.userId,
				approverIds,
				approverRole: step.role
			})
		}
		if (approvalsData.length) {
			await this.prisma.approval.createMany({ data: approvalsData })
		}
		return this.list(packId)
	}

    /**
     * Make a decision on an approval step.
     * Validates that the user making the request is allowed to approve (either exact ID match or has the required role).
     */
	async finalize(packId: string, tenantId: string, userId?: string) {
		const pack = await this.prisma.pricingPack.findUnique({
			where: { id: packId },
			include: { opportunity: true }
		})
		if (!pack) throw new BadRequestException('Pricing pack not found')
		if (pack.opportunity.tenantId !== tenantId) {
			throw new BadRequestException('Access denied')
		}

		const allApprovals = await this.prisma.approval.findMany({ where: { packId } })
		if (!allApprovals.length) {
			throw new BadRequestException('No approvals configured for this pack')
		}
		if (allApprovals.some(a => !['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(a.status))) {
			throw new BadRequestException('All approvals must be approved before finalizing')
		}

		await this.prisma.opportunity.update({
			where: { id: pack.opportunityId },
			data: {
				stage: 'Submission',
				status: 'Ready for submission'
			}
		})
		await this.markPricingApproved(pack.opportunityId, userId)
		try {
			const tenantId = pack.opportunity?.tenantId || 'default'
			const actionUrl = buildFrontendUrl(`/opportunity/${pack.opportunityId}/submission`)
			await this.notifications.dispatch({
				activity: NotificationActivities.FINALIZATION_COMPLETED,
				stage: 'FINAL_SUBMISSION',
				tenantId,
				subject: `Bid ready: ${pack.opportunity?.title || 'Opportunity'}`,
				body: `Approvals finalized for ${pack.opportunity?.title || 'Opportunity'}.`,
				opportunityId: pack.opportunityId,
				actorId: userId,
				includeDefaults: true,
				payload: {
					actionUrl,
					actionLabel: 'Review submission readiness'
				}
			})
		} catch (err) {
			console.warn('[notifications] Failed to dispatch finalization', err)
		}
		return { packId }
	}

	private async markPricingApproved(opportunityId: string, userId?: string) {
		const payload: Prisma.OpportunityChecklistCreateInput = {
			opportunity: { connect: { id: opportunityId } },
			pricingApproved: true,
			pricingApprovedAt: new Date(),
			pricingApprovedById: userId || undefined
		}
		await this.prisma.opportunityChecklist.upsert({
			where: { opportunityId },
			update: {
				pricingApproved: true,
				pricingApprovedAt: new Date(),
				pricingApprovedById: userId || undefined
			},
			create: payload
		})
	}

	async decision(id: string, userId: string, userRole: string, body: ApprovalDecisionDto) {
        const approval = await this.prisma.approval.findUnique({ 
			where: { id },
			include: { pack: { include: { opportunity: { include: { client: true } } } } }
		})
        if (!approval) throw new BadRequestException('Approval not found')
        
        // Authorization Check
		let authorized = false
		if (approval.approverId && approval.approverId === userId) {
			authorized = true
		} else if (approval.approverIds?.length && approval.approverIds.includes(userId)) {
			authorized = true
		} else if (approval.approverRole) {
			const roles = await this.prisma.userBusinessRole.findMany({
				where: { userId },
				include: { businessRole: true }
			})
			const match = roles.some(link =>
				link.businessRole?.id === approval.approverRole || link.businessRole?.name === approval.approverRole
			)
			if (match) authorized = true
			else if (userRole === approval.approverRole) authorized = true
		}

        // For dev/testing, if simple IDs are used (e.g. 'legal-user'), allow sloppy match if needed, 
        // but for better security strict match is preferred. 
        // We will assume the controller passes the real user ID and Role from the JWT.
        
        if (!authorized) {
            if (userRole === 'ADMIN') authorized = true
            else throw new BadRequestException('Not authorized to sign this approval')
        }

		const stageOrder = ['GO_NO_GO', 'WORKING', 'PRICING', 'FINAL_SUBMISSION']
		const currentStageIndex = stageOrder.indexOf(approval.stage)
		if (currentStageIndex > 0 && ['IN_REVIEW', 'APPROVED', 'APPROVED_WITH_CONDITIONS', 'CHANGES_REQUESTED', 'RESUBMITTED'].includes(body.status)) {
			const previousStage = stageOrder[currentStageIndex - 1] as any
			const previousApprovals = await this.prisma.approval.findMany({
				where: { packId: approval.packId, stage: previousStage }
			})
			if (previousApprovals.length && previousApprovals.some(a => !['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(a.status))) {
				throw new BadRequestException(`Cannot act on ${approval.stage} before ${previousStage} approvals are completed`)
			}
		}

		const timestamp = new Date()
		const secret = process.env.JWT_SECRET || 'dev-secret'
		// Include signer ID in payload to bind signature to the specific user who acted
		const payload = `${id}:${body.status}:${timestamp.toISOString()}:${userId}`
		const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

		const updateData: any = {
			status: body.status as ApprovalStatus,
			comment: body.comment ?? approval.comment,
			attachments: body.attachments ?? approval.attachments,
			changesRequestedDueDate: body.changesRequestedDueDate
				? new Date(body.changesRequestedDueDate)
				: approval.changesRequestedDueDate,
			signedOn: ['APPROVED', 'APPROVED_WITH_CONDITIONS', 'REJECTED'].includes(body.status)
				? timestamp
				: approval.signedOn,
			remarks: body.comment ?? approval.remarks,
			signature,
			approverId: userId
		}

		const nextReworkCount =
			body.status === 'CHANGES_REQUESTED'
				? approval.reworkCount + 1
				: approval.reworkCount

		updateData.reworkCount = nextReworkCount
		if (body.status !== 'PENDING' && body.status !== 'IN_REVIEW') {
			updateData.decidedAt = timestamp
		}

		const updated = await this.prisma.approval.update({
			where: { id },
			data: updateData
		})

		if (approval.stage === 'GO_NO_GO' && ['APPROVED', 'REJECTED'].includes(body.status)) {
			const pack = await this.prisma.pricingPack.findUnique({ where: { id: approval.packId } })
			if (pack) {
				await this.prisma.opportunity.update({
					where: { id: pack.opportunityId },
					data: {
						goNoGoStatus: body.status as any,
						goNoGoUpdatedAt: timestamp
					}
				})
			}
		}

		try {
			const opportunity = approval.pack?.opportunity
			const tenantId = opportunity?.tenantId || 'default'
			const stageLabel =
				stageLabelMap[approval.stage || approval.type || ''] ?? getStageLabel(approval.stage, approval.type)
			const subject = `${stageLabel} ${body.status}`
			const actionUrl = opportunity ? buildFrontendUrl(`/opportunity/${opportunity.id}/approvals`) : undefined
			await this.notifications.dispatch({
				activity: NotificationActivities.APPROVAL_DECISION,
				stage: approval.stage ?? undefined,
				tenantId,
				subject,
				body: `${subject} — ${opportunity?.title || 'Opportunity'}`,
				opportunityId: opportunity?.id,
				actorId: userId,
				includeDefaults: true,
				payload: {
					status: body.status,
					stage: approval.stage,
					approvalId: approval.id,
					actionUrl,
					actionLabel: `View ${stageLabel.toLowerCase()} approval`
				}
			})
		} catch (err) {
			console.warn('[notifications] Failed to dispatch approval decision', err)
		}

		return updated
	}
}
