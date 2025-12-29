"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
async function main() {
    const tenantId = 'default';
    const clientA = await prisma.client.upsert({
        where: { name_tenantId: { name: 'Qatar Rail', tenantId } },
        update: {},
        create: { name: 'Qatar Rail', tenantId, sector: 'Transport' }
    });
    const clientB = await prisma.client.upsert({
        where: { name_tenantId: { name: 'Hamad Medical', tenantId } },
        update: {},
        create: { name: 'Hamad Medical', tenantId, sector: 'Healthcare' }
    });
    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'elfadil@it-serve.qa';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'P@ssword1';
    const adminPasswordHash = await argon2.hash(defaultAdminPassword);
    const admin = await prisma.user.upsert({
        where: { email: defaultAdminEmail },
        update: { role: client_1.Role.ADMIN, status: client_1.UserStatus.ACTIVE, isActive: true },
        create: {
            email: defaultAdminEmail,
            name: 'Elfadil',
            role: client_1.Role.ADMIN,
            tenantId,
            passwordHash: adminPasswordHash,
            status: client_1.UserStatus.ACTIVE,
            isActive: true,
            mustChangePassword: true
        }
    });
    const roleCount = await prisma.businessRole.count({ where: { tenantId } });
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
        });
    }
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
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
    });
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
    });
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
    });
    await prisma.vendorQuote.create({
        data: {
            opportunityId: opp1.id,
            vendor: 'TechCorp Qatar',
            quoteNo: 'TCQ-2025-01',
            currency: 'QAR'
        }
    });
    await prisma.clarification.create({
        data: {
            opportunityId: opp2.id,
            questionNo: 'Q1',
            text: 'Please clarify required uptime SLA.',
            status: 'open'
        }
    });
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
    });
    console.log('Seed data created. Admin user:', admin.email);
}
main()
    .catch(err => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map