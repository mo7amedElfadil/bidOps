import { useEffect, useState, type KeyboardEvent } from 'react'

type PaginationControlsProps = {
	page: number
	pageSize: number
	total: number
	onPageChange: (page: number) => void
	disabled?: boolean
	className?: string
	label?: string
}

export default function PaginationControls({
	page,
	pageSize,
	total,
	onPageChange,
	disabled,
	className,
	label
}: PaginationControlsProps) {
	const maxPage = Math.max(1, Math.ceil(total / pageSize))
	const [inputValue, setInputValue] = useState(String(page))

	useEffect(() => {
		setInputValue(String(page))
	}, [page])

	const clampPage = (value: number) => Math.min(maxPage, Math.max(1, value))

	const handleGo = () => {
		const parsed = Number(inputValue)
		if (Number.isNaN(parsed)) return
		const nextPage = clampPage(parsed)
		onPageChange(nextPage)
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			handleGo()
		}
	}

	return (
		<div className={`flex flex-wrap items-center gap-3 text-sm text-muted-foreground ${className || ''}`}>
			{label && <span className="font-semibold text-foreground">{label}</span>}
			<span>
				Page {page} of {maxPage} ({total.toLocaleString()} items)
			</span>
			<div className="flex items-center gap-2">
				<span className="text-xs text-muted-foreground">Go to</span>
				<input
					type="number"
					min={1}
					max={maxPage}
					className="w-20 rounded border px-2 py-1 text-sm"
					value={inputValue}
					onChange={event => setInputValue(event.target.value)}
					onKeyDown={handleKeyDown}
					disabled={disabled}
				/>
				<button
					className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80 disabled:opacity-50"
					onClick={handleGo}
					disabled={disabled}
				>
					Go
				</button>
			</div>
			<div className="flex gap-2">
				<button
					className="rounded bg-muted px-3 py-1.5 text-xs hover:bg-muted/80 disabled:opacity-50"
					onClick={() => onPageChange(clampPage(page - 1))}
					disabled={disabled || page <= 1}
				>
					Prev
				</button>
				<button
					className="rounded bg-muted px-3 py-1.5 text-xs hover:bg-muted/80 disabled:opacity-50"
					onClick={() => onPageChange(clampPage(page + 1))}
					disabled={disabled || page >= maxPage}
				>
					Next
				</button>
			</div>
		</div>
	)
}
