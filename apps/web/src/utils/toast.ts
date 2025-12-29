type ToastType = 'success' | 'error' | 'info'

export type ToastMessage = {
	id: number
	type: ToastType
	message: string
}

type Listener = (toast: ToastMessage) => void

const listeners = new Set<Listener>()
let counter = 0

export function subscribe(listener: Listener) {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

function notify(type: ToastType, message: string) {
	const toast = { id: Date.now() + counter++, type, message }
	listeners.forEach(listener => listener(toast))
}

export const toast = {
	success(message: string) {
		notify('success', message)
	},
	error(message: string) {
		notify('error', message)
	},
	info(message: string) {
		notify('info', message)
	}
}
