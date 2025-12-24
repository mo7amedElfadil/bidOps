import { Module } from '@nestjs/common'
import { ApprovalsController } from './approvals.controller'
import { ApprovalsService } from './approvals.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
	controllers: [ApprovalsController],
	imports: [NotificationsModule],
	providers: [ApprovalsService, PrismaService]
})
export class ApprovalsModule {}

