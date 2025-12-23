import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, BoQItem, VendorQuote, PricingPack, PricingPackRow } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'

type Column = {
	key: string
	label: string
	type: 'text' | 'number' | 'currency' | 'formula'
	formula?: string
}

const MIN_MARGIN = Number(import.meta.env.VITE_MIN_MARGIN ?? 10) / 100
const BASE_CURRENCY = 'QAR'
const BOQ_BASE_KEYS = new Set([
	'lineNo',
	'description',
	'qty',
	'unit',
	'unitCost',
	'unitCurrency',
	'markup',
	'unitPrice',
	'total'
])
const PACK_BASE_KEYS = new Set(['lineNo', 'description', 'qty', 'unitCost', 'unitCurrency', 'total'])

const DEFAULT_BOQ_COLUMNS: Column[] = [
	{ key: 'lineNo', label: '#', type: 'number' },
	{ key: 'description', label: 'Description', type: 'text' },
	{ key: 'qty', label: 'Qty', type: 'number' },
	{ key: 'unit', label: 'Unit', type: 'text' },
	{ key: 'unitCost', label: 'Unit Cost', type: 'number' },
	{ key: 'unitCurrency', label: 'Currency', type: 'currency' },
	{ key: 'markup', label: 'Markup', type: 'number' },
	{ key: 'unitPrice', label: 'Unit Price', type: 'formula', formula: '=E2*(1+G2)' },
	{ key: 'total', label: 'Total (QAR)', type: 'formula', formula: '=C2*H2' }
]

const DEFAULT_PACK_COLUMNS: Column[] = [
	{ key: 'lineNo', label: '#', type: 'number' },
	{ key: 'description', label: 'Description', type: 'text' },
	{ key: 'qty', label: 'Qty', type: 'number' },
	{ key: 'unitCost', label: 'Unit Cost', type: 'number' },
	{ key: 'unitCurrency', label: 'Currency', type: 'currency' },
	{ key: 'total', label: 'Total', type: 'formula', formula: '=C2*D2' }
]

const CURRENCY_OPTIONS = ['QAR', 'USD', 'EUR', 'GBP']

type RowInput = {
	lineNo: number
	description: string
	qty: number
	unit?: string
	unitCost: string
	unitCurrency: string
	markup?: number
	customFields: Record<string, any>
}

function parseCurrencyInput(input: string, fallbackCurrency: string) {
	const trimmed = input.trim()
	if (!trimmed) return { amount: 0, currency: fallbackCurrency }
	const symbolMap: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP', 'QR': 'QAR' }
	const symbol = trimmed[0]
	if (symbolMap[symbol]) {
		const amount = Number(trimmed.slice(1).replace(/,/g, ''))
		return { amount: Number.isFinite(amount) ? amount : 0, currency: symbolMap[symbol] }
	}
	const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]{3})$/)
	if (match) {
		return { amount: Number(match[1]), currency: match[2].toUpperCase() }
	}
	const amount = Number(trimmed.replace(/,/g, ''))
	return { amount: Number.isFinite(amount) ? amount : 0, currency: fallbackCurrency }
}

function columnLabelFromIndex(index: number) {
	let label = ''
	let n = index + 1
	while (n > 0) {
		const rem = (n - 1) % 26
		label = String.fromCharCode(65 + rem) + label
		n = Math.floor((n - 1) / 26)
	}
	return label
}

function columnIndexFromLabel(label: string) {
	let index = 0
	for (let i = 0; i < label.length; i += 1) {
		index = index * 26 + (label.charCodeAt(i) - 64)
	}
	return index - 1
}

function evaluateFormula(
	formula: string,
	rowIndex: number,
	colIndex: number,
	columns: Column[],
	rows: Array<Record<string, any>>,
	getCellValue: (r: number, c: number, stack: Set<string>) => number
) {
	if (!formula || !formula.startsWith('=')) return null
	const expr = formula.slice(1)
	const replaced = expr.replace(/([A-Z]+)(\d+)/g, (_match, colLabel, rowNo) => {
		const rIndex = Number(rowNo) - 1
		const cIndex = columnIndexFromLabel(colLabel)
		const value = getCellValue(rIndex, cIndex, new Set([`${rowIndex}:${colIndex}`]))
		return Number.isFinite(value) ? String(value) : '0'
	})
	if (!/^[0-9+\-*/().\s]+$/.test(replaced)) return null
	try {
		return Function(`"use strict"; return (${replaced})`)()
	} catch {
		return null
	}
}

