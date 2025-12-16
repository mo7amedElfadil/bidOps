import { Module } from '@nestjs/common'
import { ImportController } from './import.controller'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
	controllers: [ImportController],
	providers: [PrismaService]
})
export class ImportModule {}


