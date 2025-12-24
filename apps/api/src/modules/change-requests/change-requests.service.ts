import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { NotificationActivities } from '../notifications/notifications.constants'
import { CreateChangeRequestDto } from './dto/create-change-request.dto'
import { UpdateChangeRequestDto } from './dto/update-change-request.dto'

@Injectable()
export class ChangeRequestsService {
	constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

	list(filters: { opportunityId?: string; status?: string }, tenantId: string) {
		const where: any = { opportunity: { tenantId } }
		if (filters.opportunityId) where.opportunityId = filters.opportunityId
		if (filters.status) where.status = filters.status
		return this.prisma.changeRequest.findMany({
			where,
			orderBy: { createdAt: 'desc' }
		})
	}

	async create(dto: CreateChangeRequestDto, userId: string, tenantId: string) {
		const opp = await this.prisma.opportunity.findUnique({
			where: { id: dto.opportunityId },
			include: { bidOwners: { select: { userId: true } } }
		})
		if (!opp || opp.tenantId !== tenantId) {
			throw new BadRequestException('Opportunity not found')
		}
	const changeRequest = await this.prisma.changeRequest.create({
		data: {
			opportunityId: dto.opportunityId,
			changes: dto.changes,
			impact: dto.impact,
			requestedById: userId
		}
	})

	const recipients = new Set<string>()
	if (opp.ownerId) recipients.add(opp.ownerId)
	for (const owner of opp.bidOwners || []) {
		if (owner.userId) recipients.add(owner.userId)
	}

	if (recipients.size) {
		try {
			await this.notifications.dispatch({
				activity: NotificationActivities.CHANGE_REQUEST_CREATED,
				stage: 'CHANGE_REQUEST',
				tenantId,
				subject: `Change request filed for ${opp.title || 'Opportunity'}`,
				body: `${opp.title || 'Opportunity'} has a new change request.`,
				opportunityId: opp.id,
				userIds: Array.from(recipients),
				actorId: userId,
				includeDefaults: false
			})
		} catch (err) {
			console.warn('[notifications] failed to dispatch change request alert', err)
		}
	}

	return changeRequest
}

	update(id: string, dto: UpdateChangeRequestDto) {
		return this.prisma.changeRequest.update({
			where: { id },
			data: {
				status: dto.status as any,
				impact: dto.impact
			}
		})
	}
}
