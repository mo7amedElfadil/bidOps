import clsx from 'clsx'
import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react'

type TableProps = {
	children: ReactNode
	className?: string
}

export function Table({ children, className }: TableProps) {
	return (
		<div className="w-full overflow-auto">
			<table className={clsx('w-full border-collapse text-sm', className)}>
				{children}
			</table>
		</div>
	)
}

export function TableHeader({ children, className }: TableProps) {
	return (
		<thead className={clsx('border-b border-border bg-muted/50', className)}>
			{children}
		</thead>
	)
}

export function TableBody({ children, className }: TableProps) {
	return <tbody className={className}>{children}</tbody>
}

export function TableRow({ children, className }: TableProps) {
	return (
		<tr 
			className={clsx(
				'border-b border-border transition-colors hover:bg-muted/50',
				'data-[theme="hyprdark"]:border-[rgb(var(--grid-line))]',
				className
			)}
		>
			{children}
		</tr>
	)
}

export function TableHead({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			className={clsx(
				'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
				className
			)}
			{...props}
		>
			{children}
		</th>
	)
}

export function TableCell({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
	return (
		<td
			className={clsx('px-4 py-3 text-foreground', className)}
			{...props}
		>
			{children}
		</td>
	)
}
