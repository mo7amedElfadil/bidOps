import { clearToken, getToken } from '../utils/auth'

export interface Opportunity {
	id: string
	title: string
	clientId: string
	submissionDate?: string
	status?: string
	stage?: string
	daysLeft?: number
	priorityRank?: number
}

export interface Clarification {
	id: string
	opportunityId: string
	questionNo: string
	text: string
	status?: string
	submittedOn?: string
	responseOn?: string
	responseText?: string
	file?: string
}

export interface BoQItem {
	id: string
	opportunityId: string
	lineNo: number
	category?: string
	description: string
	qty: number
	unit?: string
	oem?: string
	sku?: string
	unitCost: number
	markup: number
	unitPrice: number
}

export interface VendorQuote {
	id: string
	opportunityId: string
	vendor: string
	quoteNo?: string
	validity?: string
	leadTimeDays?: number
	currency?: string
	files?: string
}

export interface PricingPack {
	id: string
	opportunityId: string
	version: number
	baseCost: number
	overheads: number
	contingency: number
	fxRate: number
	margin: number
	totalPrice: number
}

export interface Approval {
	id: string
	packId: string
	type: 'LEGAL' | 'FINANCE' | 'EXECUTIVE'
	approverId: string
	status: 'PENDING' | 'APPROVED' | 'REJECTED'
	signedOn?: string
	remarks?: string
}

export interface Outcome {
	id: string
	opportunityId: string
	status: 'WON' | 'LOST' | 'WITHDRAWN' | 'CANCELLED'
	date: string
	winner?: string
	awardValue?: number
	notes?: string
	reasonCodes: string[]
}

export interface AwardStaging {
	id: string
	portal: string
	tenderRef?: string
	buyer?: string
	title?: string
	closeDate?: string
	awardDate?: string
	winners: string[]
	awardValue?: number
	codes: string[]
	notes?: string
	status?: string
	createdAt?: string
	sourceUrl?: string
}

export interface AwardEvent {
	id: string
	portal: string
	tenderRef?: string
	buyer?: string
	title?: string
	awardDate?: string
	winners: string[]
	awardValue?: number
	codes: string[]
	createdAt?: string
	sourceUrl?: string
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const headers: Record<string, string> = { 'content-type': 'application/json' }
	const token = getToken()
	if (token) headers.Authorization = `Bearer ${token}`
	const res = await fetch(`${API_BASE}${path}`, { headers, ...init })
	if (res.status === 401) {
		clearToken()
		window.location.replace('/auth/dev')
		throw new Error('Unauthorized')
	}
	if (!res.ok) {
		const text = await res.text()
		throw new Error(text || `HTTP ${res.status}`)
	}
	return (await res.json()) as T
}

