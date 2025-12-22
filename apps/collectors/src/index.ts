/**
 * Award Collectors Main Entry Point
 *
 * Orchestrates the execution of award source adapters,
 * stores results in staging, and handles scheduling.
 *
 * Usage:
 *   # Run all enabled adapters once
 *   node dist/index.js
 *
 *   # Run specific adapter
 *   COLLECTOR_ONLY=sample node dist/index.js
 *
 *   # Run in continuous mode (with schedule)
 *   COLLECTOR_MODE=scheduled node dist/index.js
 */

import pkg from '@prisma/client'
const { PrismaClient } = pkg as any
import { adapters, AwardRecord } from './adapters/index.js'

const prisma = new PrismaClient()

interface CollectorStats {
	adapterId: string
	startTime: Date
	endTime?: Date
	recordsFound: number
	recordsInserted: number
	errors: string[]
}

/**
 * Run a single adapter and store results
 */
async function runAdapter(adapterId: string): Promise<CollectorStats> {
	const stats: CollectorStats = {
		adapterId,
		startTime: new Date(),
		recordsFound: 0,
		recordsInserted: 0,
		errors: []
	}

	const adapter = adapters.find(a => a.id === adapterId)
	if (!adapter) {
		stats.errors.push(`Adapter not found: ${adapterId}`)
		stats.endTime = new Date()
		return stats
	}

	try {
		// Check if enabled
		const enabled = await adapter.isEnabled()
		if (!enabled) {
			console.log(`[${adapterId}] Adapter is disabled, skipping`)
			stats.endTime = new Date()
			return stats
		}

		console.log(`[${adapterId}] Starting collection...`)

		// Run the adapter
		const awards = await adapter.run()
		stats.recordsFound = awards.length

		// Store each award in staging
		for (const award of awards) {
			try {
				await storeAward(award)
				stats.recordsInserted++
			} catch (err: any) {
				// Check for duplicate
				if (err.code === 'P2002') {
					console.log(`[${adapterId}] Skipping duplicate: ${award.tenderRef}`)
				} else {
					stats.errors.push(`Failed to store ${award.tenderRef}: ${err.message}`)
				}
			}
		}

		console.log(`[${adapterId}] Completed: ${stats.recordsInserted}/${stats.recordsFound} records stored`)
	} catch (err: any) {
		stats.errors.push(err.message)
		console.error(`[${adapterId}] Error:`, err)
	}

	stats.endTime = new Date()
	return stats
}

/**
 * Store a single award record in staging
 */
async function storeAward(award: AwardRecord): Promise<void> {
	if (award.tenderRef) {
		await prisma.awardStaging.deleteMany({
			where: { portal: award.portal, tenderRef: award.tenderRef }
		})
	}

	await prisma.awardStaging.create({
		data: {
			portal: award.portal,
			tenderRef: award.tenderRef,
			buyer: award.buyer,
			title: award.title,
			awardDate: award.awardDate,
			winners: award.winners,
			awardValue: award.awardValue,
			codes: award.codes || [],
			status: 'new',
			sourceUrl: award.sourceUrl
		}
	})
}

/**
 * Run all enabled adapters
 */
async function runAll(): Promise<CollectorStats[]> {
	const results: CollectorStats[] = []

	// Check for specific adapter filter
	const onlyAdapter = process.env.COLLECTOR_ONLY

	for (const adapter of adapters) {
		if (onlyAdapter && adapter.id !== onlyAdapter) {
			continue
		}

		const stats = await runAdapter(adapter.id)
		results.push(stats)
	}

	return results
}

/**
 * Print summary of collection run
 */
function printSummary(results: CollectorStats[]): void {
	console.log('\n=== Collection Summary ===')
	for (const stats of results) {
		const duration = stats.endTime
			? ((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(1)
			: '?'
		console.log(
			`[${stats.adapterId}] Found: ${stats.recordsFound}, Inserted: ${stats.recordsInserted}, ` +
				`Duration: ${duration}s, Errors: ${stats.errors.length}`
		)
		if (stats.errors.length > 0) {
			stats.errors.forEach(e => console.log(`  - ${e}`))
		}
	}
	console.log('========================\n')
}

/**
 * Main entry point
 */
let running = false

async function runWithRange(adapterId: string | undefined, fromDate?: string, toDate?: string) {
	if (running) {
		return { error: 'Collector already running' }
	}
	running = true

	const prevFrom = process.env.MONAQASAT_FROM_DATE
	const prevTo = process.env.MONAQASAT_TO_DATE
	process.env.MONAQASAT_FROM_DATE = fromDate || ''
	process.env.MONAQASAT_TO_DATE = toDate || ''
	if (adapterId) process.env.COLLECTOR_ONLY = adapterId

	try {
		const results = adapterId ? [await runAdapter(adapterId)] : await runAll()
		return { results }
	} finally {
		if (prevFrom !== undefined) process.env.MONAQASAT_FROM_DATE = prevFrom
		else delete process.env.MONAQASAT_FROM_DATE
		if (prevTo !== undefined) process.env.MONAQASAT_TO_DATE = prevTo
		else delete process.env.MONAQASAT_TO_DATE
		if (adapterId) delete process.env.COLLECTOR_ONLY
		running = false
	}
}

async function main(): Promise<void> {
	console.log('Award Collectors starting...')
	console.log(`Mode: ${process.env.COLLECTOR_MODE || 'once'}`)
	console.log(`Adapters registered: ${adapters.map(a => a.id).join(', ')}`)

	if (process.env.COLLECTOR_SERVER === 'true') {
		const { createServer } = await import('http')
		const port = Number(process.env.COLLECTOR_PORT || 4100)
		const server = createServer(async (req, res) => {
			if (req.method === 'GET' && req.url === '/health') {
				res.writeHead(200, { 'content-type': 'application/json' })
				res.end(JSON.stringify({ status: 'ok' }))
				return
			}
			if (req.method === 'POST' && req.url === '/run') {
				let body = ''
				req.on('data', chunk => (body += chunk))
				req.on('end', async () => {
					try {
						const parsed = body ? JSON.parse(body) : {}
						const result = await runWithRange(parsed.adapterId, parsed.fromDate, parsed.toDate)
						res.writeHead(200, { 'content-type': 'application/json' })
						res.end(JSON.stringify(result))
					} catch (err: any) {
						res.writeHead(400, { 'content-type': 'application/json' })
						res.end(JSON.stringify({ error: err.message || 'Invalid request' }))
					}
				})
				return
			}
			res.writeHead(404, { 'content-type': 'application/json' })
			res.end(JSON.stringify({ error: 'Not found' }))
		})
		server.listen(port, () => {
			console.log(`Collector server listening on ${port}`)
		})
		return
	}

	const mode = process.env.COLLECTOR_MODE || 'once'

	if (mode === 'scheduled') {
		// Scheduled mode: run periodically
		const intervalMinutes = parseInt(process.env.COLLECTOR_INTERVAL_MINUTES || '60', 10)
		console.log(`Running in scheduled mode, interval: ${intervalMinutes} minutes`)

		// Run immediately
		let results = await runAll()
		printSummary(results)

		// Then schedule
		setInterval(async () => {
			console.log(`\n[${new Date().toISOString()}] Scheduled run starting...`)
			results = await runAll()
			printSummary(results)
		}, intervalMinutes * 60 * 1000)
	} else {
		// One-time run
		const results = await runAll()
		printSummary(results)

		// Exit after one-time run
		await prisma.$disconnect()
	}
}

main().catch(err => {
	console.error('Fatal error:', err)
	process.exit(1)
})
