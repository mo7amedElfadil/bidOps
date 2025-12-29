import { Module } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationsModule } from '../notifications/notifications.module'
import { TendersController } from './tenders.controller'
import { TendersService } from './tenders.service'

@Module({
	imports: [NotificationsModule],
	controllers: [TendersController],
	providers: [TendersService, PrismaService]
})
export class TendersModule {}