export const api = {
	// Opportunities
	listOpportunities(params: Record<string, string | number | undefined> = {}) {
		const q = new URLSearchParams()
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== null) q.set(k, String(v))
		}
		return request<Opportunity[]>(`/opportunities?${q.toString()}`)
	},
	getOpportunity(id: string) {
		return request<Opportunity>(`/opportunities/${id}`)
	},
	createOpportunity(input: Partial<Opportunity> & { clientId: string; title: string }) {
		return request<Opportunity>('/opportunities', {
			method: 'POST',
			body: JSON.stringify(input)
		})
	},
	updateOpportunity(id: string, input: Partial<Opportunity>) {
		return request<Opportunity>(`/opportunities/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(input)
		})
	},

	// Clients
	listClients() {
		return request<{ id: string; name: string }[]>('/clients')
	},

	// Clarifications
	listClarifications(opportunityId: string) {
		return request<Clarification[]>(`/clarifications/${opportunityId}`)
	},
	createClarification(opportunityId: string, data: { questionNo: string; text: string; status?: string }) {
		return request<Clarification>(`/clarifications/${opportunityId}`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	updateClarification(id: string, data: Partial<Clarification>) {
		return request<Clarification>(`/clarifications/item/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		})
	},

	// Pricing
	listBoQ(opportunityId: string) {
		return request<BoQItem[]>(`/pricing/${opportunityId}/boq`)
	},
	createBoQ(opportunityId: string, data: Partial<BoQItem>) {
		return request<BoQItem>(`/pricing/${opportunityId}/boq`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	updateBoQ(id: string, data: Partial<BoQItem>) {
		return request<BoQItem>(`/pricing/boq/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		})
	},
	deleteBoQ(id: string) {
		return request<void>(`/pricing/boq/${id}`, { method: 'DELETE' })
	},
	listQuotes(opportunityId: string) {
		return request<VendorQuote[]>(`/pricing/${opportunityId}/quotes`)
	},
	createQuote(opportunityId: string, data: Partial<VendorQuote>) {
		return request<VendorQuote>(`/pricing/${opportunityId}/quotes`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	updateQuote(id: string, data: Partial<VendorQuote>) {
		return request<VendorQuote>(`/pricing/quotes/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		})
	},
	recalcPack(opportunityId: string, data: { overheads?: number; contingency?: number; fxRate?: number; margin?: number }) {
		return request<PricingPack>(`/pricing/${opportunityId}/pack/recalculate`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},

	// Approvals
	listApprovals(packId: string) {
		return request<Approval[]>(`/approvals/${packId}`)
	},
	bootstrapApprovals(packId: string, approvers?: { legal?: string; finance?: string; executive?: string }) {
		return request<Approval[]>(`/approvals/${packId}/bootstrap`, {
			method: 'POST',
			body: JSON.stringify({ approvers })
		})
	},
	submitApprovalDecision(id: string, data: { status: 'APPROVED' | 'REJECTED'; remarks?: string }) {
		return request<Approval>(`/approvals/decision/${id}`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},

	// Submission
	buildSubmissionPack(opportunityId: string) {
		return request<{ path: string; checksum: string; count: number }>(`/submission/${opportunityId}/build`, {
			method: 'POST'
		})
	},

	// Outcomes
	getOutcome(opportunityId: string) {
		return request<Outcome | null>(`/outcomes/${opportunityId}`)
	},
	setOutcome(opportunityId: string, data: Partial<Outcome>) {
		return request<Outcome>(`/outcomes/${opportunityId}`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},

	// Settings
	getSlaSettings() {
		return request<{ warnDays: number; alertDays: number; urgentDays: number }>(`/settings/sla`)
	},
	setSlaSettings(payload: { warnDays: number; alertDays: number; urgentDays: number }) {
		return request<{ warnDays: number; alertDays: number; urgentDays: number }>(`/settings/sla`, {
			method: 'PUT',
			body: JSON.stringify(payload)
		})
	},
	getHolidaySettings() {
		return request<{ dates: string[] }>(`/settings/holidays`)
	},
	setHolidaySettings(payload: { dates: string[] }) {
		return request<{ dates: string[] }>(`/settings/holidays`, {
			method: 'PUT',
			body: JSON.stringify(payload)
		})
	},
	getRetentionPolicy() {
		return request<{ years: number }>(`/settings/retention`)
	},
	setRetentionPolicy(payload: { years: number }) {
		return request<{ years: number }>(`/settings/retention`, {
			method: 'PUT',
			body: JSON.stringify(payload)
		})
	},

	// Awards
	listAwardStaging() {
		return request<AwardStaging[]>('/awards/staging')
	},
	curateAward(id: string) {
		return request<AwardEvent>(`/awards/staging/${id}/curate`, { method: 'POST' })
	},
	listAwardEvents() {
		return request<AwardEvent[]>('/awards/events')
	},

	// Search
	searchAttachments(q: string) {
		return request<
			{
				id: string
				filename: string
				entityType: string
				entityId: string
				storagePath: string
				size: number
				hash?: string
			}[]
		>(`/search?q=${encodeURIComponent(q)}`)
	}
}
