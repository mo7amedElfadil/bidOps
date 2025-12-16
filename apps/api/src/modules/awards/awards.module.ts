import { Module } from '@nestjs/common'
import { AwardsController } from './awards.controller'
import { AwardsService } from './awards.service'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
	controllers: [AwardsController],
	providers: [AwardsService, PrismaService]
})
export class AwardsModule {}


