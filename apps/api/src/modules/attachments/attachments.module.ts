import { Module } from '@nestjs/common'
import { AttachmentsController } from './attachments.controller'
import { PrismaService } from '../../prisma/prisma.service'
import { StorageModule } from '../../files/storage.module'
import { SearchModule } from '../../search/search.module'

@Module({
	imports: [StorageModule, SearchModule],
	controllers: [AttachmentsController],
	providers: [PrismaService]
})
export class AttachmentsModule {}
