import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import * as crypto from 'crypto'
import { ApprovalStatus, ApprovalType } from '@prisma/client'

@Injectable()
export class ApprovalsService {
	constructor(private prisma: PrismaService) {}

	list(packId: string) {
		return this.prisma.approval.findMany({
			where: { packId },
			orderBy: [{ createdAt: 'asc' }]
		})
	}

    /**
     * Bootstrap an approval chain with role-based and/or user-specific assignments.
     * @param packId The ID of the pricing pack
     * @param chain An optional array defining the hierarchy. If not provided, defaults to LEGAL -> FINANCE -> EXECUTIVE (Role based)
     */
	async bootstrap(packId: string, chain?: { role?: string; userId?: string; type: ApprovalType }[]) {
        // Default chain
        const steps = chain || [
            { type: 'LEGAL', role: 'MANAGER' },
            { type: 'FINANCE', role: 'MANAGER' },
            { type: 'EXECUTIVE', role: 'ADMIN' }
        ]

        await this.prisma.approval.deleteMany({ where: { packId, status: 'PENDING' } })

		await this.prisma.approval.createMany({
			data: steps.map(c => ({ 
                packId, 
                type: c.type, 
                approverId: c.userId, 
                approverRole: c.role 
            }))
		})
		return this.list(packId)
	}

    /**
     * Make a decision on an approval step.
     * Validates that the user making the request is allowed to approve (either exact ID match or has the required role).
     */
	async decision(id: string, userId: string, userRole: string, body: { status: 'APPROVED'|'REJECTED'; remarks?: string }) {
        const approval = await this.prisma.approval.findUnique({ where: { id } })
        if (!approval) throw new BadRequestException('Approval not found')
        
        // Authorization Check
        let authorized = false
        if (approval.approverId && approval.approverId === userId) {
            authorized = true
        } else if (approval.approverRole && userRole === approval.approverRole) {
            authorized = true
        }

        // For dev/testing, if simple IDs are used (e.g. 'legal-user'), allow sloppy match if needed, 
        // but for better security strict match is preferred. 
        // We will assume the controller passes the real user ID and Role from the JWT.
        
        if (!authorized) {
            // Check if user is ADMIN, maybe they can override? For now strict.
            if (userRole === 'ADMIN') authorized = true
            else throw new BadRequestException('Not authorized to sign this approval')
        }

		const timestamp = new Date()
		const secret = process.env.JWT_SECRET || 'dev-secret'
		// Include signer ID in payload to bind signature to the specific user who acted
		const payload = `${id}:${body.status}:${timestamp.toISOString()}:${userId}`
		const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

		return this.prisma.approval.update({
			where: { id },
			data: { 
				status: body.status as any, 
				signedOn: timestamp, 
				remarks: body.remarks,
				signature,
                // If it was a role-based assignment, we lock it to the user who actually signed it
                approverId: userId 
			}
		})
	}
}
