import { PrismaClient, Role, Prisma, UserStatus } from '@prisma/client'
import * as argon2 from 'argon2'

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
	const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'elfadil@it-serve.qa'
	const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'P@ssword1'
	const adminPasswordHash = await argon2.hash(defaultAdminPassword)
	const admin = await prisma.user.upsert({
		where: { email: defaultAdminEmail },
		update: { role: Role.ADMIN, status: UserStatus.ACTIVE, isActive: true },
		create: {
			email: defaultAdminEmail,
			name: 'Elfadil',
			role: Role.ADMIN,
			tenantId,
			passwordHash: adminPasswordHash,
			status: UserStatus.ACTIVE,
			isActive: true,
			mustChangePassword: true
		}
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
