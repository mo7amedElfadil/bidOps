import { Module } from '@nestjs/common'
import { SubmissionController } from './submission.controller'
import { SubmissionService } from './submission.service'
import { PrismaService } from '../../prisma/prisma.service'
import { StorageModule } from '../../files/storage.module'
import { TenantService } from '../../tenant/tenant.service'

@Module({
	imports: [StorageModule],
	controllers: [SubmissionController],
	providers: [SubmissionService, PrismaService, TenantService]
})
export class SubmissionModule {}
