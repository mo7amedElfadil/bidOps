import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PricingService {
	constructor(private prisma: PrismaService) {}

	listBoq(opportunityId: string) {
		return this.prisma.boQItem.findMany({ where: { opportunityId }, orderBy: [{ lineNo: 'asc' }] })
	}

	createBoq(opportunityId: string, data: any) {
		return this.prisma.boQItem.create({
			data: {
				opportunityId,
				lineNo: Number(data.lineNo || 1),
				category: data.category,
				description: data.description,
				qty: Number(data.qty || 1),
				unit: data.unit,
				oem: data.oem,
				sku: data.sku,
				unitCost: Number(data.unitCost || 0),
				markup: Number(data.markup || 0),
				unitPrice: Number(data.unitPrice || 0)
			}
		})
	}

	updateBoq(id: string, data: any) {
		return this.prisma.boQItem.update({
			where: { id },
			data: {
				lineNo: data.lineNo !== undefined ? Number(data.lineNo) : undefined,
				category: data.category,
				description: data.description,
				qty: data.qty !== undefined ? Number(data.qty) : undefined,
				unit: data.unit,
				oem: data.oem,
				sku: data.sku,
				unitCost: data.unitCost !== undefined ? Number(data.unitCost) : undefined,
				markup: data.markup !== undefined ? Number(data.markup) : undefined,
				unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : undefined
			}
		})
	}

	deleteBoq(id: string) {
		return this.prisma.boQItem.delete({ where: { id } })
	}

	listQuotes(opportunityId: string) {
		return this.prisma.vendorQuote.findMany({ where: { opportunityId }, orderBy: [{ createdAt: 'desc' }] })
	}

	createQuote(opportunityId: string, data: any) {
		return this.prisma.vendorQuote.create({
			data: {
				opportunityId,
				vendor: data.vendor,
				quoteNo: data.quoteNo,
				validity: data.validity ? new Date(data.validity) : undefined,
				leadTimeDays: data.leadTimeDays !== undefined ? Number(data.leadTimeDays) : undefined,
				currency: data.currency,
				files: data.files
			}
		})
	}

	updateQuote(id: string, data: any) {
		return this.prisma.vendorQuote.update({
			where: { id },
			data: {
				vendor: data.vendor,
				quoteNo: data.quoteNo,
				validity: data.validity ? new Date(data.validity) : undefined,
				leadTimeDays: data.leadTimeDays !== undefined ? Number(data.leadTimeDays) : undefined,
				currency: data.currency,
				files: data.files
			}
		})
	}

	async recalcPack(opportunityId: string, overrides?: Partial<{ overheads: number; contingency: number; fxRate: number; margin: number }>) {
		const items = await this.prisma.boQItem.findMany({ where: { opportunityId } })
		const baseCost = items.reduce((sum: number, i) => sum + i.unitCost * i.qty, 0)
		const overheads = overrides?.overheads ?? 0
		const contingency = overrides?.contingency ?? 0
		const fxRate = overrides?.fxRate ?? 1
		const margin = overrides?.margin ?? 0.15
		const minMargin = Number(process.env.PRICING_MIN_MARGIN ?? 0.1)

		if (margin < minMargin) {
			throw new BadRequestException(`Margin below guardrail: minimum ${minMargin * 100}%`)
		}

		const withOverheads = baseCost * (1 + overheads)
		const withCont = withOverheads * (1 + contingency)
		const subtotal = withCont * fxRate
		const totalPrice = subtotal * (1 + margin)

		const last = await this.prisma.pricingPack.findFirst({
			where: { opportunityId },
			orderBy: { version: 'desc' }
		})
		const version = (last?.version || 0) + 1
		const pack = await this.prisma.pricingPack.create({
			data: {
				opportunityId,
				version,
				baseCost,
				overheads,
				contingency,
				fxRate,
				margin,
				totalPrice
			}
		})
		return { pack, baseCost, totalPrice }
	}
}


