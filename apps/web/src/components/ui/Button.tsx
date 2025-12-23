import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant
	size?: ButtonSize
	startIcon?: ReactNode
	endIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
	secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-slate-500',
	ghost: 'bg-transparent text-slate-900 hover:text-slate-900/80 focus-visible:ring-slate-500'
}

const sizeClasses: Record<ButtonSize, string> = {
	sm: 'px-3 py-1.5 text-sm',
	md: 'px-4 py-2 text-sm',
	lg: 'px-5 py-2.5 text-base'
}

export default function Button({
	variant = 'primary',
	size = 'md',
	className,
	startIcon,
	endIcon,
	children,
	...props
}: ButtonProps) {
	return (
		<button
			className={clsx(
				'inline-flex items-center justify-center rounded border border-transparent font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
				variantClasses[variant],
				sizeClasses[size],
				className
			)}
			{...props}
		>
			{startIcon && <span className="mr-2 h-4 w-4">{startIcon}</span>}
			{children}
			{endIcon && <span className="ml-2 h-4 w-4">{endIcon}</span>}
		</button>
	)
}
