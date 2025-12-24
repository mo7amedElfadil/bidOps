import { useEffect } from 'react'
import { parseJwt, setToken } from '../../utils/auth'

export default function Callback() {
	useEffect(() => {
		const hash = window.location.hash || ''
		const m = hash.match(/token=([^&]+)/)
		if (m) {
			const token = decodeURIComponent(m[1])
			setToken(token)
			const payload = parseJwt(token)
			if (payload?.mustChangePassword) {
				window.location.replace('/auth/change-password')
				return
			}
		}
		window.location.replace('/')
	}, [])
	return null
}

