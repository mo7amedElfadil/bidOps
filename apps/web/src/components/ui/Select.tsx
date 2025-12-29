import clsx from 'clsx'
import type { SelectHTMLAttributes } from 'react'

export default function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<select
			className={clsx(
				'w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground transition',
				'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
				'disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			{...props}
		>
			{children}
		</select>
	)
}
