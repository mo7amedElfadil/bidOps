import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUserRole } from '../utils/auth'

type FlowStep = {
	id: string
	title: string
	description: string
	to: string
	cta: string
}

type RoleFlow = {
	id: string
	label: string
	summary: string
	steps: FlowStep[]
}

const ROLE_FLOWS: RoleFlow[] = [
	{
		id: 'sales-manager',
		label: 'Sales Manager',
		summary: 'Find tenders, request Go/No-Go, and keep leadership informed.',
		steps: [
			{
				id: 'collect-tenders',
				title: 'Collect new tenders',
				description: 'Run the Monaqasat collector with the latest date range.',
				to: '/tenders/available',
				cta: 'Open tenders'
			},
			{
				id: 'request-approval',
				title: 'Request approval to bid',
				description: 'Submit Go/No-Go for the best-fit tenders.',
				to: '/tenders/available',
				cta: 'Request approval'
			},
			{
				id: 'assign-owners',
				title: 'Assign bid owners',
				description: 'Ensure the right bid owners are assigned once approved.',
				to: '/opportunities',
				cta: 'View opportunities'
			}
		]
	},
	{
		id: 'bid-manager',
		label: 'Bid Manager',
		summary: 'Drive the bid lifecycle from scope to submission readiness.',
		steps: [
			{
				id: 'confirm-scope',
				title: 'Confirm scope + owners',
				description: 'Validate the opportunity summary, owners, and priority.',
				to: '/opportunities',
				cta: 'Review opportunities'
			},
			{
				id: 'build-compliance',
				title: 'Build compliance matrix',
				description: 'Open an opportunity and import clauses to map requirements.',
				to: '/opportunities',
				cta: 'Open compliance'
			},
			{
				id: 'kickoff-approvals',
				title: 'Kick off approvals',
				description: 'Move the bid into approvals with clear comments.',
				to: '/approvals/review',
				cta: 'Open approvals'
			}
		]
	},
	{
		id: 'project-manager',
		label: 'Project Manager',
		summary: 'Track execution readiness, checklists, and submission steps.',
		steps: [
			{
				id: 'monitor-deadlines',
				title: 'Monitor deadlines',
				description: 'Watch SLA indicators and upcoming submission dates.',
				to: '/opportunities',
				cta: 'View pipeline'
			},
			{
				id: 'checklist',
				title: 'Complete submission checklist',
				description: 'Open an opportunity and update checklist milestones.',
				to: '/opportunities',
				cta: 'Open checklist'
			},
			{
				id: 'final-approval',
				title: 'Approve final submission',
				description: 'Give the final sign-off before submission.',
				to: '/approvals/review',
				cta: 'Review approvals'
			}
		]
	},
	{
		id: 'team-member',
		label: 'Team Member',
		summary: 'Support compliance, clarifications, and pricing data entry.',
		steps: [
			{
				id: 'attachments',
				title: 'Upload attachments',
				description: 'Open an opportunity and upload RFP docs for extraction.',
				to: '/opportunities',
				cta: 'Upload files'
			},
			{
				id: 'clarifications',
				title: 'Draft clarifications',
				description: 'Open an opportunity and record Q&A items.',
				to: '/opportunities',
				cta: 'Open clarifications'
			},
			{
				id: 'pricing',
				title: 'Update pricing data',
				description: 'Open an opportunity to enter BoQ items and formulas.',
				to: '/opportunities',
				cta: 'Open pricing'
			}
		]
	},
	{
		id: 'executive',
		label: 'Executive',
		summary: 'Approve bid strategy, pricing, and final submission.',
		steps: [
			{
				id: 'review-bid',
				title: 'Review approvals queue',
				description: 'See which bids are waiting for your sign-off.',
				to: '/approvals/review',
				cta: 'Review queue'
			},
			{
				id: 'final-signoff',
				title: 'Provide final approval',
				description: 'Approve pricing and submission readiness.',
				to: '/approvals/review',
				cta: 'Finalize bids'
			},
			{
				id: 'post-submission',
				title: 'Track outcomes',
				description: 'Review post-submission results and lessons.',
				to: '/post-submission',
				cta: 'View outcomes'
			}
		]
	},
	{
		id: 'admin',
		label: 'Admin',
		summary: 'Configure roles, notifications, and system defaults.',
		steps: [
			{
				id: 'setup-users',
				title: 'Create users',
				description: 'Invite or add users and assign access roles.',
				to: '/admin/users',
				cta: 'Manage users'
			},
			{
				id: 'setup-roles',
				title: 'Define business roles',
				description: 'Add business roles for approvals and routing.',
				to: '/admin/business-roles',
				cta: 'Manage roles'
			},
			{
				id: 'setup-notifications',
				title: 'Set notification defaults',
				description: 'Route approvals and alerts to the right teams.',
				to: '/notifications',
				cta: 'Configure notifications'
			}
		]
	}
]

