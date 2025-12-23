import { Module } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { TendersController } from './tenders.controller'
import { TendersService } from './tenders.service'

@Module({
	controllers: [TendersController],
	providers: [TendersService, PrismaService]
})
export class TendersModule {}
