import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from '../prisma/prisma.service'
import { JwtStrategy } from './jwt.strategy'
import { AuthController } from './auth.controller'
import { AuthBootstrapService } from './auth.bootstrap'
import { NotificationsModule } from '../modules/notifications/notifications.module'

// Conditionally load OIDC strategy only when configured
const providers: any[] = [JwtStrategy, PrismaService, AuthBootstrapService]
if (process.env.AUTH_PROVIDER === 'oidc' && process.env.OIDC_ISSUER) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { OidcStrategy } = require('./oidc.strategy')
	providers.push(OidcStrategy)
}

@Module({
	imports: [
		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET || 'dev-secret',
			signOptions: { expiresIn: '12h' }
		}),
		NotificationsModule
	],
	controllers: [AuthController],
	providers,
	exports: [JwtModule]
})
export class AuthModule { }
