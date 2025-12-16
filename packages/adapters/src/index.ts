export interface SourceAdapter {
	id: string
	label: string
	isEnabled: () => Promise<boolean>
	run: () => Promise<void>
}


