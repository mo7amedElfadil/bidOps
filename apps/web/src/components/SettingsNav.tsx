import { NavLink } from 'react-router-dom'

const items = [
	{ to: '/settings/sla', label: 'SLA' },
	{ to: '/settings/lifecycle', label: 'Opportunity Lists' },
	{ to: '/settings/system', label: 'System Settings' }
]

export default function SettingsNav() {
	return (
		<div className="mt-3 flex flex-wrap gap-2 text-xs">
			{items.map(item => (
				<NavLink
					key={item.to}
					to={item.to}
					className={({ isActive }) =>
						`rounded border px-3 py-1.5 font-semibold ${
							isActive ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
						}`
					}
				>
					{item.label}
				</NavLink>
			))}
		</div>
	)
}
