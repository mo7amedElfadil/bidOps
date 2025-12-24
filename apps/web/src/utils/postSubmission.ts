import type { Opportunity } from '../api/client'
import { DEFAULT_STAGE_LIST, DEFAULT_STATUS_LIST } from '../constants/opportunity-lists'

type Options = {
	stageOptions?: string[]
	statusOptions?: string[]
}

function normalize(value?: string | null) {
	return value?.trim().toLowerCase() || ''
}

export function isPostSubmission(opportunity: Opportunity, options: Options = {}) {
	const stageOptions = options.stageOptions?.length ? options.stageOptions : DEFAULT_STAGE_LIST
	const statusOptions = options.statusOptions?.length ? options.statusOptions : DEFAULT_STATUS_LIST

	const submissionIndex = stageOptions.findIndex(stage =>
		normalize(stage).includes('submission')
	)
	const stageIndex = opportunity.stage ? stageOptions.findIndex(stage => stage === opportunity.stage) : -1
	const isStageAfterSubmission =
		submissionIndex >= 0 && stageIndex >= submissionIndex && stageIndex !== -1

	const normalizedStatus = normalize(opportunity.status)
	const postStatuses = statusOptions.filter(status => normalize(status) !== 'open')
	const isPostStatus = postStatuses.some(status => normalize(status) === normalizedStatus)
	const isReadyForSubmission = normalizedStatus === 'ready for submission'

	const daysLeft = opportunity.daysLeft
	const isPastDeadline = typeof daysLeft === 'number' && daysLeft < 0

	return isPastDeadline || isStageAfterSubmission || isPostStatus || isReadyForSubmission
}
