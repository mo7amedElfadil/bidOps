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
				unitCurrency: data.unitCurrency || 'QAR',
				markup: Number(data.markup || 0),
				unitPrice: Number(data.unitPrice || 0),
				customFields: data.customFields
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
				unitCurrency: data.unitCurrency,
				markup: data.markup !== undefined ? Number(data.markup) : undefined,
				unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : undefined,
				customFields: data.customFields
			}
		})
	}

	deleteBoq(id: string) {
		return this.prisma.boQItem.delete({ where: { id } })
	}

	listQuotes(opportunityId: string) {
		return this.prisma.vendorQuote.findMany({ where: { opportunityId }, orderBy: [{ createdAt: 'desc' }] })
	}

	listPackRows(opportunityId: string) {
		return this.prisma.pricingPackRow.findMany({ where: { opportunityId }, orderBy: [{ lineNo: 'asc' }] })
	}

	createPackRow(opportunityId: string, data: any) {
		return this.prisma.pricingPackRow.create({
			data: {
				opportunityId,
				lineNo: Number(data.lineNo || 1),
				description: data.description,
				qty: Number(data.qty || 1),
				unit: data.unit,
				unitCost: Number(data.unitCost || 0),
				unitCurrency: data.unitCurrency || 'QAR',
				customFields: data.customFields
			}
		})
	}

	updatePackRow(id: string, data: any) {
		return this.prisma.pricingPackRow.update({
			where: { id },
			data: {
				lineNo: data.lineNo !== undefined ? Number(data.lineNo) : undefined,
				description: data.description,
				qty: data.qty !== undefined ? Number(data.qty) : undefined,
				unit: data.unit,
				unitCost: data.unitCost !== undefined ? Number(data.unitCost) : undefined,
				unitCurrency: data.unitCurrency,
				customFields: data.customFields
			}
		})
	}

	deletePackRow(id: string) {
		return this.prisma.pricingPackRow.delete({ where: { id } })
	}

	listTemplates(tenantId: string, workspace?: string, opportunityId?: string) {
		return this.prisma.pricingTemplate.findMany({
			where: {
				tenantId,
				...(workspace ? { workspace: workspace as any } : {}),
				...(opportunityId ? { OR: [{ scope: 'GLOBAL' }, { opportunityId }] } : {})
			},
			orderBy: [{ scope: 'asc' }, { name: 'asc' }]
		})
	}

	createTemplate(tenantId: string, data: any) {
		if (!data?.name) throw new BadRequestException('template name is required')
		if (!data?.columns) throw new BadRequestException('columns are required')
		return this.prisma.pricingTemplate.create({
			data: {
				name: data.name,
				workspace: data.workspace,
				scope: data.scope ?? 'GLOBAL',
				columns: data.columns,
				tenantId,
				opportunityId: data.opportunityId
			}
		})
	}

	updateTemplate(id: string, data: any) {
		return this.prisma.pricingTemplate.update({
			where: { id },
			data: {
				name: data.name,
				columns: data.columns
			}
		})
	}

	deleteTemplate(id: string) {
		return this.prisma.pricingTemplate.delete({ where: { id } })
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

	async recalcPack(opportunityId: string, tenantId: string, overrides?: Partial<{ overheads: number; contingency: number; fxRate: number; margin: number }>) {
		const items = await this.prisma.boQItem.findMany({ where: { opportunityId } })
		const rates = await this.prisma.fxRate.findMany({ where: { tenantId } })
		const rateMap = new Map(rates.map(r => [r.currency.toUpperCase(), r.rateToQar]))
		const baseCost = items.reduce((sum: number, i) => {
			const currency = (i.unitCurrency || 'QAR').toUpperCase()
			if (currency !== 'QAR' && !rateMap.has(currency)) {
				throw new BadRequestException(`Missing FX rate for ${currency}`)
			}
			const rate = currency === 'QAR' ? 1 : rateMap.get(currency) || 1
			return sum + i.unitCost * rate * i.qty
		}, 0)
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

