export function checkRouteFileStatus(code: string) {
  const routeRe = /^export\s+(?:const|let)\s+route\W/m
  const isLazyRe = /^export\s+const\s+LAZY_IMPORT\s*=\s*(true|false)$/m
  const defaultRe = /^export\s+default\s/m

  let isLazy = true
  const match = code.match(isLazyRe)
  if (match) {
    isLazy = match[1] === 'true'
  }

  return {
    hasConfig: routeRe.test(code),
    hasDefault: defaultRe.test(code),
    isLazy,
    content: code,
  }
}
