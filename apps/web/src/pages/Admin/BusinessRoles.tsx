import { useEffect, useState } from 'react'
import { api, BusinessRole } from '../../api/client'

export default function BusinessRolesPage() {
	const [rows, setRows] = useState<BusinessRole[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [form, setForm] = useState({ name: '', description: '' })
	const [editing, setEditing] = useState<BusinessRole | null>(null)
	const [saving, setSaving] = useState(false)

	async function load() {
		setLoading(true)
		setError(null)
		try {
			const data = await api.listBusinessRoles()
			setRows(data)
		} catch (e: any) {
			setError(e.message || 'Failed to load business roles')
		}
		setLoading(false)
	}

	useEffect(() => {
		load()
	}, [])

	function startEdit(role: BusinessRole) {
		setEditing(role)
		setForm({ name: role.name, description: role.description || '' })
	}

	async function save() {
		setSaving(true)
		setError(null)
		try {
			if (editing) {
				await api.updateBusinessRole(editing.id, {
					name: form.name,
					description: form.description || undefined
				})
			} else {
				await api.createBusinessRole({
					name: form.name,
					description: form.description || undefined
				})
			}
			setEditing(null)
			setForm({ name: '', description: '' })
			await load()
		} catch (e: any) {
			setError(e.message || 'Failed to save role')
		}
		setSaving(false)
	}

	async function remove(id: string) {
		if (!confirm('Delete this role?')) return
		setError(null)
		try {
			await api.deleteBusinessRole(id)
			await load()
		} catch (e: any) {
			setError(e.message || 'Failed to delete role')
		}
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="mx-auto max-w-4xl p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-semibold">Business Roles</h1>
						<p className="text-sm text-slate-600">Manage roles used for approvals and notifications.</p>
					</div>
					<button
						className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200"
						onClick={() => load()}
						disabled={loading}
					>
						Refresh
					</button>
				</div>

				<div className="mt-4 rounded border bg-white p-4 shadow-sm">
					<h2 className="text-sm font-semibold">{editing ? 'Edit Role' : 'Add Role'}</h2>
					<div className="mt-3 grid gap-3 md:grid-cols-2">
						<label className="text-sm">
							<span className="font-medium">Name</span>
							<input
								className="mt-1 w-full rounded border px-3 py-2"
								value={form.name}
								onChange={e => setForm({ ...form, name: e.target.value })}
							/>
						</label>
						<label className="text-sm">
							<span className="font-medium">Description</span>
							<input
								className="mt-1 w-full rounded border px-3 py-2"
								value={form.description}
								onChange={e => setForm({ ...form, description: e.target.value })}
							/>
						</label>
					</div>
					<div className="mt-3 flex gap-2">
						{editing && (
							<button
								className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
								onClick={() => {
									setEditing(null)
									setForm({ name: '', description: '' })
								}}
								disabled={saving}
							>
								Cancel
							</button>
						)}
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
							onClick={save}
							disabled={saving || !form.name.trim()}
						>
							{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Role'}
						</button>
					</div>
					{error && <p className="mt-2 text-sm text-red-600">{error}</p>}
				</div>

				{loading ? (
					<p className="mt-4 text-sm text-slate-600">Loading...</p>
				) : rows.length === 0 ? (
					<p className="mt-4 text-sm text-slate-600">No business roles found.</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-3 py-2 text-left">Name</th>
									<th className="px-3 py-2 text-left">Description</th>
									<th className="px-3 py-2 text-left"></th>
								</tr>
							</thead>
							<tbody>
								{rows.map(role => (
									<tr key={role.id} className="border-t">
										<td className="px-3 py-2 font-medium">{role.name}</td>
										<td className="px-3 py-2 text-slate-600">{role.description || '-'}</td>
										<td className="px-3 py-2 text-right">
											<div className="flex justify-end gap-2">
												<button
													className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
													onClick={() => startEdit(role)}
												>
													Edit
												</button>
												<button
													className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
													onClick={() => remove(role.id)}
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
