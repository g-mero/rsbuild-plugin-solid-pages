import { expect, it } from 'vitest'
import { filterExports } from '../src/module'

it('should filter modules', () => {
  const testCode = `
    export const a = 1
    export const b = 2`

  const result = filterExports(testCode, ['a'])

  console.log(result)

  expect(result).toBe('export const a = 1;\n')
})
