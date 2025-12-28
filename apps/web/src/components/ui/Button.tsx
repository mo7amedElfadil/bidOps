import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant
	size?: ButtonSize
	startIcon?: ReactNode
	endIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary border-primary',
	secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary border-border',
	ghost: 'bg-transparent text-foreground hover:bg-muted/80 focus-visible:ring-ring border-transparent',
	danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive border-destructive'
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
				'inline-flex items-center justify-center rounded-md border font-semibold transition',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
				'disabled:opacity-50 disabled:cursor-not-allowed',
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
