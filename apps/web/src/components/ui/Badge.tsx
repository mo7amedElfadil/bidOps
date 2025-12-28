import clsx from 'clsx'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'

type BadgeProps = {
	children: ReactNode
	variant?: BadgeVariant
	className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
	default: 'bg-muted text-foreground border-border',
	primary: 'bg-primary/10 text-primary border-primary/20',
	secondary: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
	success: 'bg-green-500/10 text-green-600 border-green-500/20 data-[theme="hyprdark"]:text-green-400',
	warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 data-[theme="hyprdark"]:text-amber-400',
	danger: 'bg-destructive/10 text-destructive border-destructive/20'
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
	return (
		<span
			className={clsx(
				'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
				'data-[theme="hyprdark"]:font-mono data-[theme="hyprdark"]:text-[11px]',
				variantClasses[variant],
				className
			)}
		>
			{children}
		</span>
	)
}
