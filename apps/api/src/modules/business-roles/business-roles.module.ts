import { Module } from '@nestjs/common'
import { BusinessRolesController } from './business-roles.controller'
import { BusinessRolesService } from './business-roles.service'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
	controllers: [BusinessRolesController],
	providers: [BusinessRolesService, PrismaService]
})
export class BusinessRolesModule {}
