import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PricingService } from '../src/modules/pricing/pricing.service'

// Mock PrismaService
const prismaMock = {
	boQItem: {
		findMany: vi.fn()
	},
	pricingPack: {
		findFirst: vi.fn(),
		create: vi.fn()
	},
	fxRate: {
		findMany: vi.fn()
	}
} as any

describe('PricingService', () => {
	let service: PricingService
	
	beforeEach(() => {
		service = new PricingService(prismaMock)
		vi.clearAllMocks()
	})

	it('should calculate pricing pack correctly', async () => {
		// Arrange
		const items = [
			{ unitCost: 100, qty: 2 }, // 200
			{ unitCost: 50, qty: 1 }   // 50
			// Total Base: 250
		]
		prismaMock.boQItem.findMany.mockResolvedValue(items)
		prismaMock.pricingPack.findFirst.mockResolvedValue({ version: 1 })
		prismaMock.pricingPack.create.mockImplementation((args: any) => args.data)
		prismaMock.fxRate.findMany.mockResolvedValue([])

		// Act
		const result = await service.recalcPack('opp-1', 'tenant-1', { 
			overheads: 0.1,  // +25 -> 275
			contingency: 0.1, // +27.5 -> 302.5
			margin: 0.2       // +60.5 -> 363.0
		})

		// Assert
		expect(result.baseCost).toBe(250)
		expect(result.totalPrice).toBeCloseTo(363.0)
		expect(prismaMock.pricingPack.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				version: 2,
				opportunityId: 'opp-1'
			})
		}))
	})

})
