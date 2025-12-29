const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const tenantId = 'default'

const arabicKeywordsByName = {
	'IT & Digital Transformation Services': [
		'\u0627\u0644\u062a\u062d\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064a',
		'\u062e\u062f\u0645\u0627\u062a \u062a\u0642\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a'
	],
	'Software Development (Web/Mobile/Portals)': [
		'\u062a\u0637\u0648\u064a\u0631 \u0627\u0644\u0628\u0631\u0645\u062c\u064a\u0627\u062a',
		'\u062a\u0637\u0648\u064a\u0631 \u0627\u0644\u062a\u0637\u0628\u064a\u0642\u0627\u062a'
	],
	'Systems Integration': [
		'\u062a\u0643\u0627\u0645\u0644 \u0627\u0644\u0623\u0646\u0638\u0645\u0629',
		'\u062a\u0643\u0627\u0645\u0644 \u0627\u0644\u0646\u0638\u0627\u0645'
	],
	'Managed Services & IT Support': [
		'\u062e\u062f\u0645\u0627\u062a \u0645\u062f\u0627\u0631\u0629',
		'\u062f\u0639\u0645 \u062a\u0642\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a'
	],
	'Network Infrastructure (LAN/WAN/Wi-Fi)': [
		'\u0627\u0644\u0628\u0646\u064a\u0629 \u0627\u0644\u062a\u062d\u062a\u064a\u0629 \u0644\u0644\u0634\u0628\u0643\u0627\u062a',
		'\u0634\u0628\u0643\u0627\u062a'
	],
	'Cybersecurity (SOC, SIEM, Pentest, Hardening)': [
		'\u0627\u0644\u0623\u0645\u0646 \u0627\u0644\u0633\u064a\u0628\u0631\u0627\u0646\u064a',
		'\u0623\u0645\u0646 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a'
	],
	'Cloud Services (Azure/M365, migration, hosting)': [
		'\u0627\u0644\u062d\u0648\u0633\u0628\u0629 \u0627\u0644\u0633\u062d\u0627\u0628\u064a\u0629',
		'\u062e\u062f\u0645\u0627\u062a \u0633\u062d\u0627\u0628\u064a\u0629'
	],
	'Data Platforms & Analytics (BI, dashboards, reporting)': [
		'\u0630\u0643\u0627\u0621 \u0627\u0644\u0623\u0639\u0645\u0627\u0644',
		'\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a',
		'\u0644\u0648\u062d\u0627\u062a \u0645\u0639\u0644\u0648\u0645\u0627\u062a'
	],
	'AV / Unified Communications': [
		'\u0627\u0644\u0627\u062a\u0635\u0627\u0644\u0627\u062a \u0627\u0644\u0645\u0648\u062d\u062f\u0629',
		'\u0623\u0646\u0638\u0645\u0629 \u0633\u0645\u0639\u064a\u0629 \u0628\u0635\u0631\u064a\u0629'
	],
	'Smart Buildings / BMS Integration': [
		'\u0645\u0628\u0627\u0646\u064a \u0630\u0643\u064a\u0629',
		'\u0646\u0638\u0627\u0645 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0628\u0627\u0646\u064a'
	],
	'ERP/CRM/Enterprise Applications': [
		'\u062a\u062e\u0637\u064a\u0637 \u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0645\u0624\u0633\u0633\u0629',
		'\u0625\u062f\u0627\u0631\u0629 \u0639\u0644\u0627\u0642\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u0621'
	],
	'IT Consultancy / Strategy / PMO': [
		'\u0627\u0633\u062a\u0634\u0627\u0631\u0627\u062a \u062a\u0642\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a',
		'\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u062a\u0642\u0646\u064a\u0629'
	],
	'IoT Platform / Dashboards / Device Management': [
		'\u0645\u0646\u0635\u0629 \u0625\u0646\u062a\u0631\u0646\u062a \u0627\u0644\u0623\u0634\u064a\u0627\u0621',
		'\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0623\u062c\u0647\u0632\u0629'
	],
	'LoRaWAN Networks and Gateways': [
		'\u0644\u0648\u0631\u0648\u0627\u0646',
		'\u0628\u0648\u0627\u0628\u0629 \u0625\u0646\u062a\u0631\u0646\u062a \u0627\u0644\u0623\u0634\u064a\u0627\u0621'
	],
	'Environmental Monitoring (air, weather, noise, water)': [
		'\u0645\u0631\u0627\u0642\u0628\u0629 \u0628\u064a\u0626\u064a\u0629',
		'\u062c\u0648\u062f\u0629 \u0627\u0644\u0647\u0648\u0627\u0621',
		'\u062c\u0648\u062f\u0629 \u0627\u0644\u0645\u064a\u0627\u0647'
	],
	'Smart City Use Cases': [
		'\u0645\u062f\u064a\u0646\u0629 \u0630\u0643\u064a\u0629',
		'\u0627\u0644\u0645\u062f\u064a\u0646\u0629 \u0627\u0644\u0630\u0643\u064a\u0629'
	],
	'Smart Parking / Smart Mobility': [
		'\u0645\u0648\u0627\u0642\u0641 \u0630\u0643\u064a\u0629',
		'\u062a\u0646\u0642\u0644 \u0630\u0643\u064a'
	],
	'RTLS / Asset Tracking / BLE Beacons': [
		'\u062a\u062a\u0628\u0639 \u0627\u0644\u0623\u0635\u0648\u0644',
		'\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0641\u064a \u0627\u0644\u0648\u0642\u062a \u0627\u0644\u062d\u0642\u064a\u0642\u064a'
	],
	'Smart Waste / Smart Bins': [
		'\u0646\u0641\u0627\u064a\u0627\u062a \u0630\u0643\u064a\u0629',
		'\u062d\u0627\u0648\u064a\u0627\u062a \u0630\u0643\u064a\u0629'
	],
	'Energy Monitoring / Smart Metering': [
		'\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0637\u0627\u0642\u0629',
		'\u0639\u062f\u0627\u062f\u0627\u062a \u0630\u0643\u064a\u0629'
	],
	'Industrial IoT (factories, utilities, pipelines)': [
		'\u0625\u0646\u062a\u0631\u0646\u062a \u0627\u0644\u0623\u0634\u064a\u0627\u0621 \u0627\u0644\u0635\u0646\u0627\u0639\u064a',
		'\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u0635\u0627\u0646\u0639'
	],
	'Cold Chain / Temperature Monitoring': [
		'\u0633\u0644\u0633\u0644\u0629 \u0627\u0644\u062a\u0628\u0631\u064a\u062f',
		'\u0645\u0631\u0627\u0642\u0628\u0629 \u062f\u0631\u062c\u0629 \u0627\u0644\u062d\u0631\u0627\u0631\u0629'
	],
	'Fleet Tracking / Logistics Monitoring': [
		'\u062a\u062a\u0628\u0639 \u0627\u0644\u0623\u0633\u0637\u0648\u0644',
		'\u062a\u062a\u0628\u0639 \u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062a'
	],
	'Smart Agriculture / Soil & Irrigation Monitoring': [
		'\u0632\u0631\u0627\u0639\u0629 \u0630\u0643\u064a\u0629',
		'\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u062a\u0631\u0628\u0629',
		'\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0631\u064a'
	],
	'Predictive Maintenance / Condition Monitoring': [
		'\u0627\u0644\u0635\u064a\u0627\u0646\u0629 \u0627\u0644\u062a\u0646\u0628\u0624\u064a\u0629',
		'\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u062d\u0627\u0644\u0629'
	],
	'CCTV Analytics + IoT Integration': [
		'\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0641\u064a\u062f\u064a\u0648',
		'\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0643\u0627\u0645\u064a\u0631\u0627\u062a \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629'
	]
}

