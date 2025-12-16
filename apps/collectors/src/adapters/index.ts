/**
 * Award Source Adapters Registry
 *
 * All adapters should be registered here.
 * Enable/disable adapters via environment variables:
 *   COLLECTOR_SAMPLE_ENABLED=true|false
 *   COLLECTOR_QATAR_GOV_ENABLED=true|false
 *   COLLECTOR_MONAQASAT_ENABLED=true|false
 */

import { SourceAdapter } from './base.js'
import { SampleAdapter } from './sample.js'
import { QatarGovAdapter } from './qatar-gov.js'
import { MonaqasatAdapter } from './monaqasat.js'

// Registry of all available adapters
export const adapters: SourceAdapter[] = [
	new SampleAdapter(),
	new QatarGovAdapter(),
	new MonaqasatAdapter()
]

// Re-export types
export { SourceAdapter, AwardRecord, BaseAdapter } from './base.js'
