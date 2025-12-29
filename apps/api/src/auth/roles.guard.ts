import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY, Role } from './roles.decorator'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector, private jwt: JwtService) {}

	canActivate(context: ExecutionContext): boolean {
		const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass()
		])
		if (!required || required.length === 0) return true
		const req = context.switchToHttp().getRequest()
		let user = req.user as { role?: Role; userId?: string; email?: string; tenantId?: string } | undefined
		if (!user?.role) {
			const auth = req.headers?.authorization || req.headers?.Authorization
			if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
				try {
					const payload = this.jwt.verify(auth.slice(7), {
						secret: process.env.JWT_SECRET || 'dev-secret'
					})
					user = {
						userId: payload.sub,
						email: payload.email,
						role: payload.role,
						tenantId: payload.tenantId
					}
					req.user = user
				} catch {
					return false
				}
			}
		}
		if (!user?.role) return false
		return required.includes(user.role)
	}
}

