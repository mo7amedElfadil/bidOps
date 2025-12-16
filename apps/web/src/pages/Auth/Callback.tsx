import { useEffect } from 'react'
import { setToken } from '../../utils/auth'

export default function Callback() {
	useEffect(() => {
		const hash = window.location.hash || ''
		const m = hash.match(/token=([^&]+)/)
		if (m) {
			setToken(decodeURIComponent(m[1]))
		}
		window.location.replace('/')
	}, [])
	return null
}


