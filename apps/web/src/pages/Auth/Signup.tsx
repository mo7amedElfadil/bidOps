import { useState } from 'react'
import AuthLayout from '../../components/AuthLayout'
import { api } from '../../api/client'

export default function Signup() {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [loading, setLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			await api.register({ name, email, password })
			setSuccess(true)
		} catch (e: any) {
			setError(e.message || 'Signup failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthLayout
			title="Request access"
			subtitle="Create an account request. An admin will approve access."
			footer={
				<a className="text-accent hover:underline" href="/auth/login">
					Back to sign in
				</a>
			}
		>
			{success ? (
				<div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
					Your request was submitted. An administrator will review your account shortly.
				</div>
			) : (
				<form className="grid gap-3" onSubmit={submit}>
					<label className="text-sm">
						<span className="font-medium">Name</span>
						<input
							className="mt-1 w-full rounded border px-3 py-2"
							value={name}
							onChange={e => setName(e.target.value)}
							required
						/>
					</label>
					<label className="text-sm">
						<span className="font-medium">Email</span>
						<input
							type="email"
							className="mt-1 w-full rounded border px-3 py-2"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</label>
					<label className="text-sm">
						<span className="font-medium">Password</span>
						<div className="relative mt-1">
							<input
								type={showPassword ? 'text' : 'password'}
								className="w-full rounded border px-3 py-2"
								value={password}
								onChange={e => setPassword(e.target.value)}
								required
							/>
							<button
								type="button"
								className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700"
								onClick={() => setShowPassword(show => !show)}
							>
								{showPassword ? 'Hide' : 'Show'}
							</button>
						</div>
					</label>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<button
						type="submit"
						className="mt-2 rounded bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 disabled:opacity-50"
						disabled={loading}
					>
						{loading ? 'Submitting...' : 'Submit request'}
					</button>
				</form>
			)}
		</AuthLayout>
	)
}
