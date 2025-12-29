import type { ComponentType } from 'react'

export enum ViewMode {
	Day = 'Day',
	Week = 'Week',
	Month = 'Month',
	Year = 'Year'
}

export type Task = {
	id: string
	name: string
	start: Date
	end: Date
	type?: string
	progress?: number
	isDisabled?: boolean
	styles?: Record<string, string | number>
}

export const Gantt: ComponentType<Record<string, any>>
