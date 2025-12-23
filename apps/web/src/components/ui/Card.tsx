import clsx from 'clsx'

type CardProps = {
	children: React.ReactNode
	className?: string
	header?: React.ReactNode
	footer?: React.ReactNode
}

export default function Card({ children, header, footer, className }: CardProps) {
	return (
		<div className={clsx('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
			{header && <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">{header}</div>}
			<div className="p-4">{children}</div>
			{footer && <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">{footer}</div>}
		</div>
	)
}
