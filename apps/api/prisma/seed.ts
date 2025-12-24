import { PrismaClient, Role, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	const tenantId = 'default'

	// Clients
	const clientA = await prisma.client.upsert({
		where: { name_tenantId: { name: 'Qatar Rail', tenantId } },
		update: {},
		create: { name: 'Qatar Rail', tenantId, sector: 'Transport' }
	})
	const clientB = await prisma.client.upsert({
		where: { name_tenantId: { name: 'Hamad Medical', tenantId } },
		update: {},
		create: { name: 'Hamad Medical', tenantId, sector: 'Healthcare' }
	})

	// Users (local auth friendly)
	const admin = await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {},
		create: { email: 'admin@example.com', name: 'Admin', role: Role.ADMIN, tenantId }
	})

	const roleCount = await prisma.businessRole.count({ where: { tenantId } })
	if (roleCount === 0) {
		await prisma.businessRole.createMany({
			data: [
				{ name: 'Bid Manager', tenantId },
				{ name: 'Team Member', tenantId },
				{ name: 'Project Manager', tenantId },
				{ name: 'Sales Manager', tenantId },
				{ name: 'Executive', tenantId }
			],
			skipDuplicates: true
		})
	}

	const now = new Date()
	const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
	const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

	// Opportunities
	const opp1 = await prisma.opportunity.create({
		data: {
			title: 'Doha Metro Phase 2',
			clientId: clientA.id,
			submissionDate: in7,
			stage: 'Pricing & Approvals',
			status: 'Open',
			priorityRank: 1,
			tenantId,
			daysLeft: 7
		}
	})

	const opp2 = await prisma.opportunity.create({
		data: {
			title: 'Hospital Information System',
			clientId: clientB.id,
			submissionDate: in14,
			stage: 'Elaboration',
			status: 'Open',
			priorityRank: 2,
			tenantId,
			daysLeft: 14
		}
	})

	// BoQ & Pricing
	await prisma.boQItem.createMany({
		data: [
			{
				opportunityId: opp1.id,
				lineNo: 1,
				description: 'Core network hardware',
				qty: 10,
				unitCost: 5000,
				unitPrice: 5750,
				markup: 0.15
			},
			{
				opportunityId: opp1.id,
				lineNo: 2,
				description: 'Implementation services',
				qty: 200,
				unitCost: 150,
				unitPrice: 180,
				markup: 0.2
			}
		]
	})

	await prisma.vendorQuote.create({
		data: {
			opportunityId: opp1.id,
			vendor: 'TechCorp Qatar',
			quoteNo: 'TCQ-2025-01',
			currency: 'QAR'
		}
	})

	// Clarifications
	await prisma.clarification.create({
		data: {
			opportunityId: opp2.id,
			questionNo: 'Q1',
			text: 'Please clarify required uptime SLA.',
			status: 'open'
		}
	})

	// Staging awards
	await prisma.awardStaging.create({
		data: {
			portal: 'sample',
			tenderRef: 'DEMO-001',
			client: 'Ministry of Technology',
			title: 'IT Infrastructure Upgrade Project',
			awardDate: now,
			winners: ['TechCorp Solutions LLC'],
			awardValue: 1250000,
			codes: ['IT-001', 'INFRA-002'],
			status: 'new',
			sourceUrl: 'https://example.com/awards/demo-001'
		}
	})

	console.log('Seed data created. Admin user:', admin.email)
}

main()
	.catch(err => {
		console.error(err)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
