import clsx from 'clsx'
import type { TextareaHTMLAttributes } from 'react'

export default function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return (
		<textarea
			className={clsx(
				'w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground transition',
				'placeholder:text-muted-foreground',
				'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
				'disabled:cursor-not-allowed disabled:opacity-50',
				'resize-vertical',
				className
			)}
			{...props}
		/>
	)
}
