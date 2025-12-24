import { clearToken, getToken } from '../utils/auth'
import { toast } from '../utils/toast'

export interface Opportunity {
	id: string
	title: string
	clientId: string
	clientName?: string
	dataOwner?: string
	ownerId?: string
	tenderRef?: string
	description?: string
	boqTemplateId?: string
	packTemplateId?: string
	submissionDate?: string
	modeOfSubmission?: string
	sourcePortal?: string
	status?: string
	stage?: string
	daysLeft?: number
	startDate?: string
	priorityRank?: number
	bidOwners?: Array<{ id: string; name?: string; email?: string }>
}

export interface OpportunityChecklist {
	id: string
	opportunityId: string
	bondPurchased: boolean
	bondPurchasedAt?: string | null
	bondPurchasedById?: string | null
	bondPurchaseAttachmentId?: string | null
	formsCompleted: boolean
	formsCompletedAt?: string | null
	formsCompletedById?: string | null
	formsAttachmentId?: string | null
	finalPdfReady: boolean
	finalPdfReadyAt?: string | null
	finalPdfReadyById?: string | null
	finalPdfAttachmentId?: string | null
	portalCredentialsVerified: boolean
	portalCredentialsVerifiedAt?: string | null
	portalCredentialsVerifiedById?: string | null
	portalCredentialsAttachmentId?: string | null
	notes?: Record<string, string>
}

