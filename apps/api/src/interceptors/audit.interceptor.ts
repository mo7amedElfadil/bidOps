import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
	constructor(private prisma: PrismaService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const req = context.switchToHttp().getRequest()
		const method = req.method?.toUpperCase?.() || ''
		const isMutating = method === 'POST' || method === 'PATCH' || method === 'DELETE'
		if (!isMutating) return next.handle()

		const actorId = req.user?.userId || 'anonymous'
		const entity = req.route?.path || req.originalUrl || 'unknown'
		const before = { body: req.body }

		return next.handle().pipe(
			tap(async (afterValue) => {
				try {
					await this.prisma.auditLog.create({
						data: {
							actorId,
							action: method,
							entity,
							before: before as any,
							after: afterValue as any,
							ip: req.ip || undefined
						}
					})
				} catch {
					// swallow audit failures
				}
			})
		)
	}
}


