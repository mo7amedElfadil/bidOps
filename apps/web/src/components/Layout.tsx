import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, NotificationItem } from '../api/client'
import { clearToken, getToken, getUserRole } from '../utils/auth'
import { getNotificationLink } from '../utils/notifications'
import Toasts from './Toasts'
import ThemeToggle from './ThemeToggle'

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
	'/account': 'Account',
	'/admin/users': 'Users',
	'/admin/business-roles': 'Business Roles',
	'/admin/tender-activities': 'Tender Activities',
	'/search': 'Search',
	'/settings/sla': 'SLA Settings',
	'/settings/lifecycle': 'Opportunity Lists',
	'/settings/system': 'System Settings',
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
		label: 'User',
		items: [
			{ to: '/notifications', label: 'Notifications' },
			{ to: '/account', label: 'Account' }
		]
	},
	{
		label: 'Admin',
		items: [
			{ to: '/admin/users', label: 'Users' },
			{ to: '/admin/business-roles', label: 'Business Roles' },
			{ to: '/admin/tender-activities', label: 'Tender Activities' },
			{ to: '/settings/sla', label: 'SLA' },
			{ to: '/settings/lifecycle', label: 'Opportunity Lists' },
			{ to: '/settings/system', label: 'System Settings' }
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

	function openNotification(note: NotificationItem) {
		const link = getNotificationLink(note)
		if (!link) return
		if (!note.readAt) {
			void handleToggleNotification(note.id, true)
		}
		if (link.external) {
			window.open(link.href, '_blank', 'noopener,noreferrer')
			return
		}
		nav(link.href)
		setInboxOpen(false)
	}

	function signOut() {
		clearToken()
		nav('/auth/login', { replace: true })
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Toasts />
			<header className="border-b border-border bg-card">
				<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
					<div className="flex flex-wrap items-center gap-4">
						<div className="rounded bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">BidOps</div>
						<div className="relative" ref={menuRef}>
							<button
								type="button"
								onClick={() => setMenuOpen(prev => !prev)}
								className="flex items-center gap-1 rounded border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted/80"
								aria-haspopup="true"
								aria-expanded={menuOpen}
							>
								Menu
								{unreadCount > 0 && (
									<span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
										{unreadCount}
									</span>
								)}
							</button>
							{menuOpen && (
								<div className="absolute left-0 top-full z-20 mt-2 w-screen max-w-4xl rounded border border-border bg-card p-4 shadow-lg">
									<div className="grid gap-6 sm:grid-cols-3">
										{navGroups
											.filter(group => group.label !== 'Admin' || canSeeAdmin)
											.map(group => (
												<div key={group.label} className="space-y-2">
													<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
														{group.label}
													</p>
													<div className="space-y-1">
														{group.items.map(item => (
															<NavLink
																key={item.to}
																to={item.to}
																onClick={() => setMenuOpen(false)}
																className={({ isActive }) =>
																	`flex w-full items-center justify-between rounded px-3 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted/80 ${
																		isActive ? 'bg-muted font-semibold' : ''
																	}`
																}
															>
																{item.label}
																{item.to === '/notifications' && unreadCount > 0 && (
																	<span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
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
						<ThemeToggle />
						<div className="relative" ref={dropdownRef}>
							<button
								type="button"
								onClick={() => setInboxOpen(previous => !previous)}
								className="flex items-center gap-1 rounded border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted/80"
								aria-haspopup="true"
								aria-expanded={inboxOpen}
							>
								<span role="img" aria-label="Notifications">
									🔔
								</span>
								Inbox
								{unreadCount > 0 && (
									<span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
										{unreadCount}
									</span>
								)}
							</button>
							{inboxOpen && (
								<div className="absolute right-0 top-full z-10 mt-2 w-80 rounded border border-border bg-card p-3 text-xs shadow-lg">
									<div className="flex items-center justify-between text-[11px] text-muted-foreground">
										<span>Recent notifications</span>
										<button
											className="rounded bg-muted px-2 py-0.5 hover:bg-muted/80"
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
											<p className="text-center text-[11px] text-muted-foreground">Loading...</p>
										) : previewItems.length === 0 ? (
											<p className="text-center text-[11px] text-muted-foreground">No notifications yet.</p>
										) : (
											previewItems.map(note => (
												<div
													key={note.id}
													role="button"
													tabIndex={0}
													className="cursor-pointer rounded border border-border bg-muted/50 p-2 transition hover:bg-muted/80"
													onClick={() => openNotification(note)}
													onKeyDown={event => {
														if (event.key === 'Enter' || event.key === ' ') {
															event.preventDefault()
															openNotification(note)
														}
													}}
												>
													<div className="flex items-center justify-between gap-2">
														<p className="text-[12px] font-semibold text-foreground">
															{note.subject || note.activity}
														</p>
														<button
															type="button"
															className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground"
															onClick={event => {
																event.stopPropagation()
																handleToggleNotification(note.id, !note.readAt)
															}}
														>
															{note.readAt ? 'Mark unread' : 'Mark read'}
														</button>
													</div>
													<p className="text-[10px] text-muted-foreground">
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
							className="rounded bg-muted px-3 py-1.5 hover:bg-muted/80"
						>
							Account
						</button>
						{token ? (
							<button onClick={signOut} className="rounded bg-secondary px-3 py-1.5 text-secondary-foreground hover:bg-secondary/80">
								Sign out
							</button>
						) : (
							<button onClick={() => nav('/auth/login')} className="text-accent hover:underline">
								Sign in
							</button>
						)}
					</div>
				</div>
				<div className="border-t border-border bg-muted">
					<div className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
						<nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1">
							{breadcrumbs.map((crumb, index) => (
								<div key={crumb.to} className="flex items-center gap-1">
									<button
										onClick={() => nav(crumb.to)}
										className="flex items-center gap-1 rounded bg-card px-3 py-1 text-[11px] font-medium text-foreground shadow-sm transition hover:bg-muted/80"
									>
										{index === 0 ? '🏠' : null}
										{crumb.label}
									</button>
									{index < breadcrumbs.length - 1 && (
										<span className="text-muted-foreground">›</span>
									)}
								</div>
							))}
						</nav>
						<span className="ml-auto text-[11px] text-muted-foreground">Tenant scope: default</span>
					</div>
				</div>
			</header>
			<main className="px-4 py-6">
				<Outlet />
			</main>
		</div>
	)
}
