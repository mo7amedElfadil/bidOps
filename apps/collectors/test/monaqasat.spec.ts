import { describe, it, expect } from 'vitest'
import { MonaqasatAdapter } from '../src/adapters/monaqasat'

describe('MonaqasatAdapter', () => {
    it('should initialize correctly', () => {
        const adapter = new MonaqasatAdapter()
        expect(adapter.id).toBe('monaqasat')
        expect(adapter.portalUrl).toContain('monaqasat.mof.gov.qa')
    })
})
