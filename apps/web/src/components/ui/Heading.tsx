type HeadingProps = {
	title: string
	subtitle?: string
	children?: React.ReactNode
	className?: string
}

export default function Heading({ title, subtitle, children, className }: HeadingProps) {
	return (
		<div className={className}>
			<h1 className="text-xl font-semibold text-slate-900">{title}</h1>
			{subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
			{children}
		</div>
	)
}
