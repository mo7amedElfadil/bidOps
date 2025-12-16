import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { slaTick } from './jobs/slaTick'
import { processEmailBatch } from './jobs/sendEmail'

const connection = new Redis({
	host: process.env.REDIS_HOST || 'localhost',
	port: Number(process.env.REDIS_PORT || 6379)
})

const queueName = 'bidops-default'

export const queue = new Queue(queueName, { connection })

new Worker(
	queueName,
	async job => {
		// Placeholder worker
		return { ok: true, jobId: job.id }
	},
	{ connection }
)

// eslint-disable-next-line no-console
console.log('Workers app started. Queue:', queueName)

// Simple schedulers
setInterval(() => {
	slaTick().catch(err => console.error('slaTick error', err))
	processEmailBatch().catch(err => console.error('email error', err))
}, 60_000)


