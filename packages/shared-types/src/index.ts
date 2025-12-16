export type UUID = string

export interface TenantScoped {
	tenantId: string
}

export interface Timestamped {
	createdAt: string
	updatedAt: string
}