function getCellValueFactory(
	columns: Column[],
	rows: Array<Record<string, any>>,
	rateForCurrency: (currency: string) => number | null
) {
	return function getCellValue(rowIndex: number, colIndex: number, stack: Set<string>): number {
		if (rowIndex < 0 || rowIndex >= rows.length) return 0
		const key = `${rowIndex}:${colIndex}`
		if (stack.has(key)) throw new Error('Circular reference')
		const column = columns[colIndex]
		if (!column) return 0
		if (column.type === 'formula') {
			const nextStack = new Set(stack)
			nextStack.add(key)
			const value = evaluateFormula(
				column.formula || '',
				rowIndex,
				colIndex,
				columns,
				rows,
				(r, c, s) => getCellValue(r, c, s)
			)
			return Number(value) || 0
		}
		const row = rows[rowIndex]
		if (column.key === 'unitCost') {
			const currency = (row.unitCurrency || BASE_CURRENCY).toUpperCase()
			const rate = rateForCurrency(currency)
			if (!rate) return 0
			return Number(row.unitCost) * rate
		}
		const raw = row[column.key] ?? row.customFields?.[column.key]
		const numeric = Number(raw)
		return Number.isFinite(numeric) ? numeric : 0
	}
}

function mergeColumns(defaults: Column[], incoming: any): Column[] {
	if (!Array.isArray(incoming)) return defaults
	return incoming.map((col, index) => ({
		key: col.key || columnLabelFromIndex(index),
		label: col.label || col.key || columnLabelFromIndex(index),
		type: col.type || 'text',
		formula: col.formula
	}))
}

function customColumns(columns: Column[], baseKeys: Set<string>) {
	return columns.filter(col => !baseKeys.has(col.key) && col.type !== 'formula')
}

