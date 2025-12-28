import AppRouter from './router'
import { ThemeProvider } from './contexts/ThemeContext'
import './styles.css'

export default function App() {
	return (
		<ThemeProvider>
			<AppRouter />
		</ThemeProvider>
	)
}


