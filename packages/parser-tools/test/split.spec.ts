import { describe, it, expect } from 'vitest'
import { splitIntoClauses } from '../src/index'

describe('splitIntoClauses', () => {
    it('should split numbered lists', () => {
        const input = `
1. First clause
some content

2. Second clause
more content
        `
        const result = splitIntoClauses(input)
        expect(result).toHaveLength(2)
        expect(result[0]).toContain('First clause')
    })
    
    it('should handle plain text chunks', () => {
        const input = `
Chunk 1 content.

Chunk 2 content.
        `
        const result = splitIntoClauses(input)
        expect(result).toHaveLength(2)
    })
})
