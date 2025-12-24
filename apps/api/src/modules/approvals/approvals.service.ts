import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import * as crypto from 'crypto'
import { ApprovalStatus, ApprovalType } from '@prisma/client'
import { RequestWorkApprovalDto } from './dto/request-work-approval.dto'
import { ApprovalDecisionDto } from './dto/approval-decision.dto'

interface UserContext {
	id?: string
	role?: string
	tenantId?: string
}

@Injectable()
export class ApprovalsService {
	constructor(private prisma: PrismaService) {}

	list(packId: string) {
		return this.prisma.approval.findMany({
			where: { packId },
			orderBy: [{ createdAt: 'asc' }]
		})
	}

	async reviewOverview(tenantId: string) {
		return this.prisma.pricingPack.findMany({
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
	}

	async requestWorkApproval(dto: RequestWorkApprovalDto, user: UserContext) {
		const tender = await this.prisma.ministryTender.findUnique({
			where: { id: dto.sourceTenderId }
		})
		if (!tender) throw new BadRequestException('Tender not found')
		const tenantId = user.tenantId || 'default'

		const clientName = tender.ministry?.trim() || tender.title
		if (!clientName) throw new BadRequestException('Tender missing buyer/ministry')

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
            { type: 'LEGAL', role: 'MANAGER', stage: 'PRICING' },
            { type: 'FINANCE', role: 'MANAGER', stage: 'PRICING' },
            { type: 'EXECUTIVE', role: 'ADMIN', stage: 'FINAL_SUBMISSION' }
        ]

        await this.prisma.approval.deleteMany({ where: { packId, status: 'PENDING' } })

		await this.prisma.approval.createMany({
			data: steps.map(c => ({
				packId,
				type: c.type,
				stage: (c.stage as any) || 'PRICING',
				approverId: c.userId,
				approverRole: c.role
			}))
		})
		return this.list(packId)
	}

    /**
     * Make a decision on an approval step.
     * Validates that the user making the request is allowed to approve (either exact ID match or has the required role).
     */
	async finalize(packId: string, tenantId: string) {
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
		return { packId }
	}

	async decision(id: string, userId: string, userRole: string, body: ApprovalDecisionDto) {
        const approval = await this.prisma.approval.findUnique({ where: { id } })
        if (!approval) throw new BadRequestException('Approval not found')
        
        // Authorization Check
        let authorized = false
        if (approval.approverId && approval.approverId === userId) {
            authorized = true
        } else if (approval.approverRole && userRole === approval.approverRole) {
            authorized = true
        }

        // For dev/testing, if simple IDs are used (e.g. 'legal-user'), allow sloppy match if needed, 
        // but for better security strict match is preferred. 
        // We will assume the controller passes the real user ID and Role from the JWT.
        
        if (!authorized) {
            // Check if user is ADMIN, maybe they can override? For now strict.
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

		return updated
	}
}
