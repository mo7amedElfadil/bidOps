import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Page } from '../../components/Page'
import { Gantt, Task, ViewMode } from '../../vendor/gantt-task-react/index.js'
import '../../vendor/gantt-task-react/index.css'
import '../../vendor/gantt-theme-override.css'
import html2canvas from 'html2canvas'

type TimelineEntry = {
	id: string
	title: string
	stage?: string | null
	clientName?: string | null
	status?: string | null
	daysLeft?: number | null
	start: Date
	end: Date
}

type TimelineResult = {
	entries: TimelineEntry[]
	min: Date
	max: Date
	totalRange: number
}

function getDate(value?: string) {
	return value ? new Date(value) : undefined
}

export default function Timeline() {
	const navigate = useNavigate()
	const opsQuery = useQuery({
		queryKey: ['opportunities', 'timeline'],
		queryFn: () => api.listOpportunities({ page: 1, pageSize: 200 })
	})
	const slaQuery = useQuery({ queryKey: ['sla'], queryFn: api.getSlaSettings })
	const [viewMode, setViewMode] = useState(ViewMode.Week)
	const [listCellWidth, setListCellWidth] = useState(220)
	const [columnWidth, setColumnWidth] = useState(60)
	const [isWrapped, setIsWrapped] = useState(false)
	const ganttRef = useRef<HTMLDivElement>(null)

	const timeline = useMemo<TimelineResult | null>(() => {
		const entries: TimelineEntry[] = []
		for (const item of opsQuery.data?.items || []) {
			const start = getDate(item.startDate) || getDate(item.submissionDate)
			if (!start) continue
			const end = getDate(item.submissionDate) || new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
			entries.push({
				id: item.id,
				title: item.title,
				start,
				end,
				stage: item.stage ?? null,
				clientName: item.clientName ?? null,
				status: item.status ?? null,
				daysLeft: item.daysLeft ?? null
			})
		}

		if (!entries.length) return null

		const min = new Date(Math.min(...entries.map(o => o.start.getTime())))
		const max = new Date(Math.max(...entries.map(o => o.end.getTime())))
		const totalRange = Math.max(1, max.getTime() - min.getTime())

		return { entries, min, max, totalRange }
	}, [opsQuery.data])

	const slaColor = (daysLeft?: number | null) => {
		if (daysLeft === undefined || daysLeft === null) return '#94a3b8'
		if (timesUp(daysLeft, slaQuery.data?.urgentDays ?? 1)) return '#dc2626'
		if (timesUp(daysLeft, slaQuery.data?.alertDays ?? 3)) return '#fb923c'
		if (timesUp(daysLeft, slaQuery.data?.warnDays ?? 7)) return '#f59e0b'
		return '#0ea5e9'
	}

	const tasks: Task[] = useMemo(() => {
		if (!timeline) return []
		return timeline.entries.map(entry => {
			const color = slaColor(entry.daysLeft)
			return {
				id: entry.id,
				name: entry.title,
				start: entry.start,
				end: entry.end,
				type: 'task',
				progress: 100,
				isDisabled: false,
				styles: {
					backgroundColor: `${color}20`,
					backgroundSelectedColor: `${color}40`,
					progressColor: color,
					progressSelectedColor: color,
					borderRadius: '6px',
					fontSize: '12px'
				}
			}
		})
	}, [timeline, slaQuery.data])

	const viewModes = [
		{ label: 'Day', value: ViewMode.Day },
		{ label: 'Week', value: ViewMode.Week },
		{ label: 'Month', value: ViewMode.Month },
		{ label: 'Year', value: ViewMode.Year }
	]
	const handleExport = async () => {
		if (!ganttRef.current) return
		const canvas = await html2canvas(ganttRef.current)
		const link = document.createElement('a')
		link.href = canvas.toDataURL('image/png')
		link.download = `bidops-timeline-${new Date().toISOString().slice(0, 10)}.png`
		link.click()
	}

	const handleClick = (task: Task) => navigate(`/opportunity/${task.id}`)
	const wrapStyles = `
		.gantt-wrap-text .gantt-list-cell-content {
			white-space: normal !important;
			word-break: break-word !important;
			overflow-wrap: break-word !important;
		}
		.gantt-wrap-text .gantt-task-list-cell {
			display: block !important;
		}
	`

	return (
		<Page
			title="Timeline"
			subtitle="Gantt timeline with SLA signals and zoom controls."
			actions={
					<div className="flex gap-2">
						<LinkButton to="/opportunities" label="List" />
						<LinkButton to="/board" label="Kanban" />
					</div>
				}
			>
			<style>{wrapStyles}</style>
			{slaQuery.data && (
				<div className="rounded border bg-card p-3 text-sm text-foreground">
					SLA warn ≤ {slaQuery.data.warnDays}d, alert ≤ {slaQuery.data.alertDays}d, urgent ≤ {slaQuery.data.urgentDays}d.
				</div>
			)}

			{opsQuery.isLoading ? (
				<p className="mt-4 text-sm text-muted-foreground">Loading...</p>
			) : !timeline ? (
				<p className="mt-4 text-sm text-muted-foreground">No timeline data yet.</p>
			) : (
				<div className="mt-4 space-y-3">
					<div className="rounded border bg-card p-4 shadow-sm">
						<div className="flex flex-col gap-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
							<div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
								<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">View mode</div>
								<div className="flex items-center gap-2">
									{viewModes.map(mode => (
										<button
											key={mode.value}
											className={`rounded px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
												viewMode === mode.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
											}`}
											onClick={() => setViewMode(mode.value)}
										>
											{mode.label}
										</button>
									))}
								</div>
							</div>
							<div className="flex flex-wrap items-center gap-3 text-[11px]">
								<div className="flex items-center gap-2">
									<span className="uppercase tracking-wide text-muted-foreground">Name width</span>
									<input
										type="range"
										min={160}
										max={320}
										value={listCellWidth}
										onChange={event => setListCellWidth(Number(event.target.value))}
										className="h-1 w-32 accent-blue-600"
									/>
									<span className="font-semibold text-muted-foreground">{listCellWidth}px</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="uppercase tracking-wide text-muted-foreground">Timeline width</span>
									<input
										type="range"
										min={40}
										max={140}
										value={columnWidth}
										onChange={event => setColumnWidth(Number(event.target.value))}
										className="h-1 w-32 accent-blue-600"
									/>
									<span className="font-semibold text-muted-foreground">{columnWidth}px</span>
								</div>
								<button
									onClick={() => setIsWrapped(prev => !prev)}
									className="rounded border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wide hover:border-border"
								>
									{isWrapped ? 'Disable wrap' : 'Enable wrap'}
								</button>
								<button
									onClick={handleExport}
									className="rounded border border-blue-600 bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
								>
									Export PNG
								</button>
							</div>
						</div>
						<div className="mt-4">
							<div ref={ganttRef} className={isWrapped ? 'gantt-wrap-text' : undefined}>
								<Gantt
									tasks={tasks}
									viewMode={viewMode}
									onClick={handleClick}
									listCellWidth={listCellWidth}
									columnWidth={columnWidth}
									barCornerRadius={6}
									locale="en-GB"
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</Page>
	)
}

function timesUp(daysLeft: number, threshold: number) {
	return daysLeft <= threshold
}

function LinkButton({ to, label }: { to: string; label: string }) {
	return (
		<Link
			to={to}
			className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
		>
			{label}
		</Link>
	)
}
