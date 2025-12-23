import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className={clsx(
				'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm transition focus:border-blue-400 focus:ring-blue-200',
				className
			)}
			{...props}
		/>
	)
}
