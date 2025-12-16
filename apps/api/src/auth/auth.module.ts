import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from '../prisma/prisma.service'
import { JwtStrategy } from './jwt.strategy'
import { OidcStrategy } from './oidc.strategy'
import { AuthController } from './auth.controller'

@Module({
	imports: [
		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET || 'dev-secret',
			signOptions: { expiresIn: '12h' }
		})
	],
	controllers: [AuthController],
	providers: [JwtStrategy, OidcStrategy, PrismaService]
})
export class AuthModule {}


