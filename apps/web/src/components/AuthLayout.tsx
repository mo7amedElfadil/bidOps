import React from 'react'

export default function AuthLayout({
	title,
	subtitle,
	children,
	footer
}: {
	title: string
	subtitle?: string
	children: React.ReactNode
	footer?: React.ReactNode
}) {
	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
				<div className="rounded border bg-white p-6 shadow-sm">
					<div className="mb-6">
						<h1 className="text-xl font-semibold">{title}</h1>
						{subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
					</div>
					{children}
				</div>
				{footer && <div className="mt-4 text-center text-xs text-slate-500">{footer}</div>}
			</div>
		</div>
	)
}
