import { useTheme } from '../contexts/ThemeContext'
import clsx from 'clsx'

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme()

	const buttonBase = 'rounded px-3 py-1.5 text-xs font-medium transition'
	const activeButton = 'shadow-sm font-semibold'
	const inactiveButton = 'hover:opacity-80'

	return (
		<div className="flex items-center gap-1 rounded-md border border-border bg-muted/50 p-1">
			<button
				onClick={() => setTheme('light')}
				className={clsx(
					buttonBase,
					theme === 'light'
						? `${activeButton} bg-card text-foreground`
						: `${inactiveButton} text-muted-foreground`
				)}
				aria-label="Light theme"
			>
				Light
			</button>
			<button
				onClick={() => setTheme('hyprdark')}
				className={clsx(
					buttonBase,
					theme === 'hyprdark'
						? `${activeButton} bg-accent text-accent-foreground`
						: `${inactiveButton} text-muted-foreground`
				)}
				aria-label="HyprDark theme"
			>
				HyprDark
			</button>
			<button
				onClick={() => setTheme('system')}
				className={clsx(
					buttonBase,
					theme === 'system'
						? `${activeButton} bg-card text-foreground`
						: `${inactiveButton} text-muted-foreground`
				)}
				aria-label="System theme"
			>
				System
			</button>
		</div>
	)
}
