import { Global, Module } from '@nestjs/common'
import { TenantService } from './tenant.service'
import { PrismaService } from '../prisma/prisma.service'

@Global()
@Module({
    providers: [TenantService, PrismaService],
    exports: [TenantService]
})
export class TenantModule { }
