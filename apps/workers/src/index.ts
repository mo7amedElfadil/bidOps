import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { slaTick } from './jobs/slaTick'
import { processEmailBatch } from './jobs/sendEmail'

const connection = new Redis({
	host: process.env.REDIS_HOST || 'localhost',
	port: Number(process.env.REDIS_PORT || 6379),
	maxRetriesPerRequest: null
})

const queueName = 'bidops-default'
const collectorBaseUrl = process.env.COLLECTORS_URL || 'http://collectors:4100'

export const queue = new Queue(queueName, { connection })

async function runCollector(endpoint: string, payload: Record<string, any>) {
	const res = await fetch(`${collectorBaseUrl}/${endpoint}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload || {})
	})
	if (!res.ok) {
		const text = await res.text()
		throw new Error(text || 'Collector request failed')
	}
	return res.json()
}

const worker = new Worker(
	queueName,
	async job => {
		console.log(`[workers] Processing job ${job.id} (${job.name})`, job.data || {})
		if (job.name === 'collect-awards') {
			return runCollector('run', job.data)
		}
		if (job.name === 'collect-tenders') {
			return runCollector('run-tenders', job.data)
		}
		return { ok: true, jobId: job.id }
	},
	{ connection }
)

worker.on('completed', (job, result) => {
	console.log(`[workers] Job ${job.id} completed`, result || {})
})

worker.on('failed', (job, err) => {
	console.error(`[workers] Job ${job?.id} failed`, err?.message || err)
})

// eslint-disable-next-line no-console
console.log('Workers app started. Queue:', queueName)

// Simple schedulers (these can still enqueue jobs if needed)
const slaIntervalMs = Number(process.env.SLA_TICK_INTERVAL_MS || 6 * 60 * 60 * 1000)
const emailIntervalMs = Number(process.env.EMAIL_TICK_INTERVAL_MS || 60 * 1000)

setInterval(() => {
	slaTick().catch(err => console.error('slaTick error', err))
}, slaIntervalMs)

setInterval(() => {
	processEmailBatch().catch(err => console.error('email error', err))
}, emailIntervalMs)
