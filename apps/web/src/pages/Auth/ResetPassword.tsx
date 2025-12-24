import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import { api } from '../../api/client'

export default function ResetPassword() {
	const [params] = useSearchParams()
	const token = params.get('token') || ''
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [loading, setLoading] = useState(false)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		if (!token) {
			setError('Reset token missing')
			return
		}
		setError(null)
		setLoading(true)
		try {
			await api.resetPassword({ token, password })
			setSuccess(true)
		} catch (e: any) {
			setError(e.message || 'Reset failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthLayout
			title="Reset password"
			subtitle="Choose a new password for your account."
			footer={
				<a className="text-blue-600 hover:underline" href="/auth/login">
					Back to sign in
				</a>
			}
		>
			{success ? (
				<div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
					Password updated. You can now sign in.
				</div>
			) : (
				<form className="grid gap-3" onSubmit={submit}>
					<label className="text-sm">
						<span className="font-medium">New password</span>
						<input
							type="password"
							className="mt-1 w-full rounded border px-3 py-2"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>
					</label>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<button
						type="submit"
						className="mt-2 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						disabled={loading}
					>
						{loading ? 'Updating...' : 'Reset password'}
					</button>
				</form>
			)}
		</AuthLayout>
	)
}
