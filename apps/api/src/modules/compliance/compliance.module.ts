import { Module } from '@nestjs/common'
import { ComplianceController } from './compliance.controller'
import { ComplianceService } from './compliance.service'
import { PrismaService } from '../../prisma/prisma.service'
import { BlobService } from '../../files/blob.service'

@Module({
	controllers: [ComplianceController],
	providers: [ComplianceService, PrismaService, BlobService]
})
export class ComplianceModule {}


