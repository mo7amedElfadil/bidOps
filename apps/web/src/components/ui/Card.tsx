import clsx from 'clsx'

type CardProps = {
	children: React.ReactNode
	className?: string
	header?: React.ReactNode
	footer?: React.ReactNode
	titlebar?: boolean
}

export default function Card({ children, header, footer, className, titlebar = false }: CardProps) {
	return (
		<div className={clsx(
			'rounded-lg border bg-card text-card-foreground shadow-sm',
			'data-[theme="hyprdark"]:bg-[rgb(var(--panel-bg))] data-[theme="hyprdark"]:border-[rgb(var(--panel-border))]',
			className
		)}>
			{header && (
				<div className={clsx(
					'px-4 py-3 text-sm font-semibold',
					titlebar
						? 'data-[theme="hyprdark"]:bg-[rgb(var(--panel-titlebar-bg))] data-[theme="hyprdark"]:border-b data-[theme="hyprdark"]:border-[rgb(var(--panel-border))]'
						: 'border-b border-border'
				)}>
					{header}
				</div>
			)}
			<div className="p-4">{children}</div>
			{footer && <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{footer}</div>}
		</div>
	)
}
