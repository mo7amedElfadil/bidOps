import React, { useMemo } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../utils/auth'
import Toasts from './Toasts'

const links = [
	{ to: '/', label: 'Opportunities' },
	{ to: '/post-submission', label: 'Post Submission' },
	{ to: '/board', label: 'Kanban' },
	{ to: '/timeline', label: 'Timeline' },
	{ to: '/awards/staging', label: 'Awards' },
	{ to: '/tenders/available', label: 'Tenders' },
	{ to: '/approvals/review', label: 'Bid Review' },
	{ to: '/notifications', label: 'Notifications' },
	{ to: '/admin/users', label: 'Users' },
	{ to: '/admin/business-roles', label: 'Business Roles' },
	{ to: '/search', label: 'Search' },
	{ to: '/settings/sla', label: 'SLA' }
]

const routeLabels: Record<string, string> = {
	'/': 'Opportunities',
	'/board': 'Kanban',
	'/timeline': 'Timeline',
	'/awards/staging': 'Awards',
	'/tenders/available': 'Tenders',
	'/approvals/review': 'Bid Review',
	'/notifications': 'Notifications',
	'/admin/users': 'Users',
	'/admin/business-roles': 'Business Roles',
	'/search': 'Search',
	'/settings/sla': 'SLA',
	'/import/tracker': 'Tracker Import'
}

const navGroups = [
	{
		label: 'Pipeline',
		items: [
			{ to: '/', label: 'Opportunities' },
			{ to: '/board', label: 'Kanban' },
			{ to: '/timeline', label: 'Timeline' }
		]
	},
	{
		label: 'Intelligence',
		items: [
			{ to: '/awards/staging', label: 'Awards' },
			{ to: '/tenders/available', label: 'Tenders' },
			{ to: '/search', label: 'Search' }
		]
	},
	{
		label: 'Admin',
		items: [
			{ to: '/approvals/review', label: 'Bid Review' },
			{ to: '/notifications', label: 'Notifications' },
			{ to: '/admin/users', label: 'Users' },
			{ to: '/admin/business-roles', label: 'Business Roles' },
			{ to: '/settings/sla', label: 'SLA' }
		]
	}
]

export default function Layout() {
	const loc = useLocation()
	const nav = useNavigate()
	const token = getToken()
	const breadcrumbs = useMemo(() => {
		const segments = loc.pathname.split('/').filter(Boolean)
		const crumbs = [{ label: 'Home', to: '/' }]
		let accumulated = ''
		for (const segment of segments) {
			accumulated += `/${segment}`
			crumbs.push({
				label: routeLabels[accumulated] || segment.replace(/-/g, ' '),
				to: accumulated
			})
		}
		return crumbs
	}, [loc.pathname])

	function signOut() {
		clearToken()
		nav('/auth/login', { replace: true })
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<Toasts />
			<header className="border-b bg-white">
				<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
					<div className="flex flex-wrap items-center gap-4">
						<div className="rounded bg-blue-600 px-2 py-1 text-sm font-semibold text-white">BidOps</div>
						<nav className="flex flex-wrap gap-3 text-[11px]">
							{navGroups.map(group => (
								<div
									key={group.label}
									className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-1"
								>
									<span className="text-[10px] uppercase tracking-wider text-slate-500">{group.label}</span>
									<div className="flex items-center gap-1">
										{group.items.map(item => (
											<NavLink
												key={item.to}
												to={item.to}
												className={({ isActive }) =>
													`rounded px-3 py-1.5 text-xs hover:bg-slate-100 ${
														isActive ? 'bg-slate-200 font-medium' : ''
													}`
												}
											>
												{item.label}
											</NavLink>
										))}
									</div>
								</div>
							))}
						</nav>
					</div>
					<div className="flex items-center gap-3 text-sm">
						<span className="hidden text-slate-600 sm:inline">Signed in</span>
						<button
							onClick={() => nav('/import/tracker')}
							className="rounded bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
						>
							Import
						</button>
						<button
							onClick={() => nav('/auth/change-password')}
							className="rounded bg-slate-100 px-3 py-1.5 hover:bg-slate-200"
						>
							Account
						</button>
						{token ? (
							<button onClick={signOut} className="rounded bg-slate-200 px-3 py-1.5 hover:bg-slate-300">
								Sign out
							</button>
						) : (
							<button onClick={() => nav('/auth/login')} className="text-blue-600 hover:underline">
								Sign in
							</button>
						)}
					</div>
				</div>
				<div className="border-t bg-slate-100">
					<div className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs text-slate-600">
						<nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1">
							{breadcrumbs.map((crumb, index) => (
								<div key={crumb.to} className="flex items-center gap-1">
									<button
										onClick={() => nav(crumb.to)}
										className="flex items-center gap-1 rounded bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-200"
									>
										{index === 0 ? '🏠' : null}
										{crumb.label}
									</button>
									{index < breadcrumbs.length - 1 && (
										<span className="text-slate-400">›</span>
									)}
								</div>
							))}
						</nav>
						<span className="ml-auto text-[11px] text-slate-500">Tenant scope: default</span>
					</div>
				</div>
			</header>
			<main className="px-4 py-6">
				<Outlet />
			</main>
		</div>
	)
}
