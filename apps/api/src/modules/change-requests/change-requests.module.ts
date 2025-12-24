import { Module } from '@nestjs/common'
import { ChangeRequestsService } from './change-requests.service'
import { ChangeRequestsController } from './change-requests.controller'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
	imports: [NotificationsModule],
	controllers: [ChangeRequestsController],
	providers: [ChangeRequestsService, PrismaService]
})
export class ChangeRequestsModule {}
