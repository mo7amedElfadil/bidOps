"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const storage_interface_1 = require("../../files/storage.interface");
const common_2 = require("@nestjs/common");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const path_1 = __importDefault(require("path"));
const MAX_CONTEXT_CHARS = 140000;
const PROPOSAL_TEMPLATE = `Front matter
Cover Page

Proposal title: {Project / Framework Agreement Name}

Client: {Entity / Department}

RFP/RFQ reference: {Tender No.}

Submission date: {DD MMM YYYY}

Submitted by: {Company legal name + CR + address}

Confidentiality footer

Document Control

Revision history table (Rev, Date, Author, Summary of changes)

Distribution list

Confidentiality statement

Abbreviations and definitions (optional but helpful)

Table of Contents

Include list of tables / figures (optional)

1. Executive Summary

Purpose: A 1–2 page "why us" that a committee can approve without reading the rest.
Include:

Client need summary (1 paragraph)

Proposed solution overview (what you will deliver)

Key differentiators (3–6 bullets)

High-level delivery approach and timeline

Key assumptions and dependencies

Summary of commercials (only at a high level if allowed)

Suggested visual: "Solution at a glance" diagram or 3-card summary.

2. Company Profile

Include:

Company overview and local presence (CR, office, key capabilities)

Relevant certifications/standards (ISO, security posture, etc. if applicable)

Core service lines relevant to the tender

Partnership ecosystem (technology partners, OEMs, cloud partners)

Relevant past performance (short list + mini case studies)

Suggested tables:

"Relevant Project References" table (Client, Scope, Duration, Value, Contact if allowed)

3. Understanding of Requirements

Include:

Objectives and success criteria (as the client defines them)

Summary of scope in the client’s wording (avoid reinterpreting)

In-scope vs out-of-scope (very clear)

Key stakeholders and operating environment

Constraints (time, site access, approvals, integrations)

Suggested artifacts:

Requirements traceability matrix (Req ID, requirement text, compliance response, section reference)

4. Proposed Solution Overview

Include:

Solution concept (what the overall system/service is)

Key components and how they interact

What’s new vs what’s reused (existing platforms, client systems)

Benefits aligned to client outcomes

Suggested visuals:

High-level architecture block diagram

"Data flow" or "service workflow" diagram

5. Technical Approach and Methodology

Structure it as phases that match your delivery style:

5.1 Delivery Method (Phases)

Typical phases:

Mobilization and kickoff

Discovery / assessment

Design (HLD/LLD)

Build / configure / procurement (if applicable)

Integration

Testing and acceptance

Training and handover

Operations / warranty / support (if applicable)

For each phase include:

Activities

Deliverables

Acceptance criteria

Client inputs needed

5.2 Standards and Engineering Practices

Development standards (if software)

Installation standards (if physical works)

Documentation standards

Change control and approvals

6. Scope of Work and Deliverables

This is the "contract backbone."

Include:

Work packages / tasks (aligned to WBS if provided)

Deliverables list with clear definitions

Deliverable acceptance approach (review cycles, sign-off owners)

Reporting and governance deliverables (weekly report, monthly report, etc.)

Suggested tables:

Deliverables register (Deliverable, Description, Format, Owner, Due date/milestone, Acceptance)

7. Project Management and Governance

Include:

Project organization chart (ITSQ + client)

Roles and responsibilities (RACI)

Communication plan (cadence, meeting types, escalation path)

Schedule management and dependencies

Risk and issue management approach

Change request process

Suggested tables:

RACI matrix

Governance cadence table

8. Implementation Plan and Timeline

Include:

High-level project plan (milestones)

Site rollout plan (if multi-site)

Resource loading approach (how many people when)

Cutover / go-live plan (if relevant)

Hypercare (post go-live stabilization)

Suggested visuals:

Gantt-style milestone timeline

Rollout wave diagram

9. Testing, Quality Assurance, and Acceptance

Include:

Test strategy (unit, integration, system, UAT)

Test environments and data approach

Defect management workflow

Performance/availability targets (if specified)

Acceptance criteria and sign-off process

Suggested artifacts:

Test plan outline + acceptance checklist

10. Security, Privacy, and Compliance

Include only what applies:

Security architecture and controls (RBAC, logging, encryption, hardening)

Data privacy handling (data residency if required)

Vulnerability management and patching

Compliance mapping to client security requirements

Audit readiness (logs, evidence pack approach)

11. Operations, Maintenance, and Support

(If the bid includes post-delivery support)

Include:

Support model (L1/L2/L3), responsibilities split

SLA and service hours

Incident, problem, and change management

Preventive maintenance approach (if hardware)

Monitoring and reporting

Spare parts strategy (if applicable)

Suggested tables:

SLA table (Severity, response time, resolution time, channels)

12. Team Structure and Key Personnel

Include:

Proposed roles and responsibilities

CVs for key staff (appendix or summary)

Staffing plan and availability

Subcontractors and partner roles (if any)

Suggested visual: Org chart + role cards.

13. Risk Management

Include:

Top risks (technical, schedule, site access, integrations, supply chain)

Mitigation strategies

Assumptions and dependencies list

Suggested table:

Risk register (Risk, Impact, Likelihood, Mitigation, Owner)

14. Commercial Proposal

(Place here if single-volume; otherwise separate volume.)

Include:

Pricing summary (by milestone, by work package, or by year)

Payment schedule and invoicing triggers

Commercial assumptions

Validity, lead times, taxes, warranty terms

Optional items / alternates (clearly separated)

Suggested tables:

Price breakdown table

Optional/alternate items table

15. Appendices

Common appendices:

A: Compliance matrix (full)

B: Detailed architecture diagrams

C: Detailed project plan

D: CVs

E: Reference letters (if allowed)

F: Product datasheets (if hardware)

G: Forms requested by the RFP

Optional "always wins" additions (when allowed)

Differentiators / Value-Adds section (measurable enhancements, not scope creep)

Assumptions & Clarifications section (cleanly stated)

RFP Clause Traceability (every key promise mapped to a clause/requirement)`;
let AiService = class AiService {
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async extract(payload, tenantId) {
        if (!payload.opportunityId)
            throw new common_1.BadRequestException('opportunityId is required');
        if (!payload.prompt?.trim())
            throw new common_1.BadRequestException('prompt is required');
        if (!payload.attachmentIds?.length)
            throw new common_1.BadRequestException('attachmentIds required');
        const attachments = await this.prisma.attachment.findMany({
            where: {
                id: { in: payload.attachmentIds },
                entityType: 'Opportunity',
                entityId: payload.opportunityId,
                tenantId
            }
        });
        if (attachments.length === 0)
            throw new common_1.BadRequestException('No valid attachments found');
        const unsupported = [];
        const contextParts = [];
        for (const attachment of attachments) {
            const buffer = await this.storage.downloadBuffer(process.env.ATTACHMENTS_CONTAINER || 'attachments', attachment.storagePath);
            const text = await this.extractText(buffer, attachment.filename);
            if (text) {
                contextParts.push(`### ${attachment.filename}\n${text}`);
            }
            else {
                unsupported.push(attachment.filename);
            }
        }
        const context = contextParts.join('\n\n').slice(0, MAX_CONTEXT_CHARS);
        if (!context)
            throw new common_1.BadRequestException('No parseable text from attachments');
        const outputs = payload.outputs || { compliance: true, clarifications: true, proposal: true };
        const fullPrompt = this.buildPrompt(payload.prompt, context, outputs);
        const provider = payload.provider || process.env.AI_PROVIDER || 'openai';
        const model = provider === 'gemini' ? process.env.GEMINI_MODEL : process.env.OPENAI_MODEL;
        const raw = provider === 'gemini'
            ? await this.callGemini(model || 'gemini-1.5-flash', fullPrompt)
            : await this.callOpenAI(model || 'gpt-4o-mini', fullPrompt);
        const parsed = this.safeJson(raw);
        if (!parsed)
            throw new common_1.BadRequestException('AI response could not be parsed as JSON');
        let complianceCreated = 0;
        let clarificationsCreated = 0;
        let proposalCreated = 0;
        if (outputs.compliance && Array.isArray(parsed.compliance)) {
            const rows = parsed.compliance
                .map((item, index) => ({
                opportunityId: payload.opportunityId,
                clauseNo: String(item.clauseNo || index + 1),
                requirementText: String(item.requirement || item.requirementText || '').trim(),
                mandatoryFlag: Boolean(item.mandatory),
                response: item.response ? String(item.response) : undefined,
                status: item.status ? String(item.status) : undefined,
                owner: item.owner ? String(item.owner) : undefined,
                evidence: item.evidence ? String(item.evidence) : undefined
            }))
                .filter((row) => row.requirementText);
            if (rows.length) {
                await this.prisma.complianceClause.createMany({ data: rows });
                complianceCreated = rows.length;
            }
        }
        if (outputs.clarifications && Array.isArray(parsed.clarifications)) {
            const rows = parsed.clarifications
                .map((item, index) => ({
                opportunityId: payload.opportunityId,
                questionNo: String(item.questionNo || `Q${index + 1}`),
                text: String(item.text || item.question || '').trim(),
                status: item.status ? String(item.status) : 'open',
                responseText: item.responseText ? String(item.responseText) : undefined
            }))
                .filter((row) => row.text);
            if (rows.length) {
                await this.prisma.clarification.createMany({ data: rows });
                clarificationsCreated = rows.length;
            }
        }
        if (outputs.proposal && Array.isArray(parsed.proposalSections)) {
            const rows = parsed.proposalSections
                .map((item) => ({
                opportunityId: payload.opportunityId,
                sectionNo: item.sectionNo ? String(item.sectionNo) : undefined,
                title: String(item.title || 'Untitled Section'),
                content: String(item.content || '').trim(),
                sourcePrompt: payload.prompt,
                sourceAttachments: attachments.map(a => a.id),
                provider,
                model,
                meta: item.meta || undefined
            }))
                .filter((row) => row.content);
            if (rows.length) {
                await this.prisma.proposalSection.createMany({ data: rows });
                proposalCreated = rows.length;
            }
        }
        return {
            provider,
            model,
            attachmentsUsed: attachments.length,
            unsupported,
            complianceCreated,
            clarificationsCreated,
            proposalCreated
        };
    }
    async extractText(buffer, filename) {
        const ext = path_1.default.extname(filename).toLowerCase();
        if (ext === '.pdf') {
            const parsed = await (0, pdf_parse_1.default)(buffer).catch(() => ({ text: '' }));
            return parsed.text || '';
        }
        if (['.txt', '.md', '.csv'].includes(ext)) {
            return buffer.toString('utf-8');
        }
        return '';
    }
    buildPrompt(userPrompt, context, outputs) {
        return `You are an expert bid proposal assistant for a consultancy firm. Use the provided RFP context to draft outputs aligned to ITSQ best practices.\n\nUser prompt:\n${userPrompt}\n\nTemplate guide:\n${PROPOSAL_TEMPLATE}\n\nContext documents:\n${context}\n\nReturn ONLY valid JSON with these keys:\n{
  "compliance": [{"clauseNo":"1","requirement":"...","mandatory":true,"response":"...","status":"...","owner":"...","evidence":"..."}],
  "clarifications": [{"questionNo":"Q1","text":"...","status":"open","responseText":"..."}],
  "proposalSections": [{"sectionNo":"1","title":"...","content":"...","meta":{}}]
}\n\nOnly include the sections the user requested. Requested outputs: compliance=${outputs.compliance ? 'yes' : 'no'}, clarifications=${outputs.clarifications ? 'yes' : 'no'}, proposal=${outputs.proposal ? 'yes' : 'no'}.`;
    }
    safeJson(raw) {
        try {
            return JSON.parse(raw);
        }
        catch {
            const start = raw.indexOf('{');
            const end = raw.lastIndexOf('}');
            if (start >= 0 && end > start) {
                try {
                    return JSON.parse(raw.slice(start, end + 1));
                }
                catch {
                    return null;
                }
            }
            return null;
        }
    }
    async callOpenAI(model, prompt) {
        const key = process.env.OPENAI_API_KEY;
        if (!key)
            throw new common_1.BadRequestException('OPENAI_API_KEY not set');
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: 'You are a bid proposal assistant. Return JSON only.' },
                    { role: 'user', content: prompt }
                ],
            })
        });
        if (!res.ok)
            throw new common_1.BadRequestException(`OpenAI error: ${await res.text()}`);
        const data = await res.json();
        return data?.choices?.[0]?.message?.content || '';
    }
    async callGemini(model, prompt) {
        const key = process.env.GEMINI_API_KEY;
        if (!key)
            throw new common_1.BadRequestException('GEMINI_API_KEY not set');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            })
        });
        if (!res.ok)
            throw new common_1.BadRequestException(`Gemini error: ${await res.text()}`);
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(storage_interface_1.STORAGE_SERVICE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], AiService);
//# sourceMappingURL=ai.service.js.map