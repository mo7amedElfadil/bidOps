export const USER_TYPE_OPTIONS = [
	{ value: 'INTERNAL', label: 'Internal' },
	{ value: 'BUSINESS_OWNER', label: 'Business Owner' },
	{ value: 'BID_OWNER', label: 'Bid Owner' },
	{ value: 'CONTRIBUTOR', label: 'Contributor' },
	{ value: 'ANALYST', label: 'Analyst' },
	{ value: 'TEMP', label: 'Temporary' }
]

const USER_TYPE_LABEL_MAP = new Map(USER_TYPE_OPTIONS.map(option => [option.value, option.label]))

export function getUserTypeLabel(value?: string) {
	return USER_TYPE_LABEL_MAP.get(value || '') || value || 'Internal'
}
