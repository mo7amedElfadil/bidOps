import { Queue } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis({
	host: process.env.REDIS_HOST || 'localhost',
	port: Number(process.env.REDIS_PORT || 6379),
	maxRetriesPerRequest: null
})

const QUEUE_NAME = 'bidops-default'

export const collectorsQueue = new Queue(QUEUE_NAME, { connection })

export type CollectorJobPayload = {
	adapterId?: string
	fromDate?: string
	toDate?: string
}

export function enqueueAwardCollector(payload: CollectorJobPayload) {
	return collectorsQueue.add('collect-awards', payload, {
		removeOnComplete: true,
		removeOnFail: true
	})
}

export function enqueueTenderCollector(payload: CollectorJobPayload) {
	return collectorsQueue.add('collect-tenders', payload, {
		removeOnComplete: true,
		removeOnFail: true
	})
}
