import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApprovalsService } from '../src/modules/approvals/approvals.service'

const prismaMock = {
	approval: {
        deleteMany: vi.fn(),
		findMany: vi.fn(),
        findUnique: vi.fn(),
		createMany: vi.fn(),
		update: vi.fn()
	}
} as any

describe('ApprovalsService', () => {
	let service: ApprovalsService
	
	beforeEach(() => {
		service = new ApprovalsService(prismaMock)
		vi.clearAllMocks()
	})

	it('should bootstrap default approval chain', async () => {
		prismaMock.approval.createMany.mockResolvedValue({ count: 3 })
		prismaMock.approval.findMany.mockResolvedValue([])

		await service.bootstrap('pack-1')
		
		expect(prismaMock.approval.createMany).toHaveBeenCalledWith({
			data: expect.arrayContaining([
				expect.objectContaining({ type: 'LEGAL', approverRole: 'MANAGER' }),
				expect.objectContaining({ type: 'FINANCE', approverRole: 'MANAGER' }),
				expect.objectContaining({ type: 'EXECUTIVE', approverRole: 'ADMIN' })
			])
		})
	})

    it('should bootstrap custom approval chain', async () => {
        const chain = [
            { type: 'LEGAL', userId: 'user-1' },
            { type: 'EXECUTIVE', role: 'ADMIN' }
        ] as any
        
		await service.bootstrap('pack-1', chain)
		
		expect(prismaMock.approval.createMany).toHaveBeenCalledWith({
			data: expect.arrayContaining([
				expect.objectContaining({ type: 'LEGAL', approverId: 'user-1' }),
				expect.objectContaining({ type: 'EXECUTIVE', approverRole: 'ADMIN' })
			])
		})
	})

	it('should sign approval decision with HMAC', async () => {
		process.env.JWT_SECRET = 'test-secret'
        prismaMock.approval.findUnique.mockResolvedValue({ id: 'app-1', approverId: 'user-1' })
		const mockUpdate = vi.fn().mockReturnValue({})
		prismaMock.approval.update = mockUpdate

		await service.decision('app-1', 'user-1', 'MANAGER', { status: 'APPROVED' })

		expect(mockUpdate).toHaveBeenCalled()
		const updateCall = mockUpdate.mock.calls[0][0]
		expect(updateCall.where.id).toBe('app-1')
		
		// check signature exists
		const signature = updateCall.data.signature
		expect(signature).toBeDefined()
		expect(signature).toHaveLength(64) // sha256 hex length
	})
})