const arabicNegativeByName = {
	'Noise: Construction / Civil / Roads': [
		'\u0625\u0646\u0634\u0627\u0621\u0627\u062a',
		'\u0623\u0639\u0645\u0627\u0644 \u0645\u062f\u0646\u064a\u0629',
		'\u0637\u0631\u0642'
	],
	'Noise: Staffing / Recruitment': [
		'\u062a\u0648\u0638\u064a\u0641',
		'\u0642\u0648\u0649 \u0639\u0627\u0645\u0644\u0629',
		'\u0627\u0633\u062a\u0642\u062f\u0627\u0645'
	],
	'Noise: Non-technical Procurement': [
		'\u0623\u062b\u0627\u062b',
		'\u0642\u0631\u0637\u0627\u0633\u064a\u0629',
		'\u0636\u064a\u0627\u0641\u0629',
		'\u062a\u0646\u0638\u064a\u0641',
		'\u0637\u0628\u0627\u0639\u0629'
	]
}

const itsqActivities = [
	{
		name: 'IT & Digital Transformation Services',
		scope: 'ITSQ',
		keywords: [
			'digital transformation',
			'it services',
			'technology services',
			'information technology',
			'it modernization',
			'it infrastructure'
		]
	},
	{
		name: 'Software Development (Web/Mobile/Portals)',
		scope: 'ITSQ',
		keywords: [
			'software development',
			'application development',
			'web portal',
			'portal development',
			'mobile app',
			'mobile application',
			'software engineering'
		]
	},
	{
		name: 'Systems Integration',
		scope: 'ITSQ',
		keywords: [
			'system integration',
			'systems integration',
			'integration services',
			'middleware',
			'api integration'
		]
	},
	{
		name: 'Managed Services & IT Support',
		scope: 'ITSQ',
		keywords: [
			'managed services',
			'it support',
			'helpdesk',
			'service desk',
			'maintenance services',
			'support services'
		]
	},
	{
		name: 'Network Infrastructure (LAN/WAN/Wi-Fi)',
		scope: 'ITSQ',
		keywords: [
			'network infrastructure',
			'lan',
			'wan',
			'wi-fi',
			'wifi',
			'network equipment',
			'routers',
			'switches'
		]
	},
	{
		name: 'Cybersecurity (SOC, SIEM, Pentest, Hardening)',
		scope: 'ITSQ',
		keywords: [
			'cybersecurity',
			'information security',
			'soc',
			'siem',
			'penetration testing',
			'pentest',
			'vulnerability assessment',
			'security operations',
			'hardening'
		]
	},
	{
		name: 'Cloud Services (Azure/M365, migration, hosting)',
		scope: 'ITSQ',
		keywords: [
			'cloud services',
			'azure',
			'microsoft 365',
			'm365',
			'cloud migration',
			'hosting',
			'cloud hosting',
			'data center'
		]
	},
	{
		name: 'Data Platforms & Analytics (BI, dashboards, reporting)',
		scope: 'ITSQ',
		keywords: [
			'business intelligence',
			'bi',
			'analytics',
			'data platform',
			'data warehouse',
			'dashboard',
			'reporting',
			'etl'
		]
	},
	{
		name: 'AV / Unified Communications',
		scope: 'ITSQ',
		keywords: [
			'unified communications',
			'audio visual',
			'av systems',
			'video conferencing',
			'telepresence',
			'meeting room systems'
		]
	},
	{
		name: 'Smart Buildings / BMS Integration',
		scope: 'ITSQ',
		keywords: [
			'smart building',
			'building management system',
			'bms',
			'building automation',
			'facility management'
		]
	},
	{
		name: 'ERP/CRM/Enterprise Applications',
		scope: 'ITSQ',
		keywords: [
			'erp',
			'crm',
			'enterprise applications',
			'enterprise resource planning',
			'customer relationship management'
		]
	},
	{
		name: 'IT Consultancy / Strategy / PMO',
		scope: 'ITSQ',
		keywords: [
			'it consulting',
			'technology strategy',
			'digital strategy',
			'pmo',
			'project management office',
			'consultancy'
		]
	}
]

