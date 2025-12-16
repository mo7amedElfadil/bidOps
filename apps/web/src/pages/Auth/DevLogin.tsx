import { useState } from 'react'
import { setToken } from '../../utils/auth'

export default function DevLogin() {
	const [email, setEmail] = useState('')
	const [name, setName] = useState('')
	const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER'>('ADMIN')
	const [tenantId, setTenantId] = useState('default')
	const [err, setErr] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		setErr(null)
		setLoading(true)
		try {
			const res = await fetch(`${API_BASE}/auth/dev-login`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, name, role, tenantId })
			})
			if (!res.ok) throw new Error(await res.text())
			const data = (await res.json()) as { access_token: string }
			setToken(data.access_token)
			window.location.replace('/')
		} catch (e: any) {
			setErr(e?.message || 'Login failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ maxWidth: 420, margin: '5rem auto', padding: '1rem' }}>
			<h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Developer Login</h1>
			<form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
				<label>
					<div>Email</div>
					<input value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
				</label>
				<label>
					<div>Name</div>
					<input value={name} onChange={e => setName(e.target.value)} placeholder="Optional" />
				</label>
				<label>
					<div>Role</div>
					<select value={role} onChange={e => setRole(e.target.value as any)}>
						<option value="ADMIN">ADMIN</option>
						<option value="MANAGER">MANAGER</option>
						<option value="CONTRIBUTOR">CONTRIBUTOR</option>
						<option value="VIEWER">VIEWER</option>
					</select>
				</label>
				<label>
					<div>Tenant</div>
					<input value={tenantId} onChange={e => setTenantId(e.target.value)} />
				</label>
				<button type="submit" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign in'}
				</button>
				{err ? <div style={{ color: 'red' }}>{err}</div> : null}
			</form>
			<p style={{ marginTop: 12, fontSize: 12 }}>
				This route calls <code>/auth/dev-login</code> and stores the JWT in localStorage.
			</p>
		</div>
	)
}


