import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { PrismaService } from '../../prisma/prisma.service'
import { StorageModule } from '../../files/storage.module'

@Module({
	imports: [StorageModule],
	controllers: [AiController],
	providers: [AiService, PrismaService]
})
export class AiModule {}