const iotActivities = [
	{
		name: 'IoT Platform / Dashboards / Device Management',
		scope: 'IOT_SHABAKA',
		keywords: [
			'iot platform',
			'device management',
			'iot dashboard',
			'device monitoring',
			'iot solution'
		]
	},
	{
		name: 'LoRaWAN Networks and Gateways',
		scope: 'IOT_SHABAKA',
		keywords: ['lorawan', 'lora', 'iot gateway', 'gateway']
	},
	{
		name: 'Environmental Monitoring (air, weather, noise, water)',
		scope: 'IOT_SHABAKA',
		keywords: [
			'environmental monitoring',
			'air quality',
			'weather monitoring',
			'noise monitoring',
			'water quality'
		]
	},
	{
		name: 'Smart City Use Cases',
		scope: 'IOT_SHABAKA',
		keywords: ['smart city', 'smart cities', 'urban sensing', 'city platform']
	},
	{
		name: 'Smart Parking / Smart Mobility',
		scope: 'IOT_SHABAKA',
		keywords: ['smart parking', 'parking management', 'smart mobility', 'traffic monitoring']
	},
	{
		name: 'RTLS / Asset Tracking / BLE Beacons',
		scope: 'IOT_SHABAKA',
		keywords: ['rtls', 'asset tracking', 'ble', 'beacon', 'rfid']
	},
	{
		name: 'Smart Waste / Smart Bins',
		scope: 'IOT_SHABAKA',
		keywords: ['smart waste', 'smart bin', 'waste monitoring', 'waste management']
	},
	{
		name: 'Energy Monitoring / Smart Metering',
		scope: 'IOT_SHABAKA',
		keywords: ['energy monitoring', 'smart metering', 'smart meter', 'utility monitoring']
	},
	{
		name: 'Industrial IoT (factories, utilities, pipelines)',
		scope: 'IOT_SHABAKA',
		keywords: ['industrial iot', 'iiot', 'factory monitoring', 'pipeline monitoring', 'utilities monitoring']
	},
	{
		name: 'Cold Chain / Temperature Monitoring',
		scope: 'IOT_SHABAKA',
		keywords: ['cold chain', 'temperature monitoring', 'temperature sensor', 'pharma logistics']
	},
	{
		name: 'Fleet Tracking / Logistics Monitoring',
		scope: 'IOT_SHABAKA',
		keywords: ['fleet tracking', 'vehicle tracking', 'logistics monitoring', 'telematics']
	},
	{
		name: 'Smart Agriculture / Soil & Irrigation Monitoring',
		scope: 'IOT_SHABAKA',
		keywords: ['smart agriculture', 'soil monitoring', 'irrigation monitoring', 'agritech']
	},
	{
		name: 'Predictive Maintenance / Condition Monitoring',
		scope: 'IOT_SHABAKA',
		keywords: ['predictive maintenance', 'condition monitoring', 'vibration monitoring']
	},
	{
		name: 'CCTV Analytics + IoT Integration',
		scope: 'IOT_SHABAKA',
		keywords: ['cctv analytics', 'video analytics', 'iot integration', 'camera analytics']
	}
]

