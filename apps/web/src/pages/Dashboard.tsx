import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Page } from '../components/Page'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import OnboardingPanel from '../components/OnboardingPanel'
import { DEFAULT_STAGE_LIST, DEFAULT_STATUS_LIST } from '../constants/opportunity-lists'
import { isPostSubmission } from '../utils/postSubmission'

const rolePriority = [
	{ label: 'Sales Manager', id: 'sales-manager' },
	{ label: 'Bid Manager', id: 'bid-manager' },
	{ label: 'Project Manager', id: 'project-manager' },
	{ label: 'Team Member', id: 'team-member' },
	{ label: 'Executive', id: 'executive' }
]

function roleIdFromBusinessRoles(roles?: { name: string }[]) {
	if (!roles?.length) return null
	const names = roles.map(role => role.name.toLowerCase())
	for (const entry of rolePriority) {
		if (names.includes(entry.label.toLowerCase())) return entry.id
	}
	return null
}

function formatDate(value?: string) {
	if (!value) return '—'
	return new Date(value).toLocaleDateString()
}

function formatDuration(hours?: number | null) {
	if (hours === null || hours === undefined) return '—'
	if (hours < 24) return `${hours.toFixed(1)}h`
	return `${(hours / 24).toFixed(1)}d`
}

function daysUntil(date?: string) {
	if (!date) return null
	const diff = new Date(date).getTime() - Date.now()
	return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function Dashboard() {
	const [wizardOpen, setWizardOpen] = useState(false)
	const [wizardStep, setWizardStep] = useState(0)
	const meQuery = useQuery({
		queryKey: ['me'],
		queryFn: () => api.getCurrentUser(),
		staleTime: 5 * 60 * 1000
	})
	const approvalsQuery = useQuery({
		queryKey: ['approvals', 'review', 'mine'],
		queryFn: () => api.reviewApprovals({ scope: 'mine' }),
		refetchOnWindowFocus: false
	})
	const stageListQuery = useQuery({ queryKey: ['opportunity-stages'], queryFn: api.getOpportunityStages })
	const statusListQuery = useQuery({ queryKey: ['opportunity-statuses'], queryFn: api.getOpportunityStatuses })
	const stageOptions = stageListQuery.data?.stages ?? DEFAULT_STAGE_LIST
	const statusOptions = statusListQuery.data?.statuses ?? DEFAULT_STATUS_LIST
	const opportunitiesQuery = useQuery({
		queryKey: ['opportunities', 'dashboard'],
		queryFn: () => api.listOpportunities({ page: 1, pageSize: 25 })
	})

	const onboardingRole = useMemo(() => {
		const roleFromBusiness = roleIdFromBusinessRoles(meQuery.data?.businessRoles)
		if (roleFromBusiness) return roleFromBusiness
		const accessRole = meQuery.data?.role || 'VIEWER'
		if (accessRole === 'ADMIN') return 'admin'
		if (accessRole === 'MANAGER') return 'bid-manager'
		if (accessRole === 'CONTRIBUTOR') return 'team-member'
		return 'sales-manager'
	}, [meQuery.data?.businessRoles, meQuery.data?.role])

	const tendersQuery = useQuery({
		queryKey: ['tenders', 'dashboard'],
		queryFn: () => api.listMinistryTenders({ page: 1, pageSize: 10 }),
		enabled: onboardingRole === 'sales-manager'
	})
	const isAdmin = meQuery.data?.role === 'ADMIN'
	const usersQuery = useQuery({
		queryKey: ['users', 'admin-setup'],
		queryFn: () => api.listUsers({ page: 1, pageSize: 1 }),
		enabled: isAdmin
	})
	const businessRolesQuery = useQuery({
		queryKey: ['business-roles', 'admin-setup'],
		queryFn: () => api.listBusinessRoles(),
		enabled: isAdmin
	})
	const defaultsQuery = useQuery({
		queryKey: ['notification-defaults', 'admin-setup'],
		queryFn: () => api.listNotificationDefaults(),
		enabled: isAdmin
	})
	const onboardingMetricsQuery = useQuery({
		queryKey: ['onboarding-metrics'],
		queryFn: () => api.getOnboardingMetrics(),
		enabled: isAdmin
	})

	const approvals = approvalsQuery.data || []
	const tenders = tendersQuery.data?.items || []
	const upcoming = useMemo(() => {
		const items = opportunitiesQuery.data?.items || []
		const filtered = items.filter(item => {
			if (isPostSubmission(item, { stageOptions, statusOptions })) return false
			const days = daysUntil(item.submissionDate)
			return days !== null && days <= 14 && days >= 0
		})
		return filtered
			.sort((a, b) => new Date(a.submissionDate || 0).getTime() - new Date(b.submissionDate || 0).getTime())
			.slice(0, 6)
	}, [opportunitiesQuery.data?.items, stageOptions, statusOptions])

	const assignedOpportunities = useMemo(() => {
		const items = opportunitiesQuery.data?.items || []
		const userId = meQuery.data?.id
		if (!userId) return []
		return items.filter(item => {
			if (item.ownerId && item.ownerId === userId) return true
			if (item.bidOwners?.some(owner => owner.id === userId)) return true
			return false
		})
	}, [meQuery.data?.id, opportunitiesQuery.data?.items])

	const pendingTenders = tenders.filter(tender => !tender.goNoGoStatus)
	const readyToFinalize = approvals.filter(pack => pack.readyToFinalize)
	const usersCount = usersQuery.data?.total ?? 0
	const rolesCount = businessRolesQuery.data?.length ?? 0
	const defaultsCount = defaultsQuery.data?.length ?? 0
	const needsAdminSetup = isAdmin && (usersCount <= 1 || rolesCount === 0 || defaultsCount === 0)
	const metrics = onboardingMetricsQuery.data
	const wizardSteps = [
		{
			title: 'Create users',
			description: 'Invite or add at least one additional user so workflows can be assigned.',
			actionTo: '/admin/users',
			actionLabel: 'Manage users',
			completed: usersCount > 1
		},
		{
			title: 'Define business roles',
			description: 'Business roles route approvals and notifications across teams.',
			actionTo: '/admin/business-roles',
			actionLabel: 'Manage roles',
			completed: rolesCount > 0
		},
		{
			title: 'Set notification defaults',
			description: 'Configure who is notified for approvals and key events.',
			actionTo: '/notifications',
			actionLabel: 'Configure notifications',
			completed: defaultsCount > 0
		}
	]
	const currentWizard = wizardSteps[wizardStep]

	return (
		<>
			<Page
				title="Home"
				subtitle="Your queue, upcoming deadlines, and the next steps in the bid pipeline."
				actions={
					<div className="flex flex-wrap gap-2">
						<Link to="/tenders/available">
							<Button size="sm" variant="secondary">Collect tenders</Button>
						</Link>
						<Link to="/opportunities">
							<Button size="sm" variant="secondary">View opportunities</Button>
						</Link>
					</div>
				}
			>
				<OnboardingPanel defaultRoleId={onboardingRole} />
				{needsAdminSetup && (
					<div className="mt-6">
						<Card header="Admin setup checklist">
							<p className="text-sm text-muted-foreground">
								Complete these steps so the rest of the team can follow the workflow smoothly.
							</p>
							<div className="mt-3 flex flex-wrap items-center gap-2">
								<Button
									size="sm"
									variant="secondary"
									onClick={() => {
										setWizardStep(0)
										setWizardOpen(true)
									}}
								>
									Launch setup wizard
								</Button>
							</div>
							<div className="mt-4 space-y-3 text-sm">
								<div className="flex items-center justify-between gap-3 rounded border border-border bg-muted px-3 py-2">
									<div>
										<p className="font-semibold text-foreground">Create users</p>
										<p className="text-xs text-muted-foreground">Add at least one more user beyond the default admin.</p>
									</div>
									<div className="flex items-center gap-3">
										<span className={`rounded-full px-2 py-0.5 text-xs ${usersCount > 1 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
											{usersCount > 1 ? 'Done' : 'Pending'}
										</span>
										<Link to="/admin/users" className="text-xs font-semibold text-accent hover:underline">
											Manage users
										</Link>
									</div>
								</div>
								<div className="flex items-center justify-between gap-3 rounded border border-border bg-muted px-3 py-2">
									<div>
										<p className="font-semibold text-foreground">Define business roles</p>
										<p className="text-xs text-muted-foreground">Roles power approvals and notification routing.</p>
									</div>
									<div className="flex items-center gap-3">
										<span className={`rounded-full px-2 py-0.5 text-xs ${rolesCount > 0 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
											{rolesCount > 0 ? 'Done' : 'Pending'}
										</span>
										<Link to="/admin/business-roles" className="text-xs font-semibold text-accent hover:underline">
											Manage roles
										</Link>
									</div>
								</div>
								<div className="flex items-center justify-between gap-3 rounded border border-border bg-muted px-3 py-2">
									<div>
										<p className="font-semibold text-foreground">Set notification defaults</p>
										<p className="text-xs text-muted-foreground">Define who gets notified when approvals are requested.</p>
									</div>
									<div className="flex items-center gap-3">
										<span className={`rounded-full px-2 py-0.5 text-xs ${defaultsCount > 0 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
											{defaultsCount > 0 ? 'Done' : 'Pending'}
										</span>
										<Link to="/notifications" className="text-xs font-semibold text-accent hover:underline">
											Configure notifications
										</Link>
									</div>
								</div>
							</div>
							{metrics && (
								<div className="mt-4 rounded border border-border bg-card p-3 text-xs text-muted-foreground">
									<p className="font-semibold text-foreground">Telemetry</p>
									<div className="mt-2 grid gap-2 sm:grid-cols-2">
										<div>
											<p>
												Setup started:{' '}
												<span className="font-semibold">{formatDate(metrics.startedAt || undefined)}</span>
											</p>
											<p>
												Users completed:{' '}
												<span className="font-semibold">{formatDuration(metrics.durationsHours?.users)}</span>
											</p>
											<p>
												Roles completed:{' '}
												<span className="font-semibold">{formatDuration(metrics.durationsHours?.roles)}</span>
											</p>
											<p>
												Defaults completed:{' '}
												<span className="font-semibold">{formatDuration(metrics.durationsHours?.defaults)}</span>
											</p>
											<p>
												Overall:{' '}
												<span className="font-semibold">{formatDuration(metrics.durationsHours?.overall)}</span>
											</p>
										</div>
										<div>
											<p>Approval turnaround (90d):</p>
											<p>
												Avg:{' '}
												<span className="font-semibold">{formatDuration(metrics.approvalsTurnaround?.averageHours || null)}</span>
											</p>
											<p>
												Median:{' '}
												<span className="font-semibold">{formatDuration(metrics.approvalsTurnaround?.medianHours || null)}</span>
											</p>
											<p>
												Late decisions:{' '}
												<span className="font-semibold">{metrics.approvalsTurnaround?.lateCount ?? 0}</span>
											</p>
										</div>
									</div>
								</div>
							)}
						</Card>
					</div>
				)}

				<div className="mt-6 grid gap-4 lg:grid-cols-3">
				<Card header="My approvals">
					{approvalsQuery.isLoading ? (
						<p className="text-sm text-muted-foreground">Loading approvals...</p>
					) : approvals.length === 0 ? (
						<p className="text-sm text-muted-foreground">No approvals waiting for you right now.</p>
					) : (
						<div className="space-y-3">
							{approvals.slice(0, 5).map(pack => (
								<div key={pack.id} className="rounded border border-border bg-muted p-3 text-sm">
									<p className="font-semibold text-foreground">{pack.opportunity.title}</p>
									<p className="text-xs text-muted-foreground">
										{pack.nextStageLabel || 'Next step'} • {pack.nextActionLabel || 'Review required'}
									</p>
									<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
										<span>Due: {formatDate(pack.opportunity.submissionDate)}</span>
										<Link to={`/opportunity/${pack.opportunity.id}`} className="text-accent hover:underline">
											Open opportunity
										</Link>
									</div>
								</div>
							))}
							<Link to="/approvals/review" className="text-xs font-semibold text-accent hover:underline">
								Open approvals queue
							</Link>
						</div>
					)}
				</Card>

				<Card header="My focus">
					{onboardingRole === 'sales-manager' ? (
						<div className="space-y-3 text-sm">
							{tendersQuery.isLoading ? (
								<p className="text-sm text-muted-foreground">Loading tenders...</p>
							) : pendingTenders.length === 0 ? (
								<p className="text-sm text-muted-foreground">No new tenders awaiting Go/No-Go.</p>
							) : (
								<>
									{pendingTenders.slice(0, 5).map(tender => (
										<div key={tender.id} className="rounded border border-border bg-muted p-3">
											<p className="font-semibold text-foreground">{tender.title}</p>
											<p className="text-xs text-muted-foreground">{tender.tenderRef || 'No ref'}</p>
											<Link
												to="/tenders/available"
												className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline"
											>
												Request approval
											</Link>
										</div>
									))}
									<Link to="/tenders/available" className="text-xs font-semibold text-accent hover:underline">
										View all tenders
									</Link>
								</>
							)}
						</div>
					) : onboardingRole === 'executive' || onboardingRole === 'admin' ? (
						<div className="space-y-3 text-sm text-muted-foreground">
							{readyToFinalize.length === 0 ? (
								<p>No bids are ready for final sign-off.</p>
							) : (
								<>
									{readyToFinalize.slice(0, 5).map(pack => (
										<div key={pack.id} className="rounded border border-border bg-muted p-3">
											<p className="font-semibold text-foreground">{pack.opportunity.title}</p>
											<p className="text-xs text-muted-foreground">Ready to finalize.</p>
											<Link to="/approvals/review" className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline">
												Finalize bid
											</Link>
										</div>
									))}
									<Link to="/approvals/review" className="text-xs font-semibold text-accent hover:underline">
										Open approvals queue
									</Link>
								</>
							)}
						</div>
					) : (
						<div className="space-y-3 text-sm">
							{assignedOpportunities.length === 0 ? (
								<p className="text-sm text-muted-foreground">No opportunities assigned yet.</p>
							) : (
								<>
									{assignedOpportunities.slice(0, 5).map(item => (
										<div key={item.id} className="rounded border border-border bg-muted p-3">
											<p className="font-semibold text-foreground">{item.title}</p>
											<p className="text-xs text-muted-foreground">{item.clientName || 'Unknown client'}</p>
											<Link to={`/opportunity/${item.id}`} className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline">
												Open workspace
											</Link>
										</div>
									))}
									<Link to="/opportunities" className="text-xs font-semibold text-accent hover:underline">
										View all opportunities
									</Link>
								</>
							)}
						</div>
					)}
				</Card>

				<Card header="Upcoming deadlines">
					{opportunitiesQuery.isLoading ? (
						<p className="text-sm text-muted-foreground">Loading deadlines...</p>
					) : upcoming.length === 0 ? (
						<p className="text-sm text-muted-foreground">No deadlines in the next 14 days.</p>
					) : (
						<div className="space-y-3">
							{upcoming.map(item => (
								<div key={item.id} className="flex items-start justify-between gap-3 text-sm">
									<div>
										<p className="font-semibold text-foreground">{item.title}</p>
										<p className="text-xs text-muted-foreground">{item.clientName || 'Unknown client'}</p>
										<p className="text-xs text-muted-foreground">{item.stage || '—'} • {item.status || '—'}</p>
									</div>
									<div className="text-right text-xs text-muted-foreground">
										<div>{formatDate(item.submissionDate)}</div>
										<div className="font-semibold text-foreground">
											{daysUntil(item.submissionDate)}d left
										</div>
									</div>
								</div>
							))}
							<Link to="/opportunities" className="text-xs font-semibold text-accent hover:underline">
								View full pipeline
							</Link>
						</div>
					)}
				</Card>

				<Card header="Quick actions">
					<div className="space-y-3 text-sm text-muted-foreground">
						<div className="rounded border border-border bg-muted p-3">
							<p className="font-semibold text-foreground">Run collector</p>
							<p className="text-xs text-muted-foreground">Pull new tenders with a date range.</p>
							<Link to="/tenders/available" className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline">
								Open tenders
							</Link>
						</div>
						<div className="rounded border border-border bg-muted p-3">
							<p className="font-semibold text-foreground">Import tracker</p>
							<p className="text-xs text-muted-foreground">Bulk import opportunities and owners.</p>
							<Link to="/import/tracker" className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline">
								Start import
							</Link>
						</div>
						<div className="rounded border border-border bg-muted p-3">
							<p className="font-semibold text-foreground">Create opportunity</p>
							<p className="text-xs text-muted-foreground">Add a new bid manually.</p>
							<Link to="/opportunities" className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline">
								Go to opportunities
							</Link>
						</div>
						<div className="rounded border border-border bg-muted p-3">
							<p className="font-semibold text-foreground">My queue</p>
							<p className="text-xs text-muted-foreground">See opportunities assigned to you.</p>
							<Link to="/opportunities?mine=true" className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline">
								View my queue
							</Link>
						</div>
					</div>
				</Card>
				</div>
			</Page>

			{wizardOpen && currentWizard && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
					<div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-lg">
						<div className="flex items-center justify-between">
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setup wizard</p>
							<button
								className="text-xs text-muted-foreground hover:text-foreground"
								onClick={() => setWizardOpen(false)}
							>
								Close
							</button>
						</div>
						<h3 className="mt-2 text-lg font-semibold text-foreground">
							Step {wizardStep + 1} of {wizardSteps.length}: {currentWizard.title}
						</h3>
						<p className="mt-2 text-sm text-muted-foreground">{currentWizard.description}</p>
						<div className="mt-3 flex items-center gap-2 text-xs">
							<span className={`rounded-full px-2 py-0.5 ${currentWizard.completed ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
								{currentWizard.completed ? 'Done' : 'Pending'}
							</span>
							<Link
								to={currentWizard.actionTo}
								className="text-xs font-semibold text-accent hover:underline"
								onClick={() => setWizardOpen(false)}
							>
								{currentWizard.actionLabel}
							</Link>
						</div>
						<div className="mt-6 flex items-center justify-between">
							<Button
								size="sm"
								variant="secondary"
								disabled={wizardStep === 0}
								onClick={() => setWizardStep(step => Math.max(0, step - 1))}
							>
								Back
							</Button>
							<Button
								size="sm"
								variant="primary"
								onClick={() => {
									if (wizardStep >= wizardSteps.length - 1) {
										setWizardOpen(false)
									} else {
										setWizardStep(step => Math.min(wizardSteps.length - 1, step + 1))
									}
								}}
							>
								{wizardStep >= wizardSteps.length - 1 ? 'Finish' : 'Next'}
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
