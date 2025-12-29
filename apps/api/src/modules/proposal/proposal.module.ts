import { Module } from '@nestjs/common'
import { ProposalController } from './proposal.controller'
import { PrismaService } from '../../prisma/prisma.service'
import { TenantModule } from '../../tenant/tenant.module'

@Module({
	imports: [TenantModule],
	controllers: [ProposalController],
	providers: [PrismaService]
})
export class ProposalModule {}
