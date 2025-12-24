import { useState } from 'react'
import AuthLayout from '../../components/AuthLayout'
import { api } from '../../api/client'

export default function ForgotPassword() {
	const [email, setEmail] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [loading, setLoading] = useState(false)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			await api.forgotPassword({ email })
			setSuccess(true)
		} catch (e: any) {
			setError(e.message || 'Request failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthLayout
			title="Forgot password"
			subtitle="We will email you a reset link."
			footer={
				<a className="text-blue-600 hover:underline" href="/auth/login">
					Back to sign in
				</a>
			}
		>
			{success ? (
				<div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
					If the email exists, we sent a reset link.
				</div>
			) : (
				<form className="grid gap-3" onSubmit={submit}>
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
					{error && <p className="text-sm text-red-600">{error}</p>}
					<button
						type="submit"
						className="mt-2 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						disabled={loading}
					>
						{loading ? 'Sending...' : 'Send reset link'}
					</button>
				</form>
			)}
		</AuthLayout>
	)
}
