import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'hyprdark' | 'system'

type ThemeContextType = {
	theme: Theme
	setTheme: (theme: Theme) => void
	resolvedTheme: 'light' | 'hyprdark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'bidops-theme'

function getSystemTheme(): 'light' | 'hyprdark' {
	if (typeof window === 'undefined') return 'light'
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'hyprdark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => {
		const stored = localStorage.getItem(STORAGE_KEY) as Theme
		return stored || 'light'
	})

	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'hyprdark'>(() => {
		return theme === 'system' ? getSystemTheme() : theme
	})

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		const handleChange = () => {
			if (theme === 'system') {
				const newResolved = getSystemTheme()
				setResolvedTheme(newResolved)
				document.documentElement.dataset.theme = newResolved
			}
		}
		mediaQuery.addEventListener('change', handleChange)
		return () => mediaQuery.removeEventListener('change', handleChange)
	}, [theme])

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme)
		localStorage.setItem(STORAGE_KEY, newTheme)
		const resolved = newTheme === 'system' ? getSystemTheme() : newTheme
		setResolvedTheme(resolved)
		document.documentElement.dataset.theme = resolved
	}

	useEffect(() => {
		const resolved = theme === 'system' ? getSystemTheme() : theme
		setResolvedTheme(resolved)
		document.documentElement.dataset.theme = resolved
	}, [theme])

	return (
		<ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider')
	}
	return context
}
