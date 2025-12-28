import { Link, useRouteError } from 'react-router-dom'

export default function ErrorPage() {
	const error = useRouteError() as {
		message?: string
		statusText?: string
		status?: number
	}

	const title = error?.status ? `${error.status}` : 'Error'
	const message = error?.message || error?.statusText || 'Something went wrong. Please try again.'

	return (
		<div className="min-h-screen bg-muted text-foreground">
			<div className="mx-auto flex max-w-4xl flex-col items-start justify-center gap-4 p-6 text-base">
				<span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">BidOps</span>
				<h1 className="text-3xl font-semibold text-foreground">{title}</h1>
				<p className="text-muted-foreground">{message}</p>
				<div className="flex flex-wrap gap-3">
					<button className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" onClick={() => window.location.reload()}>
						Reload
					</button>
					<Link className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-border" to="/dashboard">
						Go Home
					</Link>
				</div>
				{error?.status && (
					<p className="text-xs uppercase tracking-wide text-slate-400">Status Code: {error.status}</p>
				)}
			</div>
		</div>
	)
}
