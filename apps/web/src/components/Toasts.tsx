import React, { useEffect, useState } from 'react'
import { subscribe, ToastMessage } from '../utils/toast'

function getStyle(type: ToastMessage['type']) {
	if (type === 'success') return 'bg-green-600'
	if (type === 'info') return 'bg-slate-800'
	return 'bg-red-600'
}

export default function Toasts() {
	const [toasts, setToasts] = useState<ToastMessage[]>([])

	useEffect(() => {
		return subscribe(toast => {
			setToasts(prev => [...prev, toast].slice(-4))
			setTimeout(() => {
				setToasts(prev => prev.filter(t => t.id !== toast.id))
			}, 4000)
		})
	}, [])

	return (
		<div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
			{toasts.map(toast => (
				<div
					key={toast.id}
					className={`rounded px-3 py-2 text-sm text-white shadow ${getStyle(toast.type)}`}
				>
					{toast.message}
				</div>
			))}
		</div>
	)
}
