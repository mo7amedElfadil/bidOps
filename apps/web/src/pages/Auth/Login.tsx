import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import { api } from '../../api/client'
import { parseJwt, setToken } from '../../utils/auth'

export default function Login() {
	const nav = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			const res = await api.login({ email, password })
			setToken(res.access_token)
			const payload = parseJwt(res.access_token)
			if (payload?.mustChangePassword) {
				nav('/auth/change-password', { replace: true })
			} else {
				nav('/dashboard', { replace: true })
			}
		} catch (e: any) {
			setError(e.message || 'Login failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthLayout
			title="Sign in to BidOps"
			subtitle="Use your company account to continue."
			footer={
				<div className="space-y-2">
					<div>
						<a className="text-blue-600 hover:underline" href="/auth/signup">
							Request access
						</a>
					</div>
					<div>
						<a className="text-blue-600 hover:underline" href="/auth/forgot-password">
							Forgot password?
						</a>
					</div>
					<div>
						<a className="text-slate-500 hover:underline" href="/auth/dev">
							Developer login
						</a>
					</div>
				</div>
			}
		>
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
				<label className="text-sm">
					<span className="font-medium">Password</span>
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
					{loading ? 'Signing in...' : 'Sign in'}
				</button>
			</form>
		</AuthLayout>
	)
}