const storageKey = (roleId: string) => `bidops.onboarding.${roleId}`

function readStored<T>(key: string, fallback: T): T {
	if (typeof window === 'undefined') return fallback
	try {
		const raw = window.localStorage.getItem(key)
		if (!raw) return fallback
		return JSON.parse(raw) as T
	} catch {
		return fallback
	}
}

function writeStored(key: string, value: unknown) {
	if (typeof window === 'undefined') return
	window.localStorage.setItem(key, JSON.stringify(value))
}

function defaultRoleForAccessRole(role: string | null): string {
	if (role === 'ADMIN') return 'admin'
	if (role === 'MANAGER') return 'bid-manager'
	if (role === 'CONTRIBUTOR') return 'team-member'
	return 'sales-manager'
}

export default function OnboardingPanel({ defaultRoleId }: { defaultRoleId?: string }) {
	const accessRole = getUserRole()
	const [hidden, setHidden] = useState(false)
	const [selectedRole, setSelectedRole] = useState(() => defaultRoleForAccessRole(accessRole))
	const [completed, setCompleted] = useState<string[]>([])

	useEffect(() => {
		setHidden(readStored<boolean>('bidops.onboarding.hidden', false))
		const savedRole = readStored<string | null>('bidops.onboarding.role', null)
		if (savedRole) {
			setSelectedRole(savedRole)
		} else if (defaultRoleId) {
			setSelectedRole(defaultRoleId)
		}
	}, [])

	useEffect(() => {
		if (!defaultRoleId) return
		const savedRole = readStored<string | null>('bidops.onboarding.role', null)
		if (!savedRole) {
			setSelectedRole(defaultRoleId)
		}
	}, [defaultRoleId])

	useEffect(() => {
		const saved = readStored<string[]>(storageKey(selectedRole), [])
		setCompleted(saved)
		writeStored('bidops.onboarding.role', selectedRole)
	}, [selectedRole])

	const flow = useMemo(() => {
		return ROLE_FLOWS.find(item => item.id === selectedRole) || ROLE_FLOWS[0]
	}, [selectedRole])

	const nextStep = flow.steps.find(step => !completed.includes(step.id))
	const progress = `${completed.filter(id => flow.steps.some(step => step.id === id)).length}/${flow.steps.length}`

	function toggleStep(stepId: string) {
		const updated = completed.includes(stepId)
			? completed.filter(id => id !== stepId)
			: [...completed, stepId]
		setCompleted(updated)
		writeStored(storageKey(selectedRole), updated)
	}

	if (hidden) {
		return (
			<div className="mt-4 rounded border border-dashed border-border bg-card 80 px-4 py-3 text-sm text-muted-foreground">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<span className="font-semibold text-foreground">Start here:</span> Choose your role and follow the
						bid workflow.
					</div>
					<button
						className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
						onClick={() => {
							setHidden(false)
							writeStored('bidops.onboarding.hidden', false)
						}}
					>
						Show guide
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="mt-4 rounded border bg-card p-4 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Getting started</p>
					<h2 className="text-lg font-semibold text-foreground">{flow.label} workflow</h2>
					<p className="text-sm text-muted-foreground">{flow.summary}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 text-sm">
					<label className="text-xs font-semibold text-muted-foreground">Role</label>
					<select
						className="rounded border px-2 py-1 text-xs"
						value={selectedRole}
						onChange={e => setSelectedRole(e.target.value)}
					>
						{ROLE_FLOWS.map(item => (
							<option key={item.id} value={item.id}>
								{item.label}
							</option>
						))}
					</select>
					<span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">Progress: {progress}</span>
					<button
						className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80"
						onClick={() => {
							setHidden(true)
							writeStored('bidops.onboarding.hidden', true)
						}}
					>
						Hide guide
					</button>
				</div>
			</div>

			{nextStep && (
				<div className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
					Next up: <span className="font-semibold">{nextStep.title}</span> — {nextStep.description}
				</div>
			)}

			<div className="mt-4 grid gap-3 md:grid-cols-3">
				{flow.steps.map(step => (
					<div key={step.id} className="rounded border border-border bg-muted p-3">
						<div className="flex items-center justify-between">
							<label className="flex items-center gap-2 text-sm font-semibold text-foreground">
								<input
									type="checkbox"
									checked={completed.includes(step.id)}
									onChange={() => toggleStep(step.id)}
								/>
								{step.title}
							</label>
							<Link
								to={step.to}
								className="text-xs font-semibold text-accent hover:underline"
							>
								{step.cta}
							</Link>
						</div>
						<p className="mt-2 text-xs text-muted-foreground">{step.description}</p>
					</div>
				))}
			</div>
		</div>
	)
}