export interface Paginated<T> {
	items: T[]
	total: number
	page: number
	pageSize: number
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
	unitCurrency?: string
	markup: number
	unitPrice: number
	customFields?: Record<string, any>
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

export interface PricingPackRow {
	id: string
	opportunityId: string
	lineNo: number
	description: string
	qty: number
	unit?: string
	unitCost: number
	unitCurrency?: string
	customFields?: Record<string, any>
}

export interface PricingTemplate {
	id: string
	name: string
	workspace: 'BOQ' | 'PACK'
	scope: 'GLOBAL' | 'OPPORTUNITY'
	columns: any
	opportunityId?: string
	tenantId: string
	createdAt?: string
	updatedAt?: string
}

export interface FxRate {
	id: string
	currency: string
	rateToQar: number
	updatedAt?: string
}

export interface ProposalSection {
	id: string
	opportunityId: string
	sectionNo?: string
	title: string
	content: string
	sourcePrompt?: string
	sourceAttachments?: string[]
	provider?: string
	model?: string
	createdAt?: string
	updatedAt?: string
}

export interface ChangeRequest {
	id: string
	opportunityId: string
	requestedById?: string | null
	status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
	changes: string
	impact?: string | null
	createdAt?: string
	updatedAt?: string
}
export interface ImportIssue {
	id: string
	opportunityId: string
	fieldName: string
	columnName?: string
	rowIndex: number
	rawValue?: string
	message: string
	resolvedAt?: string
	createdAt?: string
}

export interface Approval {
	id: string
	packId: string
	type: 'LEGAL' | 'FINANCE' | 'EXECUTIVE'
	approverId: string
	status: 'PENDING' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'RESUBMITTED' | 'APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'REJECTED'
	signedOn?: string
	remarks?: string
	comment?: string
}

export interface WorkApprovalRequestResult {
	opportunity: Opportunity
	packId: string
	approvalId: string
}

export interface ReviewOpportunity {
	id: string
	title: string
	stage?: string
	status?: string
	submissionDate?: string
	client?: { id: string; name: string }
}

export interface PricingPackReview extends PricingPack {
	opportunity: ReviewOpportunity
	approvals: Approval[]
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
	client?: string
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
	client?: string
	title?: string
	awardDate?: string
	winners: string[]
	awardValue?: number
	codes: string[]
	createdAt?: string
	sourceUrl?: string
}

export interface MinistryTender {
	id: string
	portal: string
	tenderRef?: string
	title?: string
	ministry?: string
	publishDate?: string
	closeDate?: string
	requestedSectorType?: string
	tenderBondValue?: number
	documentsValue?: number
	tenderType?: string
	purchaseUrl?: string
	sourceUrl?: string
	status?: string
	createdAt?: string
	updatedAt?: string
}

export interface UserAccount {
	id: string
	email: string
	name: string
	role: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER'
	team?: string
	isActive: boolean
	userType?: string
	businessRoles?: { id: string; name: string }[]
	tenantId: string
	createdAt?: string
	updatedAt?: string
}

export interface BusinessRole {
	id: string
	name: string
	description?: string
	tenantId?: string
	createdAt?: string
	updatedAt?: string
}

export type NotificationChannel = 'EMAIL' | 'IN_APP'
export type NotificationDigestMode = 'INSTANT' | 'DAILY' | 'WEEKLY' | 'OFF'

export interface NotificationItem {
	id: string
	type: string
	channel: NotificationChannel
	activity?: string
	subject?: string
	body?: string
	status?: string
	readAt?: string
	createdAt?: string
	opportunityId?: string
}

export interface NotificationPreference {
	id: string
	userId: string
	activity: string
	channel: NotificationChannel
	enabled: boolean
	digestMode: NotificationDigestMode
}

export interface NotificationRoutingDefault {
	id: string
	tenantId: string
	activity: string
	stage?: string | null
	userIds: string[]
	businessRoleIds: string[]
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
		let message = `Request failed (${res.status})`
		try {
			const contentType = res.headers.get('content-type') || ''
			if (contentType.includes('application/json')) {
				const data = await res.json()
				if (Array.isArray(data?.message)) message = data.message.join(', ')
				else if (data?.message) message = data.message
			} else {
				const text = await res.text()
				if (text) message = text
			}
		} catch {}
		toast.error(message)
		throw new Error(message)
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
		return request<Paginated<Opportunity>>(`/opportunities?${q.toString()}`)
	},
	getOpportunity(id: string) {
		return request<Opportunity>(`/opportunities/${id}`)
	},
	createOpportunity(input: Partial<Opportunity> & { title: string; clientId?: string; clientName?: string }) {
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
	listClients(params: Record<string, string | number | undefined> = {}) {
		const q = new URLSearchParams()
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
		}
		const suffix = q.toString() ? `?${q.toString()}` : ''
		return request<Paginated<{ id: string; name: string }>>(`/clients${suffix}`)
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
	listPackRows(opportunityId: string) {
		return request<PricingPackRow[]>(`/pricing/${opportunityId}/pack-rows`)
	},
	createPackRow(opportunityId: string, data: Partial<PricingPackRow>) {
		return request<PricingPackRow>(`/pricing/${opportunityId}/pack-rows`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	updatePackRow(id: string, data: Partial<PricingPackRow>) {
		return request<PricingPackRow>(`/pricing/pack-rows/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		})
	},
	deletePackRow(id: string) {
		return request<void>(`/pricing/pack-rows/${id}`, { method: 'DELETE' })
	},
	recalcPack(opportunityId: string, data: { overheads?: number; contingency?: number; fxRate?: number; margin?: number }) {
		return request<PricingPack>(`/pricing/${opportunityId}/pack/recalculate`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	listPricingTemplates(params: { workspace?: string; opportunityId?: string } = {}) {
		const q = new URLSearchParams()
		if (params.workspace) q.set('workspace', params.workspace)
		if (params.opportunityId) q.set('opportunityId', params.opportunityId)
		const suffix = q.toString() ? `?${q.toString()}` : ''
		return request<PricingTemplate[]>(`/pricing/templates${suffix}`)
	},
	createPricingTemplate(data: Partial<PricingTemplate>) {
		return request<PricingTemplate>(`/pricing/templates`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	updatePricingTemplate(id: string, data: Partial<PricingTemplate>) {
		return request<PricingTemplate>(`/pricing/templates/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		})
	},
	deletePricingTemplate(id: string) {
		return request<void>(`/pricing/templates/${id}`, { method: 'DELETE' })
	},

	// Approvals
	listApprovals(packId: string) {
		return request<Approval[]>(`/approvals/${packId}`)
	},
	reviewApprovals() {
		return request<PricingPackReview[]>(`/approvals/review`)
	},
	bootstrapApprovals(packId: string, approvers?: { legal?: string; finance?: string; executive?: string }) {
		return request<Approval[]>(`/approvals/${packId}/bootstrap`, {
			method: 'POST',
			body: JSON.stringify({ approvers })
		})
	},
	submitApprovalDecision(
		id: string,
		data: {
			status: 'PENDING' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'RESUBMITTED' | 'APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'REJECTED'
			comment?: string
			attachments?: string[]
			changesRequestedDueDate?: string
		}
	) {
		return request<Approval>(`/approvals/decision/${id}`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	requestWorkApproval(data: {
		sourceTenderId: string
		comment?: string
		attachments?: string[]
		assignBidOwnerIds?: string[]
		reviewerUserIds?: string[]
		reviewerRoleIds?: string[]
	}) {
		return request<WorkApprovalRequestResult>(`/approvals/request`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},

	// Checklist
	getOpportunityChecklist(opportunityId: string) {
		return request<OpportunityChecklist>(`/opportunities/${opportunityId}/checklist`)
	},
	updateOpportunityChecklist(
		opportunityId: string,
		data: {
			bondPurchased?: { done?: boolean; attachmentId?: string; notes?: string }
			formsCompleted?: { done?: boolean; attachmentId?: string; notes?: string }
			finalPdfReady?: { done?: boolean; attachmentId?: string; notes?: string }
			portalCredentialsVerified?: { done?: boolean; attachmentId?: string; notes?: string }
		}
	) {
		return request<OpportunityChecklist>(`/opportunities/${opportunityId}/checklist`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		})
	},

	// Change Requests
	listChangeRequests(params: { opportunityId?: string; status?: string } = {}) {
		const q = new URLSearchParams()
		if (params.opportunityId) q.set('opportunityId', params.opportunityId)
		if (params.status) q.set('status', params.status)
		const suffix = q.toString() ? `?${q.toString()}` : ''
		return request<ChangeRequest[]>(`/change-requests${suffix}`)
	},
	createChangeRequest(data: { opportunityId: string; changes: string; impact?: string }) {
		return request<ChangeRequest>(`/change-requests`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	updateChangeRequest(id: string, data: { status?: ChangeRequest['status']; impact?: string }) {
		return request<ChangeRequest>(`/change-requests/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		})
	},
	finalizeApproval(packId: string) {
		return request<{ packId: string }>(`/approvals/${packId}/finalize`, { method: 'POST' })
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
	getTimezoneSettings() {
		return request<{ offsetHours: number }>(`/settings/timezone`)
	},
	setTimezoneSettings(payload: { offsetHours: number }) {
		return request<{ offsetHours: number }>(`/settings/timezone`, {
			method: 'PUT',
			body: JSON.stringify(payload)
		})
	},
	setBidOwners(opportunityId: string, userIds: string[]) {
		return request<{ userIds: string[] }>(`/opportunities/${opportunityId}/bid-owners`, {
			method: 'PATCH',
			body: JSON.stringify({ userIds })
		})
	},
	getImportDateFormat() {
		return request<{ format: 'MDY' | 'DMY' | 'AUTO' }>(`/settings/import-date-format`)
	},
	setImportDateFormat(payload: { format: 'MDY' | 'DMY' | 'AUTO' }) {
		return request<{ format: 'MDY' | 'DMY' | 'AUTO' }>(`/settings/import-date-format`, {
			method: 'PUT',
			body: JSON.stringify(payload)
		})
	},
	getOpportunityStages() {
		return request<{ stages: string[] }>(`/settings/opportunity/stages`)
	},
	setOpportunityStages(payload: { stages: string[] }) {
		return request<{ stages: string[] }>(`/settings/opportunity/stages`, {
			method: 'PUT',
			body: JSON.stringify(payload)
		})
	},
	getOpportunityStatuses() {
		return request<{ statuses: string[] }>(`/settings/opportunity/statuses`)
	},
	setOpportunityStatuses(payload: { statuses: string[] }) {
		return request<{ statuses: string[] }>(`/settings/opportunity/statuses`, {
			method: 'PUT',
			body: JSON.stringify(payload)
		})
	},
	listFxRates() {
		return request<FxRate[]>(`/settings/fx-rates`)
	},
	upsertFxRate(payload: { currency: string; rateToQar: number }) {
		return request<FxRate>(`/settings/fx-rates`, {
			method: 'POST',
			body: JSON.stringify(payload)
		})
	},
	updateFxRate(id: string, payload: { rateToQar: number }) {
		return request<FxRate>(`/settings/fx-rates/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(payload)
		})
	},
	deleteFxRate(id: string) {
		return request<void>(`/settings/fx-rates/${id}`, { method: 'DELETE' })
	},
	runAiExtract(data: {
		opportunityId: string
		attachmentIds: string[]
		prompt: string
		provider?: 'openai' | 'gemini'
		outputs?: { compliance?: boolean; clarifications?: boolean; proposal?: boolean }
	}) {
		return request<{
			provider: string
			model?: string
			attachmentsUsed: number
			unsupported: string[]
			complianceCreated: number
			clarificationsCreated: number
			proposalCreated: number
		}>(`/ai/extract`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	listProposalSections(opportunityId: string) {
		return request<ProposalSection[]>(`/proposal/${opportunityId}`)
	},
	listImportIssues(params: { opportunityId?: string; resolved?: boolean } = {}) {
		const q = new URLSearchParams()
		if (params.opportunityId) q.set('opportunityId', params.opportunityId)
		if (params.resolved !== undefined) q.set('resolved', String(params.resolved))
		const suffix = q.toString() ? `?${q.toString()}` : ''
		return request<ImportIssue[]>(`/import/issues${suffix}`)
	},
	resolveImportIssue(id: string) {
		return request<ImportIssue>(`/import/issues/${id}/resolve`, { method: 'PATCH' })
	},

	// Awards
	listAwardStaging(params: Record<string, string | number | undefined> = {}) {
		const q = new URLSearchParams()
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
		}
		const suffix = q.toString() ? `?${q.toString()}` : ''
		return request<Paginated<AwardStaging>>(`/awards/staging${suffix}`)
	},
	createAwardStaging(data: Partial<AwardStaging>) {
		return request<AwardStaging>(`/awards/staging`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
	},
	updateAwardStaging(id: string, data: Partial<AwardStaging>) {
		return request<AwardStaging>(`/awards/staging/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		})
	},
	deleteAwardStaging(id: string) {
		return request<void>(`/awards/staging/${id}`, { method: 'DELETE' })
	},
	curateAward(id: string) {
		return request<AwardEvent>(`/awards/staging/${id}/curate`, { method: 'POST' })
	},
	listAwardEvents(params: Record<string, string | number | undefined> = {}) {
		const q = new URLSearchParams()
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
		}
		const suffix = q.toString() ? `?${q.toString()}` : ''
		return request<Paginated<AwardEvent>>(`/awards/events${suffix}`)
	},
	updateAwardEvent(id: string, data: Partial<AwardEvent>) {
		return request<AwardEvent>(`/awards/events/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		})
	},
	deleteAwardEvent(id: string) {
		return request<void>(`/awards/events/${id}`, { method: 'DELETE' })
	},
	triggerCollector(payload: { adapterId?: string; fromDate?: string; toDate?: string }) {
		return request<{ results?: unknown; error?: string }>(`/awards/collect`, {
			method: 'POST',
			body: JSON.stringify(payload || {})
		})
	},

	// Ministry tenders
	listMinistryTenders(params: Record<string, string | number | undefined> = {}) {
		const q = new URLSearchParams()
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
		}
		const suffix = q.toString() ? `?${q.toString()}` : ''
		return request<Paginated<MinistryTender>>(`/tenders${suffix}`)
	},
	createMinistryTender(input: Partial<MinistryTender> & { portal: string }) {
		return request<MinistryTender>(`/tenders`, {
			method: 'POST',
			body: JSON.stringify(input)
		})
	},
	updateMinistryTender(id: string, input: Partial<MinistryTender>) {
		return request<MinistryTender>(`/tenders/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(input)
		})
	},
	deleteMinistryTender(id: string) {
		return request<void>(`/tenders/${id}`, { method: 'DELETE' })
	},
	promoteMinistryTender(id: string) {
		return request<Opportunity>(`/tenders/${id}/promote`, { method: 'POST' })
	},
	triggerTenderCollector(payload: { adapterId?: string; fromDate?: string; toDate?: string }) {
		return request<{ results?: unknown; error?: string }>(`/tenders/collect`, {
			method: 'POST',
			body: JSON.stringify(payload || {})
		})
	},

	// Users
	listUsers(params: Record<string, string | number | undefined> = {}) {
		const q = new URLSearchParams()
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
		}
		const suffix = q.toString() ? `?${q.toString()}` : ''
		return request<Paginated<UserAccount>>(`/users${suffix}`)
	},
	createUser(input: Partial<UserAccount> & { email?: string; password?: string }) {
		return request<UserAccount>(`/users`, {
			method: 'POST',
			body: JSON.stringify(input)
		})
	},
	updateUser(id: string, input: Partial<UserAccount> & { password?: string }) {
		return request<UserAccount>(`/users/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(input)
		})
	},
	setUserBusinessRoles(id: string, roleIds: string[]) {
		return request<{ businessRoleIds: string[] }>(`/users/${id}/business-roles`, {
			method: 'PATCH',
			body: JSON.stringify({ roleIds })
		})
	},
	deleteUser(id: string) {
		return request<void>(`/users/${id}`, { method: 'DELETE' })
	},
	deleteUsers(ids: string[]) {
		return request<{ deleted: number }>(`/users`, {
			method: 'DELETE',
			body: JSON.stringify({ ids })
		})
	},

	// Business roles
	listBusinessRoles() {
		return request<BusinessRole[]>(`/business-roles`)
	},
	createBusinessRole(input: { name: string; description?: string }) {
		return request<BusinessRole>(`/business-roles`, {
			method: 'POST',
			body: JSON.stringify(input)
		})
	},
	updateBusinessRole(id: string, input: { name?: string; description?: string }) {
		return request<BusinessRole>(`/business-roles/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(input)
		})
	},
	deleteBusinessRole(id: string) {
		return request<void>(`/business-roles/${id}`, { method: 'DELETE' })
	},

	// Notifications
	listNotifications(params: Record<string, string | number | undefined> = {}) {
		const q = new URLSearchParams()
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
		}
		const suffix = q.toString() ? `?${q.toString()}` : ''
		return request<Paginated<NotificationItem>>(`/notifications${suffix}`)
	},
	markNotificationRead(id: string) {
		return request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' })
	},
	markAllNotificationsRead() {
		return request<{ count?: number }>(`/notifications/read-all`, { method: 'POST' })
	},
	listNotificationPreferences() {
		return request<NotificationPreference[]>(`/notifications/preferences`)
	},
	saveNotificationPreferences(items: Array<Omit<NotificationPreference, 'id' | 'userId'>>) {
		return request<NotificationPreference[]>(`/notifications/preferences`, {
			method: 'PATCH',
			body: JSON.stringify({ items })
		})
	},
	listNotificationDefaults() {
		return request<NotificationRoutingDefault[]>(`/notifications/defaults`)
	},
	saveNotificationDefaults(items: Array<Omit<NotificationRoutingDefault, 'id' | 'tenantId'>>) {
		return request<NotificationRoutingDefault[]>(`/notifications/defaults`, {
			method: 'PATCH',
			body: JSON.stringify({ items })
		})
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
