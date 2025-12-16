import { Module } from '@nestjs/common'
import { OutcomesController } from './outcomes.controller'
import { OutcomesService } from './outcomes.service'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
	controllers: [OutcomesController],
	providers: [OutcomesService, PrismaService]
})
export class OutcomesModule {}


