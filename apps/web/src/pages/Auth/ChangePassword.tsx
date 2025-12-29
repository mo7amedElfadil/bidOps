import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import { api } from '../../api/client'
import { setToken } from '../../utils/auth'

export default function ChangePassword() {
	const nav = useNavigate()
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [loading, setLoading] = useState(false)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			const res = await api.changePassword({ currentPassword, newPassword })
			if (res.access_token) {
				setToken(res.access_token)
			}
			setSuccess(true)
			setTimeout(() => nav('/dashboard', { replace: true }), 800)
		} catch (e: any) {
			setError(e.message || 'Failed to change password')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthLayout
			title="Change password"
			subtitle="Update your password to continue."
		>
			{success ? (
				<div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
					Password updated. Redirecting...
				</div>
			) : (
				<form className="grid gap-3" onSubmit={submit}>
					<label className="text-sm">
						<span className="font-medium">Current password</span>
						<input
							type="password"
							className="mt-1 w-full rounded border px-3 py-2"
							value={currentPassword}
							onChange={e => setCurrentPassword(e.target.value)}
							required
						/>
					</label>
					<label className="text-sm">
						<span className="font-medium">New password</span>
						<input
							type="password"
							className="mt-1 w-full rounded border px-3 py-2"
							value={newPassword}
							onChange={e => setNewPassword(e.target.value)}
							required
						/>
					</label>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<button
						type="submit"
						className="mt-2 rounded bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 disabled:opacity-50"
						disabled={loading}
					>
						{loading ? 'Updating...' : 'Update password'}
					</button>
				</form>
			)}
		</AuthLayout>
	)
}
