import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, type Opportunity } from '../../api/client'
import { SlaBadge } from '../../components/SlaBadge'
import { Page } from '../../components/Page'
import { isPostSubmission } from '../../utils/postSubmission'

const CHRONOLOGICAL_STAGES = [
	'Unstaged',
	'Sourcing',
	'Qualification',
	'Purchase',
	'Elaboration',
	'Pricing & Approvals',
	'Submission',
	'Post Submission',
	'Evaluation',
	'Outcome',
	'Closeout'
]

export default function Board() {
	const queryClient = useQueryClient()
	const [draggingId, setDraggingId] = useState<string | null>(null)
	const [dragOverStage, setDragOverStage] = useState<string | null>(null)
	const scrollAnimationRef = useRef<number | null>(null)
	const lastAutoScrollStageRef = useRef<string | null>(null)
	const { data, isLoading } = useQuery({
		queryKey: ['opportunities', 'board'],
		queryFn: () => api.listOpportunities({ page: 1, pageSize: 200 })
	})

	const groupedByStage = useMemo(
		() =>
			(data?.items || []).reduce((acc, item) => {
				const k = isPostSubmission(item) ? 'Post Submission' : item.stage || 'Unstaged'
				;(acc[k] ||= []).push(item)
				return acc
			}, {} as Record<string, Opportunity[]>),
		[data]
	)

	const orderedStages = useMemo(() => {
		const prefix = new Set(CHRONOLOGICAL_STAGES)
		const dynamicStages = Object.keys(groupedByStage).filter(stage => !prefix.has(stage))
		return [...CHRONOLOGICAL_STAGES, ...dynamicStages]
	}, [groupedByStage])

	const columnRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const boardRef = useRef<HTMLDivElement>(null)

	const mutation = useMutation({
		mutationFn: ({ id, stage }: { id: string; stage?: string }) =>
			api.updateOpportunity(id, {
				stage
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['opportunities', 'board'] })
		}
	})

	const handleDragStart = (event: DragEvent<HTMLDivElement>, id: string) => {
		event.dataTransfer?.setData('text/plain', id)
		event.dataTransfer.effectAllowed = 'move'
		lastAutoScrollStageRef.current = null
		setDraggingId(id)
	}

	const handleDragEnd = () => {
		setDraggingId(null)
		setDragOverStage(null)
		lastAutoScrollStageRef.current = null
	}

	const handleDrop = (stage: string, event: DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		setDragOverStage(null)
		setDraggingId(null)
		lastAutoScrollStageRef.current = null
		const id = event.dataTransfer?.getData('text/plain')
		if (!id) return
		if (mutation.isPending) return
		const targetStage = stage === 'Unstaged' ? undefined : stage
		const record = data?.items?.find(item => item.id === id)
		if (!record || (record.stage || 'Unstaged') === targetStage) return
		mutation.mutate({ id, stage: targetStage })
	}

	const animateBoardScroll = (targetLeft: number) => {
		const board = boardRef.current
		if (!board) return
		if (scrollAnimationRef.current !== null) {
			cancelAnimationFrame(scrollAnimationRef.current)
			scrollAnimationRef.current = null
		}
		const startLeft = board.scrollLeft
		const delta = targetLeft - startLeft
		if (Math.abs(delta) < 4) return
		const durationMs = 650
		const startTime = performance.now()
		const step = (now: number) => {
			const progress = Math.min(1, (now - startTime) / durationMs)
			const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress
			board.scrollLeft = startLeft + delta * eased
			if (progress < 1) {
				scrollAnimationRef.current = requestAnimationFrame(step)
			} else {
				scrollAnimationRef.current = null
			}
		}
		scrollAnimationRef.current = requestAnimationFrame(step)
	}

	const handleDragOverStage = (stage: string, event: DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.dataTransfer!.dropEffect = 'move'
		setDragOverStage(stage)
		const column = columnRefs.current[stage]
		const board = boardRef.current
		if (!column || !board) return
		if (lastAutoScrollStageRef.current === stage) return
		lastAutoScrollStageRef.current = stage
		const boardRect = board.getBoundingClientRect()
		const columnRect = column.getBoundingClientRect()
		const columnCenter = columnRect.left - boardRect.left + board.scrollLeft + columnRect.width / 2
		const targetLeft = columnCenter - board.clientWidth / 2
		const maxLeft = board.scrollWidth - board.clientWidth
		const clampedLeft = Math.min(maxLeft, Math.max(0, targetLeft))
		animateBoardScroll(clampedLeft)
	}

	return (
		<Page
			title="Kanban"
			subtitle="Opportunities grouped by stage with SLA indicators. Drag cards to move them through the lifecycle."
			actions={
				<Link to="/opportunities" className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">
					Table
				</Link>
			}
		>
			{isLoading ? (
				<p className="text-sm text-slate-600">Loading...</p>
			) : (
				<div ref={boardRef} className="mt-4 flex gap-4 overflow-x-auto pb-2">
					{orderedStages.map(stage => (
						<div
							key={stage}
							className={`min-w-[260px] rounded border bg-white transition ${dragOverStage === stage ? 'border-blue-500 shadow-md' : ''}`}
							ref={el => {
								columnRefs.current[stage] = el
							}}
							onDragOver={event => handleDragOverStage(stage, event)}
							onDragLeave={() => setDragOverStage(null)}
							onDrop={event => handleDrop(stage, event)}
						>
								<div className="border-b bg-gray-100 px-3 py-2 font-medium">{stage}</div>
								<div
									className="space-y-2 p-3 overflow-y-auto"
									style={{ maxHeight: 'calc(100vh - 220px)' }}
								>
								{(groupedByStage[stage] || []).map(o => (
									<div
										key={o.id}
										className={`rounded border p-2 ${draggingId === o.id ? 'opacity-60' : ''}`}
										draggable
										onDragStart={event => handleDragStart(event, o.id)}
										onDragEnd={handleDragEnd}
									>
										<div className="flex items-center justify-between">
											<Link
												to={`/opportunity/${o.id}`}
												className="text-sm font-medium hover:underline"
											>
												{o.title}
											</Link>
											<SlaBadge daysLeft={o.daysLeft} />
										</div>
										<div className="mt-1 text-xs text-gray-500">
											Due: {o.submissionDate ? o.submissionDate.slice(0, 10) : '-'}
										</div>
									</div>
								))}
								{(groupedByStage[stage] || []).length === 0 && (
									<p className="text-xs text-slate-500">No items in this stage.</p>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</Page>
	)
}