export default function PricingPage() {
	const { id } = useParams<{ id: string }>()
	const qc = useQueryClient()
	const [showAddBoq, setShowAddBoq] = useState(false)
	const [showAddQuote, setShowAddQuote] = useState(false)
	const [showAddPack, setShowAddPack] = useState(false)
	const [editingBoq, setEditingBoq] = useState<BoQItem | null>(null)
	const [editingPack, setEditingPack] = useState<PricingPackRow | null>(null)
	const [newBoq, setNewBoq] = useState<RowInput>({
		lineNo: 1,
		description: '',
		qty: 1,
		unit: '',
		unitCost: '',
		unitCurrency: BASE_CURRENCY,
		markup: 0.15,
		customFields: {}
	})
	const [newPack, setNewPack] = useState<RowInput>({
		lineNo: 1,
		description: '',
		qty: 1,
		unit: '',
		unitCost: '',
		unitCurrency: BASE_CURRENCY,
		customFields: {}
	})
	const [newQuote, setNewQuote] = useState({ vendor: '', quoteNo: '', currency: 'QAR' })
	const [packParams, setPackParams] = useState({ overheads: 0.1, contingency: 0.05, fxRate: 1, margin: 0.15 })
	const [error, setError] = useState<string | null>(null)
	const [boqColumns, setBoqColumns] = useState<Column[]>(DEFAULT_BOQ_COLUMNS)
	const [packColumns, setPackColumns] = useState<Column[]>(DEFAULT_PACK_COLUMNS)
	const [boqTemplateName, setBoqTemplateName] = useState('')
	const [packTemplateName, setPackTemplateName] = useState('')

	const opportunityQuery = useQuery({
		queryKey: ['opportunity', id],
		enabled: Boolean(id),
		queryFn: () => api.getOpportunity(id || '')
	})
	const boq = useQuery({
		queryKey: ['boq', id],
		enabled: Boolean(id),
		queryFn: () => api.listBoQ(id || '')
	})
	const quotes = useQuery({
		queryKey: ['quotes', id],
		enabled: Boolean(id),
		queryFn: () => api.listQuotes(id || '')
	})
	const packRows = useQuery({
		queryKey: ['pack-rows', id],
		enabled: Boolean(id),
		queryFn: () => api.listPackRows(id || '')
	})
	const packCalc = useQuery({
		queryKey: ['pack', id, packParams],
		enabled: false,
		queryFn: () => api.recalcPack(id || '', packParams)
	})
	const fxRates = useQuery({
		queryKey: ['fx-rates'],
		queryFn: api.listFxRates
	})
	const boqTemplates = useQuery({
		queryKey: ['pricing-templates', id, 'BOQ'],
		enabled: Boolean(id),
		queryFn: () => api.listPricingTemplates({ workspace: 'BOQ', opportunityId: id })
	})
	const packTemplates = useQuery({
		queryKey: ['pricing-templates', id, 'PACK'],
		enabled: Boolean(id),
		queryFn: () => api.listPricingTemplates({ workspace: 'PACK', opportunityId: id })
	})

	useEffect(() => {
		const selectedId = opportunityQuery.data?.boqTemplateId
		const template = boqTemplates.data?.find(t => t.id === selectedId)
		if (template) setBoqColumns(mergeColumns(DEFAULT_BOQ_COLUMNS, template.columns))
	}, [boqTemplates.data, opportunityQuery.data?.boqTemplateId])

	useEffect(() => {
		const selectedId = opportunityQuery.data?.packTemplateId
		const template = packTemplates.data?.find(t => t.id === selectedId)
		if (template) setPackColumns(mergeColumns(DEFAULT_PACK_COLUMNS, template.columns))
	}, [packTemplates.data, opportunityQuery.data?.packTemplateId])

	const addBoq = useMutation({
		mutationFn: () => {
			const parsed = parseCurrencyInput(newBoq.unitCost, newBoq.unitCurrency)
			return api.createBoQ(id || '', {
				lineNo: newBoq.lineNo,
				description: newBoq.description,
				qty: newBoq.qty,
				unit: newBoq.unit,
				unitCost: parsed.amount,
				unitCurrency: parsed.currency,
				markup: newBoq.markup,
				unitPrice: parsed.amount * (1 + (newBoq.markup || 0)),
				customFields: newBoq.customFields
			})
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['boq', id] })
			setShowAddBoq(false)
			setNewBoq({
				lineNo: (boq.data?.length || 0) + 1,
				description: '',
				qty: 1,
				unit: '',
				unitCost: '',
				unitCurrency: BASE_CURRENCY,
				markup: 0.15,
				customFields: {}
			})
		}
	})

	const updateBoq = useMutation({
		mutationFn: (item: BoQItem) =>
			api.updateBoQ(item.id, { ...item, unitPrice: item.unitCost * (1 + (item.markup || 0)) }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['boq', id] })
			setEditingBoq(null)
		}
	})

	const addPackRow = useMutation({
		mutationFn: () => {
			const parsed = parseCurrencyInput(newPack.unitCost, newPack.unitCurrency)
			return api.createPackRow(id || '', {
				lineNo: newPack.lineNo,
				description: newPack.description,
				qty: newPack.qty,
				unit: newPack.unit,
				unitCost: parsed.amount,
				unitCurrency: parsed.currency,
				customFields: newPack.customFields
			})
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['pack-rows', id] })
			setShowAddPack(false)
			setNewPack({
				lineNo: (packRows.data?.length || 0) + 1,
				description: '',
				qty: 1,
				unit: '',
				unitCost: '',
				unitCurrency: BASE_CURRENCY,
				customFields: {}
			})
		}
	})

	const updatePack = useMutation({
		mutationFn: (row: PricingPackRow) => api.updatePackRow(row.id, row),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['pack-rows', id] })
			setEditingPack(null)
		}
	})

	const addQuote = useMutation({
		mutationFn: () => api.createQuote(id || '', newQuote),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['quotes', id] })
			setShowAddQuote(false)
			setNewQuote({ vendor: '', quoteNo: '', currency: 'QAR' })
		}
	})

	const deleteBoq = useMutation({
		mutationFn: (itemId: string) => api.deleteBoQ(itemId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['boq', id] })
	})

	const deletePackRow = useMutation({
		mutationFn: (itemId: string) => api.deletePackRow(itemId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['pack-rows', id] })
	})

	const recalc = useMutation({
		mutationFn: async () => {
			setError(null)
			if (packParams.margin < MIN_MARGIN) {
				throw new Error(`Margin below guardrail (${(MIN_MARGIN * 100).toFixed(0)}%). Increase margin.`)
			}
			return api.recalcPack(id || '', packParams)
		},
		onSuccess: data => qc.setQueryData(['pack', id], data),
		onError: e => setError((e as Error).message)
	})

	const saveTemplate = useMutation({
		mutationFn: (payload: { workspace: 'BOQ' | 'PACK'; scope: 'GLOBAL' | 'OPPORTUNITY'; name: string; columns: Column[] }) =>
			api.createPricingTemplate({
				workspace: payload.workspace,
				scope: payload.scope,
				name: payload.name,
				columns: payload.columns,
				opportunityId: payload.scope === 'OPPORTUNITY' ? id : undefined
			}),
		onSuccess: template => {
			if (template.workspace === 'BOQ') {
				api.updateOpportunity(id || '', { boqTemplateId: template.id })
				boqTemplates.refetch()
			}
			if (template.workspace === 'PACK') {
				api.updateOpportunity(id || '', { packTemplateId: template.id })
				packTemplates.refetch()
			}
			opportunityQuery.refetch()
		}
	})

	const updateTemplate = useMutation({
		mutationFn: (payload: { id: string; columns: Column[]; name: string }) =>
			api.updatePricingTemplate(payload.id, { name: payload.name, columns: payload.columns }),
		onSuccess: () => {
			boqTemplates.refetch()
			packTemplates.refetch()
		}
	})

	const totalBoq = useMemo(() => {
		const rows = boq.data || []
		const getRate = (currency: string) => {
			const match = fxRates.data?.find(r => r.currency === currency)
			return match?.rateToQar
		}
		return rows.reduce((sum, row) => {
			const currency = (row.unitCurrency || BASE_CURRENCY).toUpperCase()
			const rate = currency === BASE_CURRENCY ? 1 : getRate(currency)
			const unit = rate ? row.unitCost * rate : row.unitCost
			return sum + unit * row.qty
		}, 0)
	}, [boq.data, fxRates.data])

	const pack: PricingPack | undefined =
		(qc.getQueryData(['pack', id]) as PricingPack | undefined) || packCalc.data || undefined

	const boqRows = useMemo(() => {
		return (boq.data || []).map(row => ({
			...row,
			customFields: row.customFields || {}
		}))
	}, [boq.data])

	const packRowData = useMemo(() => {
		return (packRows.data || []).map(row => ({
			...row,
			customFields: row.customFields || {}
		}))
	}, [packRows.data])

	const rateForCurrency = (currency: string) => {
		const code = currency.toUpperCase()
		if (code === BASE_CURRENCY) return 1
		const rate = fxRates.data?.find(r => r.currency === code)
		return rate?.rateToQar ?? null
	}

	const boqCellValue = useMemo(
		() => getCellValueFactory(boqColumns, boqRows, rateForCurrency),
		[boqColumns, boqRows, fxRates.data]
	)
	const packCellValue = useMemo(
		() => getCellValueFactory(packColumns, packRowData, rateForCurrency),
		[packColumns, packRowData, fxRates.data]
	)

	function renderCellValue(row: any, rowIndex: number, colIndex: number, columns: Column[], getCellValue: any) {
		const column = columns[colIndex]
		if (!column) return '—'
		if (column.type === 'formula') {
			try {
				const value = getCellValue(rowIndex, colIndex, new Set())
				if (!Number.isFinite(value)) return '—'
				return column.label.toLowerCase().includes('qar') || column.key === 'total'
					? `${value.toFixed(2)} ${BASE_CURRENCY}`
					: value.toFixed(2)
			} catch {
				return 'ERR'
			}
		}
		if (column.key === 'unitCurrency') return row.unitCurrency || BASE_CURRENCY
		if (column.key === 'unitCost') {
			return `${row.unitCost ?? 0} ${row.unitCurrency || BASE_CURRENCY}`
		}
		const raw = row[column.key] ?? row.customFields?.[column.key]
		return raw ?? '—'
	}

	function renderColumnManager(columns: Column[], setColumns: (cols: Column[]) => void, workspace: 'BOQ' | 'PACK') {
		const selectedTemplate =
			workspace === 'BOQ'
				? boqTemplates.data?.find(t => t.id === opportunityQuery.data?.boqTemplateId)
				: packTemplates.data?.find(t => t.id === opportunityQuery.data?.packTemplateId)
		const templateName = workspace === 'BOQ' ? boqTemplateName : packTemplateName

		return (
			<div className="mt-3 rounded border bg-white p-3 text-sm">
				<div className="flex flex-wrap items-center gap-2">
					<select
						className="rounded border px-2 py-1 text-sm"
						value={selectedTemplate?.id || ''}
						onChange={e => {
							const templateId = e.target.value
							const template = (workspace === 'BOQ' ? boqTemplates.data : packTemplates.data)?.find(
								t => t.id === templateId
							)
							if (template) {
								setColumns(mergeColumns(workspace === 'BOQ' ? DEFAULT_BOQ_COLUMNS : DEFAULT_PACK_COLUMNS, template.columns))
								api.updateOpportunity(id || '', {
									[workspace === 'BOQ' ? 'boqTemplateId' : 'packTemplateId']: template.id
								} as any)
							}
						}}
					>
						<option value="">Select template</option>
						{(workspace === 'BOQ' ? boqTemplates.data : packTemplates.data)?.map(t => (
							<option key={t.id} value={t.id}>
								{t.scope === 'GLOBAL' ? 'Global' : 'Opportunity'}: {t.name}
							</option>
						))}
					</select>
					<input
						className="rounded border px-2 py-1 text-sm"
						placeholder="Template name"
						value={workspace === 'BOQ' ? boqTemplateName : packTemplateName}
						onChange={e =>
							workspace === 'BOQ'
								? setBoqTemplateName(e.target.value)
								: setPackTemplateName(e.target.value)
						}
					/>
					<button
						className="rounded bg-slate-200 px-2 py-1 text-xs disabled:opacity-50"
						onClick={() =>
							saveTemplate.mutate({
								workspace,
								scope: 'GLOBAL',
								name: templateName,
								columns
							})
						}
						disabled={saveTemplate.isPending || !templateName}
					>
						Save Global Template
					</button>
					<button
						className="rounded bg-slate-200 px-2 py-1 text-xs disabled:opacity-50"
						onClick={() =>
							saveTemplate.mutate({
								workspace,
								scope: 'OPPORTUNITY',
								name: templateName,
								columns
							})
						}
						disabled={saveTemplate.isPending || !templateName}
					>
						Save Opportunity Template
					</button>
					{selectedTemplate && (
						<button
							className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
							onClick={() => updateTemplate.mutate({ id: selectedTemplate.id, name: selectedTemplate.name, columns })}
							disabled={updateTemplate.isPending}
						>
							Update Selected
						</button>
					)}
				</div>
				<div className="mt-3 grid gap-2">
					{columns.map((column, index) => (
						<div key={column.key} className="grid gap-2 rounded border px-2 py-2 md:grid-cols-4">
							<input
								className="rounded border px-2 py-1 text-xs"
								value={column.label}
								onChange={e => {
									const copy = [...columns]
									copy[index] = { ...copy[index], label: e.target.value }
									setColumns(copy)
								}}
							/>
							<select
								className="rounded border px-2 py-1 text-xs"
								value={column.type}
								onChange={e => {
									const copy = [...columns]
									copy[index] = { ...copy[index], type: e.target.value as Column['type'] }
									setColumns(copy)
								}}
							>
								<option value="text">Text</option>
								<option value="number">Number</option>
								<option value="currency">Currency</option>
								<option value="formula">Formula</option>
							</select>
							<input
								className="rounded border px-2 py-1 text-xs"
								value={column.formula || ''}
								onChange={e => {
									const copy = [...columns]
									copy[index] = { ...copy[index], formula: e.target.value }
									setColumns(copy)
								}}
								placeholder="=C2*D2"
								disabled={column.type !== 'formula'}
							/>
							<span className="text-xs text-slate-500">
								Key: {column.key} ({columnLabelFromIndex(index)})
							</span>
						</div>
					))}
					<button
						className="w-fit rounded bg-slate-200 px-2 py-1 text-xs"
						onClick={() =>
							setColumns([
								...columns,
								{
									key: `custom_${columns.length + 1}`,
									label: `Custom ${columns.length + 1}`,
									type: 'number'
								}
							])
						}
					>
						+ Add Column
					</button>
				</div>
			</div>
		)
	}

	return (
		<OpportunityShell active="pricing">
			<div className="p-4 space-y-8">
				<div>
					<div className="flex items-center justify-between">
						<h2 className="font-semibold">Bill of Quantities</h2>
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
							onClick={() => setShowAddBoq(true)}
						>
							+ Add Item
						</button>
					</div>

					{renderColumnManager(boqColumns, setBoqColumns, 'BOQ')}

					{showAddBoq && (
						<div className="mt-3 rounded border bg-white p-4 shadow-sm">
							<div className="grid gap-3 sm:grid-cols-6">
								<label className="text-xs font-medium">
									Line #
									<input
										type="number"
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.lineNo}
										onChange={e => setNewBoq({ ...newBoq, lineNo: +e.target.value })}
									/>
								</label>
								<label className="text-xs font-medium sm:col-span-2">
									Description
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.description}
										onChange={e => setNewBoq({ ...newBoq, description: e.target.value })}
									/>
								</label>
								<label className="text-xs font-medium">
									Qty
									<input
										type="number"
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.qty}
										onChange={e => setNewBoq({ ...newBoq, qty: +e.target.value })}
									/>
								</label>
								<label className="text-xs font-medium">
									Unit Cost
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.unitCost}
										onChange={e => {
											const parsed = parseCurrencyInput(e.target.value, newBoq.unitCurrency)
											setNewBoq({ ...newBoq, unitCost: e.target.value, unitCurrency: parsed.currency })
										}}
										placeholder="e.g. $44"
									/>
								</label>
								<label className="text-xs font-medium">
									Currency
									<select
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.unitCurrency}
										onChange={e => setNewBoq({ ...newBoq, unitCurrency: e.target.value })}
									>
										{CURRENCY_OPTIONS.map(c => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
								</label>
								<label className="text-xs font-medium">
									Markup
									<input
										type="number"
										step="0.01"
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.markup}
										onChange={e => setNewBoq({ ...newBoq, markup: +e.target.value })}
									/>
								</label>
								{customColumns(boqColumns, BOQ_BASE_KEYS).map(col => (
									<label key={col.key} className="text-xs font-medium">
										{col.label}
										<input
											className="mt-1 w-full rounded border p-2 text-sm"
											value={newBoq.customFields[col.key] ?? ''}
											onChange={e =>
												setNewBoq({
													...newBoq,
													customFields: { ...newBoq.customFields, [col.key]: e.target.value }
												})
											}
										/>
									</label>
								))}
							</div>
							<div className="mt-3 flex gap-2">
								<button
									className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
									onClick={() => addBoq.mutate()}
									disabled={!newBoq.description || addBoq.isPending}
								>
									{addBoq.isPending ? 'Saving...' : 'Save'}
								</button>
								<button
									className="rounded bg-slate-200 px-3 py-1.5 text-sm"
									onClick={() => setShowAddBoq(false)}
									disabled={addBoq.isPending}
								>
									Cancel
								</button>
							</div>
						</div>
					)}

					{boq.isLoading ? (
						<p className="mt-3 text-sm text-slate-600">Loading...</p>
					) : (
						<div className="mt-3 overflow-x-auto rounded border bg-white shadow-sm">
							<table className="min-w-full text-sm">
								<thead className="bg-slate-100">
									<tr>
										{boqColumns.map(col => (
											<th key={col.key} className="px-3 py-2 text-left">
												{col.label}
											</th>
										))}
										<th className="px-3 py-2"></th>
									</tr>
								</thead>
								<tbody>
									{boqRows.map((row, rowIndex) => (
										<tr key={row.id} className="border-t">
											{boqColumns.map((col, colIndex) => (
												<td key={col.key} className="px-3 py-2">
													{renderCellValue(row, rowIndex, colIndex, boqColumns, boqCellValue)}
												</td>
											))}
											<td className="px-3 py-2">
												<div className="flex gap-2">
													<button
														className="text-xs text-blue-600 hover:underline"
														onClick={() => setEditingBoq(row)}
													>
														Edit
													</button>
													<button
														className="text-xs text-red-600 hover:underline"
														onClick={() => {
															if (confirm('Delete this BoQ item?')) deleteBoq.mutate(row.id)
														}}
														disabled={deleteBoq.isPending}
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									))}
									<tr className="border-t bg-slate-50 font-semibold">
										<td colSpan={boqColumns.length - 1} className="px-3 py-2 text-right">
											Total BoQ ({BASE_CURRENCY})
										</td>
										<td className="px-3 py-2 text-right">{totalBoq.toFixed(2)}</td>
										<td></td>
									</tr>
								</tbody>
							</table>
						</div>
					)}
				</div>

				{editingBoq && (
					<div className="rounded border bg-white p-4 shadow-sm">
						<h3 className="text-sm font-medium">Edit BoQ Item</h3>
						<div className="mt-2 grid gap-3 sm:grid-cols-6">
							<label className="text-xs font-medium">
								Line #
								<input
									type="number"
									className="mt-1 w-full rounded border p-2 text-sm"
									value={editingBoq.lineNo}
									onChange={e => setEditingBoq({ ...editingBoq, lineNo: +e.target.value })}
								/>
							</label>
							<label className="text-xs font-medium sm:col-span-2">
								Description
								<input
									className="mt-1 w-full rounded border p-2 text-sm"
									value={editingBoq.description}
									onChange={e => setEditingBoq({ ...editingBoq, description: e.target.value })}
								/>
							</label>
							<label className="text-xs font-medium">
								Qty
								<input
									type="number"
									className="mt-1 w-full rounded border p-2 text-sm"
									value={editingBoq.qty}
									onChange={e => setEditingBoq({ ...editingBoq, qty: +e.target.value })}
								/>
							</label>
							<label className="text-xs font-medium">
								Unit Cost
								<input
									className="mt-1 w-full rounded border p-2 text-sm"
									value={String(editingBoq.unitCost ?? '')}
									onChange={e => {
										const parsed = parseCurrencyInput(e.target.value, editingBoq.unitCurrency || BASE_CURRENCY)
										setEditingBoq({
											...editingBoq,
											unitCost: parsed.amount,
											unitCurrency: parsed.currency
										})
									}}
								/>
							</label>
							<label className="text-xs font-medium">
								Currency
								<select
									className="mt-1 w-full rounded border p-2 text-sm"
									value={editingBoq.unitCurrency || BASE_CURRENCY}
									onChange={e => setEditingBoq({ ...editingBoq, unitCurrency: e.target.value })}
								>
									{CURRENCY_OPTIONS.map(c => (
										<option key={c} value={c}>
											{c}
										</option>
									))}
								</select>
							</label>
							<label className="text-xs font-medium">
								Markup
								<input
									type="number"
									step="0.01"
									className="mt-1 w-full rounded border p-2 text-sm"
									value={editingBoq.markup}
									onChange={e => setEditingBoq({ ...editingBoq, markup: +e.target.value })}
								/>
							</label>
							{customColumns(boqColumns, BOQ_BASE_KEYS).map(col => (
								<label key={col.key} className="text-xs font-medium">
									{col.label}
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={editingBoq.customFields?.[col.key] ?? ''}
										onChange={e =>
											setEditingBoq({
												...editingBoq,
												customFields: { ...editingBoq.customFields, [col.key]: e.target.value }
											})
										}
									/>
								</label>
							))}
						</div>
						<div className="mt-3 flex gap-2">
							<button
								className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
								onClick={() => updateBoq.mutate(editingBoq)}
								disabled={updateBoq.isPending}
							>
								Save
							</button>
							<button
								className="rounded bg-slate-200 px-3 py-1.5 text-sm"
								onClick={() => setEditingBoq(null)}
							>
								Cancel
							</button>
						</div>
					</div>
				)}

				<div className="mt-8">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold">Pricing Pack Worksheet</h2>
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
							onClick={() => setShowAddPack(true)}
						>
							+ Add Row
						</button>
					</div>

					{renderColumnManager(packColumns, setPackColumns, 'PACK')}

					{showAddPack && (
						<div className="mt-3 rounded border bg-white p-4 shadow-sm">
							<div className="grid gap-3 sm:grid-cols-5">
								<label className="text-xs font-medium">
									Line #
									<input
										type="number"
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newPack.lineNo}
										onChange={e => setNewPack({ ...newPack, lineNo: +e.target.value })}
									/>
								</label>
								<label className="text-xs font-medium sm:col-span-2">
									Description
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newPack.description}
										onChange={e => setNewPack({ ...newPack, description: e.target.value })}
									/>
								</label>
								<label className="text-xs font-medium">
									Qty
									<input
										type="number"
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newPack.qty}
										onChange={e => setNewPack({ ...newPack, qty: +e.target.value })}
									/>
								</label>
								<label className="text-xs font-medium">
									Unit Cost
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newPack.unitCost}
										onChange={e => {
											const parsed = parseCurrencyInput(e.target.value, newPack.unitCurrency)
											setNewPack({ ...newPack, unitCost: e.target.value, unitCurrency: parsed.currency })
										}}
									/>
								</label>
								<label className="text-xs font-medium">
									Currency
									<select
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newPack.unitCurrency}
										onChange={e => setNewPack({ ...newPack, unitCurrency: e.target.value })}
									>
										{CURRENCY_OPTIONS.map(c => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
								</label>
								{customColumns(packColumns, PACK_BASE_KEYS).map(col => (
									<label key={col.key} className="text-xs font-medium">
										{col.label}
										<input
											className="mt-1 w-full rounded border p-2 text-sm"
											value={newPack.customFields[col.key] ?? ''}
											onChange={e =>
												setNewPack({
													...newPack,
													customFields: { ...newPack.customFields, [col.key]: e.target.value }
												})
											}
										/>
									</label>
								))}
							</div>
							<div className="mt-3 flex gap-2">
								<button
									className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
									onClick={() => addPackRow.mutate()}
									disabled={!newPack.description || addPackRow.isPending}
								>
									{addPackRow.isPending ? 'Saving...' : 'Save'}
								</button>
								<button
									className="rounded bg-slate-200 px-3 py-1.5 text-sm"
									onClick={() => setShowAddPack(false)}
									disabled={addPackRow.isPending}
								>
									Cancel
								</button>
							</div>
						</div>
					)}

					{packRows.isLoading ? (
						<p className="mt-3 text-sm text-slate-600">Loading...</p>
					) : (
						<div className="mt-3 overflow-x-auto rounded border bg-white shadow-sm">
							<table className="min-w-full text-sm">
								<thead className="bg-slate-100">
									<tr>
										{packColumns.map(col => (
											<th key={col.key} className="px-3 py-2 text-left">
												{col.label}
											</th>
										))}
										<th className="px-3 py-2"></th>
									</tr>
								</thead>
								<tbody>
									{packRowData.map((row, rowIndex) => (
										<tr key={row.id} className="border-t">
											{packColumns.map((col, colIndex) => (
												<td key={col.key} className="px-3 py-2">
													{renderCellValue(row, rowIndex, colIndex, packColumns, packCellValue)}
												</td>
											))}
											<td className="px-3 py-2">
												<div className="flex gap-2">
													<button
														className="text-xs text-blue-600 hover:underline"
														onClick={() => setEditingPack(row)}
													>
														Edit
													</button>
													<button
														className="text-xs text-red-600 hover:underline"
														onClick={() => {
															if (confirm('Delete this pack row?')) deletePackRow.mutate(row.id)
														}}
														disabled={deletePackRow.isPending}
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{editingPack && (
					<div className="rounded border bg-white p-4 shadow-sm">
						<h3 className="text-sm font-medium">Edit Pack Row</h3>
						<div className="mt-2 grid gap-3 sm:grid-cols-5">
							<label className="text-xs font-medium">
								Line #
								<input
									type="number"
									className="mt-1 w-full rounded border p-2 text-sm"
									value={editingPack.lineNo}
									onChange={e => setEditingPack({ ...editingPack, lineNo: +e.target.value })}
								/>
							</label>
							<label className="text-xs font-medium sm:col-span-2">
								Description
								<input
									className="mt-1 w-full rounded border p-2 text-sm"
									value={editingPack.description}
									onChange={e => setEditingPack({ ...editingPack, description: e.target.value })}
								/>
							</label>
							<label className="text-xs font-medium">
								Qty
								<input
									type="number"
									className="mt-1 w-full rounded border p-2 text-sm"
									value={editingPack.qty}
									onChange={e => setEditingPack({ ...editingPack, qty: +e.target.value })}
								/>
							</label>
							<label className="text-xs font-medium">
								Unit Cost
								<input
									className="mt-1 w-full rounded border p-2 text-sm"
									value={String(editingPack.unitCost ?? '')}
									onChange={e => {
										const parsed = parseCurrencyInput(e.target.value, editingPack.unitCurrency || BASE_CURRENCY)
										setEditingPack({
											...editingPack,
											unitCost: parsed.amount,
											unitCurrency: parsed.currency
										})
									}}
								/>
							</label>
							<label className="text-xs font-medium">
								Currency
								<select
									className="mt-1 w-full rounded border p-2 text-sm"
									value={editingPack.unitCurrency || BASE_CURRENCY}
									onChange={e => setEditingPack({ ...editingPack, unitCurrency: e.target.value })}
								>
									{CURRENCY_OPTIONS.map(c => (
										<option key={c} value={c}>
											{c}</option>
									))}
								</select>
							</label>
							{customColumns(packColumns, PACK_BASE_KEYS).map(col => (
								<label key={col.key} className="text-xs font-medium">
									{col.label}
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={editingPack.customFields?.[col.key] ?? ''}
										onChange={e =>
											setEditingPack({
												...editingPack,
												customFields: { ...editingPack.customFields, [col.key]: e.target.value }
											})
										}
									/>
								</label>
							))}
						</div>
						<div className="mt-3 flex gap-2">
							<button
								className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
								onClick={() => updatePack.mutate(editingPack)}
								disabled={updatePack.isPending}
							>
								Save
							</button>
							<button
								className="rounded bg-slate-200 px-3 py-1.5 text-sm"
								onClick={() => setEditingPack(null)}
							>
								Cancel
							</button>
						</div>
					</div>
				)}

				<div className="mt-8">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold">Vendor Quotes</h2>
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
							onClick={() => setShowAddQuote(true)}
						>
							+ Add Quote
						</button>
					</div>

					{showAddQuote && (
						<div className="mt-3 rounded border bg-white p-4 shadow-sm">
							<div className="grid gap-3 sm:grid-cols-3">
								<label className="block text-xs font-medium">
									Vendor
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newQuote.vendor}
										onChange={e => setNewQuote({ ...newQuote, vendor: e.target.value })}
									/>
								</label>
								<label className="block text-xs font-medium">
									Quote No
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newQuote.quoteNo}
										onChange={e => setNewQuote({ ...newQuote, quoteNo: e.target.value })}
									/>
								</label>
								<label className="block text-xs font-medium">
									Currency
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newQuote.currency}
										onChange={e => setNewQuote({ ...newQuote, currency: e.target.value })}
									/>
								</label>
							</div>
							<div className="mt-3 flex gap-2">
								<button
									className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
									onClick={() => addQuote.mutate()}
									disabled={!newQuote.vendor || addQuote.isPending}
								>
									{addQuote.isPending ? 'Saving...' : 'Save'}
								</button>
								<button
									className="rounded bg-slate-200 px-3 py-1.5 text-sm"
									onClick={() => setShowAddQuote(false)}
									disabled={addQuote.isPending}
								>
									Cancel
								</button>
							</div>
						</div>
					)}

					{quotes.isLoading ? (
						<p className="mt-3 text-sm text-slate-600">Loading...</p>
					) : (
						<div className="mt-3 overflow-x-auto rounded border bg-white shadow-sm">
							<table className="min-w-full text-sm">
								<thead className="bg-slate-100">
									<tr>
										<th className="px-3 py-2 text-left">Vendor</th>
										<th className="px-3 py-2 text-left">Quote No</th>
										<th className="px-3 py-2 text-left">Currency</th>
									</tr>
								</thead>
								<tbody>
									{(quotes.data || []).map(q => (
										<tr key={q.id} className="border-t">
											<td className="px-3 py-2">{q.vendor}</td>
											<td className="px-3 py-2">{q.quoteNo || '-'}</td>
											<td className="px-3 py-2">{q.currency || '-'}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				<div className="mt-8 rounded border bg-white p-4 shadow-sm">
					<h2 className="font-semibold">Pricing Pack</h2>
					<div className="mt-3 grid gap-4 sm:grid-cols-4">
						<label className="text-sm">
							Overheads
							<input
								type="number"
								step="0.01"
								className="mt-1 w-full rounded border px-3 py-2 text-sm"
								value={packParams.overheads}
								onChange={e => setPackParams({ ...packParams, overheads: +e.target.value })}
							/>
						</label>
						<label className="text-sm">
							Contingency
							<input
								type="number"
								step="0.01"
								className="mt-1 w-full rounded border px-3 py-2 text-sm"
								value={packParams.contingency}
								onChange={e => setPackParams({ ...packParams, contingency: +e.target.value })}
							/>
						</label>
						<label className="text-sm">
							FX Rate
							<input
								type="number"
								step="0.01"
								className="mt-1 w-full rounded border px-3 py-2 text-sm"
								value={packParams.fxRate}
								onChange={e => setPackParams({ ...packParams, fxRate: +e.target.value })}
							/>
						</label>
						<label className="text-sm">
							Margin
							<input
								type="number"
								step="0.01"
								className="mt-1 w-full rounded border px-3 py-2 text-sm"
								value={packParams.margin}
								onChange={e => setPackParams({ ...packParams, margin: +e.target.value })}
							/>
						</label>
					</div>
					<div className="mt-3 flex items-center gap-2">
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
							onClick={() => recalc.mutate()}
							disabled={recalc.isPending}
						>
							{recalc.isPending ? 'Calculating...' : 'Recalculate Pack'}
						</button>
						{error && <span className="text-sm text-red-600">{error}</span>}
					</div>
					{pack && (
						<div className="mt-4 text-sm text-slate-700">
							<p>Base Cost ({BASE_CURRENCY}): {pack.baseCost.toFixed(2)}</p>
							<p>Total Price ({BASE_CURRENCY}): {pack.totalPrice.toFixed(2)}</p>
						</div>
					)}
				</div>
			</div>
		</OpportunityShell>
	)
}