const negativeActivities = [
	{
		name: 'Noise: Construction / Civil / Roads',
		scope: 'OTHER',
		keywords: [],
		negativeKeywords: [
			'construction',
			'civil works',
			'road',
			'roads',
			'asphalt',
			'bridge',
			'building works',
			'earthworks'
		]
	},
	{
		name: 'Noise: Staffing / Recruitment',
		scope: 'OTHER',
		keywords: [],
		negativeKeywords: ['recruitment', 'staffing', 'manpower', 'labor supply', 'hr services']
	},
	{
		name: 'Noise: Non-technical Procurement',
		scope: 'OTHER',
		keywords: [],
		negativeKeywords: [
			'furniture',
			'catering',
			'stationery',
			'office supplies',
			'uniforms',
			'printing',
			'cleaning services'
		]
	}
]

function mergeUnique(values) {
	const set = new Set((values || []).map(entry => String(entry).trim()).filter(Boolean))
	return Array.from(set)
}

async function seedActivities() {
	const activities = [...itsqActivities, ...iotActivities, ...negativeActivities]

	for (const activity of activities) {
		const arabicKeywords = arabicKeywordsByName[activity.name] || []
		const arabicNegative = arabicNegativeByName[activity.name] || []
		const incomingKeywords = mergeUnique([...(activity.keywords || []), ...arabicKeywords])
		const incomingNegatives = mergeUnique([...(activity.negativeKeywords || []), ...arabicNegative])
		const existing = await prisma.tenderActivity.findUnique({
			where: { tenantId_name: { tenantId, name: activity.name } }
		})
		const mergedKeywords = mergeUnique([...(existing?.keywords || []), ...incomingKeywords])
		const mergedNegatives = mergeUnique([...(existing?.negativeKeywords || []), ...incomingNegatives])

		await prisma.tenderActivity.upsert({
			where: { tenantId_name: { tenantId, name: activity.name } },
			create: {
				...activity,
				keywords: mergedKeywords,
				negativeKeywords: mergedNegatives,
				weight: activity.weight ?? undefined,
				isHighPriority: activity.isHighPriority ?? false,
				isActive: activity.isActive ?? true,
				tenantId
			},
			update: {
				scope: activity.scope,
				description: activity.description,
				keywords: mergedKeywords,
				negativeKeywords: mergedNegatives
			}
		})
	}
}

async function main() {
	await seedActivities()
	const count = await prisma.tenderActivity.count({ where: { tenantId } })
	console.log(`Tender activities seeded. Total: ${count}`)
}

main()
	.catch(err => {
		console.error(err)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
