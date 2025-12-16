import { Module } from '@nestjs/common'
import { STORAGE_SERVICE } from './storage.interface'
import { LocalStorageService } from './local-storage.service'
import { BlobService } from './blob.service'

/**
 * Storage module with factory provider for local/azure toggle.
 * 
 * Environment variable: STORAGE_PROVIDER=local|azure
 * - local (default): Uses LocalStorageService (filesystem)
 * - azure: Uses BlobService (Azure Blob Storage)
 */
@Module({
	providers: [
		{
			provide: STORAGE_SERVICE,
			useFactory: () => {
				const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
				if (provider === 'azure') {
					return new BlobService()
				}
				return new LocalStorageService()
			}
		}
	],
	exports: [STORAGE_SERVICE]
})
export class StorageModule {}

