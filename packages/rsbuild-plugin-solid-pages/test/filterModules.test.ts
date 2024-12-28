import { expect, it } from 'vitest'
import { filterExports } from '../src/module'

const testCode = `
import 'style.css'
const dead_code = 1
export const a = 1
const b = 2
export { b }
const c = 3
export { c as d }
export default c
`

it('filter css and default', () => {
  const result = filterExports(testCode, ['default', 'css'])

  console.log(result)

  expect(result).toBe('import"style.css";export default 3;')
})

it('filter named exports', () => {
  const result = filterExports(testCode, ['a', 'd'])

  console.log(result)

  expect(result).toBe('export var a=1;var c=3;export{c as d};')
})
