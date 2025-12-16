import { z } from 'zod'

export const OpportunityCreateSchema = z.object({
	clientId: z.string().uuid(),
	title: z.string().min(1),
	description: z.string().optional(),
	submissionDate: z.string().datetime().optional()
})

export type OpportunityCreate = z.infer<typeof OpportunityCreateSchema>


