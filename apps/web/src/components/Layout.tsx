import React from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../utils/auth'
import Toasts from './Toasts'

const links = [
	{ to: '/', label: 'Opportunities' },
	{ to: '/board', label: 'Kanban' },
	{ to: '/timeline', label: 'Timeline' },
	{ to: '/awards/staging', label: 'Awards' },
	{ to: '/tenders/available', label: 'Tenders' },
	{ to: '/admin/users', label: 'Users' },
	{ to: '/search', label: 'Search' },
	{ to: '/settings/sla', label: 'SLA' }
]

export default function Layout() {
	const loc = useLocation()
	const nav = useNavigate()
	const token = getToken()

	function signOut() {
		clearToken()
		nav('/auth/dev', { replace: true })
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<Toasts />
			<header className="border-b bg-white">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
					<div className="flex items-center gap-4">
						<div className="rounded bg-blue-600 px-2 py-1 text-sm font-semibold text-white">BidOps</div>
						<nav className="flex flex-wrap gap-1 text-sm">
							{links.map(link => (
								<NavLink
									key={link.to}
									to={link.to}
									className={({ isActive }) =>
										`rounded px-3 py-1.5 hover:bg-slate-100 ${
											isActive ? 'bg-slate-200 font-medium' : ''
										}`
									}
								>
									{link.label}
								</NavLink>
							))}
						</nav>
					</div>
					<div className="flex items-center gap-3 text-sm">
						<span className="hidden text-slate-600 sm:inline">Signed in (dev)</span>
						<button onClick={() => nav('/import/tracker')} className="rounded bg-slate-100 px-3 py-1.5 hover:bg-slate-200">
							Import
						</button>
						{token ? (
							<button onClick={signOut} className="rounded bg-slate-200 px-3 py-1.5 hover:bg-slate-300">
								Sign out
							</button>
						) : (
							<button onClick={() => nav('/auth/dev')} className="text-blue-600 hover:underline">
								Dev Login
							</button>
						)}
					</div>
				</div>
				<div className="border-t bg-slate-100">
					<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs text-slate-600">
						<span>Path: {loc.pathname}</span>
						<span>Tenant scope: default</span>
					</div>
				</div>
			</header>
			<main>
				<Outlet />
			</main>
		</div>
	)
}
