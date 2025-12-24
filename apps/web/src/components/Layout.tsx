import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { clearToken, getToken, getUserRole } from '../utils/auth'
import Toasts from './Toasts'

const routeLabels: Record<string, string> = {
	'/': 'Dashboard',
	'/dashboard': 'Dashboard',
	'/opportunities': 'Opportunities',
	'/board': 'Kanban',
	'/timeline': 'Timeline',
	'/post-submission': 'Post Submission',
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
			{ to: '/dashboard', label: 'Home' },
			{ to: '/opportunities', label: 'Opportunities' },
			{ to: '/board', label: 'Kanban' },
			{ to: '/timeline', label: 'Timeline' },
			{ to: '/post-submission', label: 'Post Submission' },
			{ to: '/approvals/review', label: 'Bid Review' }
		]
	},
	{
		label: 'Market',
		items: [
			{ to: '/tenders/available', label: 'Tenders' },
			{ to: '/awards/staging', label: 'Awards' },
			{ to: '/search', label: 'Search' }
		]
	},
	{
		label: 'Admin',
		items: [
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
	const role = getUserRole()
	const canSeeAdmin = role === 'ADMIN' || role === 'MANAGER'
	const notificationCount = useQuery({
		queryKey: ['notifications-count'],
		queryFn: () => api.getNotificationCount(),
		refetchOnWindowFocus: false,
		staleTime: 30_000,
		enabled: Boolean(token)
	})
	const unreadCount = notificationCount.data?.unread ?? 0
	const queryClient = useQueryClient()
	const [menuOpen, setMenuOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const [inboxOpen, setInboxOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const inbox = useQuery({
		queryKey: ['notifications', 'preview'],
		queryFn: () => api.listNotifications({ page: 1, pageSize: 5 }),
		refetchOnWindowFocus: false,
		staleTime: 30_000,
		enabled: Boolean(token)
	})

	useEffect(() => {
		function handleClick(event: MouseEvent) {
			if (!dropdownRef.current?.contains(event.target as Node)) {
				setInboxOpen(false)
			}
			if (!menuRef.current?.contains(event.target as Node)) {
				setMenuOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [])
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

	const previewItems = inbox.data?.items ?? []

	async function handleToggleNotification(id: string, markRead: boolean) {
		try {
			if (markRead) {
				await api.markNotificationRead(id)
			} else {
				await api.markNotificationUnread(id)
			}
			inbox.refetch()
			queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
			queryClient.invalidateQueries({ queryKey: ['notifications', 'preview'] })
		} catch (err) {
			console.warn('Failed to update notification status', err)
		}
	}

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
						<div className="relative" ref={menuRef}>
							<button
								type="button"
								onClick={() => setMenuOpen(prev => !prev)}
								className="flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
								aria-haspopup="true"
								aria-expanded={menuOpen}
							>
								Menu
								{unreadCount > 0 && (
									<span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
										{unreadCount}
									</span>
								)}
							</button>
							{menuOpen && (
								<div className="absolute left-0 top-full z-20 mt-2 w-screen max-w-4xl rounded border border-slate-200 bg-white p-4 shadow-lg">
									<div className="grid gap-6 sm:grid-cols-3">
										{navGroups
											.filter(group => group.label !== 'Admin' || canSeeAdmin)
											.map(group => (
												<div key={group.label} className="space-y-2">
													<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
														{group.label}
													</p>
													<div className="space-y-1">
														{group.items.map(item => (
															<NavLink
																key={item.to}
																to={item.to}
																onClick={() => setMenuOpen(false)}
																className={({ isActive }) =>
																	`flex w-full items-center justify-between rounded px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 ${
																		isActive ? 'bg-slate-100 font-semibold' : ''
																	}`
																}
															>
																{item.label}
																{item.to === '/notifications' && unreadCount > 0 && (
																	<span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
																		{unreadCount}
																	</span>
																)}
															</NavLink>
														))}
													</div>
												</div>
											))}
									</div>
								</div>
							)}
						</div>
					</div>
					<div className="flex items-center gap-3 text-sm">
						<div className="relative" ref={dropdownRef}>
							<button
								type="button"
								onClick={() => setInboxOpen(previous => !previous)}
								className="flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
								aria-haspopup="true"
								aria-expanded={inboxOpen}
							>
								<span role="img" aria-label="Notifications">
									🔔
								</span>
								Inbox
								{unreadCount > 0 && (
									<span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
										{unreadCount}
									</span>
								)}
							</button>
							{inboxOpen && (
								<div className="absolute right-0 top-full z-10 mt-2 w-80 rounded border border-slate-200 bg-white p-3 text-xs shadow-lg">
									<div className="flex items-center justify-between text-[11px] text-slate-500">
										<span>Recent notifications</span>
										<button
											className="rounded bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
											onClick={() => {
												nav('/notifications')
												setInboxOpen(false)
											}}
										>
											View all
										</button>
									</div>
									<div className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto">
										{inbox.isLoading ? (
											<p className="text-center text-[11px] text-slate-500">Loading...</p>
										) : previewItems.length === 0 ? (
											<p className="text-center text-[11px] text-slate-500">No notifications yet.</p>
										) : (
											previewItems.map(note => (
												<div key={note.id} className="rounded border border-slate-100 bg-slate-50/80 p-2">
													<div className="flex items-center justify-between gap-2">
														<p className="text-[12px] font-semibold text-slate-900">
															{note.subject || note.activity}
														</p>
														<button
															type="button"
															className="text-[11px] text-slate-500 underline-offset-2 hover:text-slate-900"
															onClick={() => handleToggleNotification(note.id, !note.readAt)}
														>
															{note.readAt ? 'Mark unread' : 'Mark read'}
														</button>
													</div>
													<p className="text-[10px] text-slate-500">
														{note.createdAt?.slice(0, 16).replace('T', ' ')}
													</p>
												</div>
											))
										)}
									</div>
								</div>
							)}
						</div>
						<button
							onClick={() => nav('/account')}
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
