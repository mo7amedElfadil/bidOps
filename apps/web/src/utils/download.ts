import { getToken } from './auth'
import { toast } from './toast'

export async function downloadWithAuth(url: string, filename: string) {
	try {
		const token = getToken()
		const res = await fetch(url, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined
		})
		if (!res.ok) {
			throw new Error(await res.text())
		}
		const blob = await res.blob()
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		link.download = filename
		link.click()
		URL.revokeObjectURL(link.href)
	} catch (err: any) {
		toast.error(err.message || 'Download failed')
	}
}
