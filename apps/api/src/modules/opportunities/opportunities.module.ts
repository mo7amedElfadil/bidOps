import { Module } from '@nestjs/common'
import { OpportunitiesController } from './opportunities.controller'
import { OpportunitiesService } from './opportunities.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
	controllers: [OpportunitiesController],
	imports: [NotificationsModule],
	providers: [OpportunitiesService, PrismaService]
})
export class OpportunitiesModule {}

