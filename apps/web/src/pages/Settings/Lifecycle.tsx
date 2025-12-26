import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../api/client'
import { Page } from '../../components/Page'
import SettingsNav from '../../components/SettingsNav'
import { DEFAULT_STAGE_LIST, DEFAULT_STATUS_LIST } from '../../constants/opportunity-lists'

export default function LifecycleSettingsPage() {
	const stageListQuery = useQuery({ queryKey: ['opportunity-stages'], queryFn: api.getOpportunityStages })
	const statusListQuery = useQuery({ queryKey: ['opportunity-statuses'], queryFn: api.getOpportunityStatuses })
	const [stageInput, setStageInput] = useState('')
	const [statusInput, setStatusInput] = useState('')

	const stageMutation = useMutation({
		mutationFn: (stages: string[]) => api.setOpportunityStages({ stages }),
		onSuccess: () => stageListQuery.refetch()
	})

	const statusMutation = useMutation({
		mutationFn: (statuses: string[]) => api.setOpportunityStatuses({ statuses }),
		onSuccess: () => statusListQuery.refetch()
	})

	const stageList = stageListQuery.data?.stages ?? DEFAULT_STAGE_LIST
	const statusList = statusListQuery.data?.statuses ?? DEFAULT_STATUS_LIST

	const addStage = () => {
		const trimmed = stageInput.trim()
		if (!trimmed) return
		if (stageList.includes(trimmed)) {
			setStageInput('')
			return
		}
		stageMutation.mutate([...stageList, trimmed])
		setStageInput('')
	}

	const removeStage = (value: string) => {
		if (stageList.length <= 1) return
		stageMutation.mutate(stageList.filter(stage => stage !== value))
	}

	const addStatus = () => {
		const trimmed = statusInput.trim()
		if (!trimmed) return
		if (statusList.includes(trimmed)) {
			setStatusInput('')
			return
		}
		statusMutation.mutate([...statusList, trimmed])
		setStatusInput('')
	}

	const removeStatus = (value: string) => {
		if (statusList.length <= 1) return
		statusMutation.mutate(statusList.filter(status => status !== value))
	}

	const reorderStages = (index: number, direction: -1 | 1) => {
		const target = index + direction
		if (target < 0 || target >= stageList.length) return
		const copied = [...stageList]
		const temp = copied[target]
		copied[target] = copied[index]
		copied[index] = temp
		stageMutation.mutate(copied)
	}

	const reorderStatuses = (index: number, direction: -1 | 1) => {
		const target = index + direction
		if (target < 0 || target >= statusList.length) return
		const copied = [...statusList]
		const temp = copied[target]
		copied[target] = copied[index]
		copied[index] = temp
		statusMutation.mutate(copied)
	}

	return (
		<Page
			title="Opportunity Lists"
			subtitle="Manage lifecycle stages and status picklists used across opportunities."
		>
			<SettingsNav />

			<div className="mt-4 rounded border bg-white p-4 shadow-sm">
				<h3 className="text-sm font-semibold">Opportunity stages</h3>
				<p className="mt-2 text-xs text-slate-600">
					Define the dropdown values you'll use when moving opportunities through the lifecycle.
				</p>
				<div className="mt-3 space-y-2">
					{stageList.map((stage, index) => (
						<div
							key={stage}
							className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
						>
							<div className="font-medium">{stage}</div>
							<div className="flex gap-1">
								<button
									type="button"
									className="rounded border border-slate-300 px-1 text-xs hover:bg-slate-100 disabled:text-slate-300"
									onClick={() => reorderStages(index, -1)}
									disabled={stageMutation.isPending || index === 0}
								>
									▲
								</button>
								<button
									type="button"
									className="rounded border border-slate-300 px-1 text-xs hover:bg-slate-100 disabled:text-slate-300"
									onClick={() => reorderStages(index, 1)}
									disabled={stageMutation.isPending || index === stageList.length - 1}
								>
									▼
								</button>
								<button
									type="button"
									className="text-xs text-red-500 hover:text-red-700"
									onClick={() => removeStage(stage)}
									disabled={stageMutation.isPending || stageList.length <= 1}
								>
									×
								</button>
							</div>
						</div>
					))}
				</div>
				<div className="mt-3 flex gap-2">
					<input
						className="w-full rounded border px-3 py-2 text-sm"
						placeholder="Add stage"
						value={stageInput}
						onChange={e => setStageInput(e.target.value)}
					/>
					<button
						className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						onClick={addStage}
						disabled={!stageInput.trim() || stageMutation.isPending}
					>
						Add
					</button>
				</div>
				{stageMutation.isError && (
					<p className="mt-2 text-xs text-red-600">Failed to save stages. Try again.</p>
				)}
			</div>

			<div className="mt-6 rounded border bg-white p-4 shadow-sm">
				<h3 className="text-sm font-semibold">Opportunity statuses</h3>
				<p className="mt-2 text-xs text-slate-600">Statuses show in the dropdown while editing opportunities.</p>
				<div className="mt-3 space-y-2">
					{statusList.map((status, index) => (
						<div
							key={status}
							className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
						>
							<div className="font-medium">{status}</div>
							<div className="flex gap-1">
								<button
									type="button"
									className="rounded border border-slate-300 px-1 text-xs hover:bg-slate-100 disabled:text-slate-300"
									onClick={() => reorderStatuses(index, -1)}
									disabled={statusMutation.isPending || index === 0}
								>
									▲
								</button>
								<button
									type="button"
									className="rounded border border-slate-300 px-1 text-xs hover:bg-slate-100 disabled:text-slate-300"
									onClick={() => reorderStatuses(index, 1)}
									disabled={statusMutation.isPending || index === statusList.length - 1}
								>
									▼
								</button>
								<button
									type="button"
									className="text-xs text-red-500 hover:text-red-700"
									onClick={() => removeStatus(status)}
									disabled={statusMutation.isPending || statusList.length <= 1}
								>
									×
								</button>
							</div>
						</div>
					))}
				</div>
				<div className="mt-3 flex gap-2">
					<input
						className="w-full rounded border px-3 py-2 text-sm"
						placeholder="Add status"
						value={statusInput}
						onChange={e => setStatusInput(e.target.value)}
					/>
					<button
						className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						onClick={addStatus}
						disabled={!statusInput.trim() || statusMutation.isPending}
					>
						Add
					</button>
				</div>
				{statusMutation.isError && (
					<p className="mt-2 text-xs text-red-600">Failed to save statuses. Try again.</p>
				)}
			</div>
		</Page>
	)
}
