import React from 'react'

export function Page({
	title,
	actions,
	children,
	subtitle
}: {
	title: string
	subtitle?: string
	actions?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<div className="w-full px-8 py-6 lg:px-12">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-semibold">{title}</h1>
					{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
				</div>
				{actions && <div className="flex gap-2">{actions}</div>}
			</div>
			{children}
		</div>
	)
}
