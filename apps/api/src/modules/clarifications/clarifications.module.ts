import { Module } from '@nestjs/common'
import { ClarificationsController } from './clarifications.controller'
import { ClarificationsService } from './clarifications.service'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
	controllers: [ClarificationsController],
	providers: [ClarificationsService, PrismaService]
})
export class ClarificationsModule {}


