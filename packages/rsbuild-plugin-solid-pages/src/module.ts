import { parseSync, transformSync } from '@swc/core'

/**
 * 根据源代码和 pick 参数生成只包含 pick 的模块代码。
 * @param {string} sourceCode - 源代码字符串
 * @param {string[]} picks - 要保留的导出名称数组
 * @returns {string} - 生成的新模块代码
 */
export function filterExports(sourceCode: string, picks: string[]): string {
  // 解析源代码为 AST
  const ast = parseSync(sourceCode, {
    syntax: 'typescript', // 支持 ts
    tsx: true, // 支持 TSX
  })

  // 筛选 AST 中的导出节点
  const filteredBody = ast.body.filter((node) => {
    if (node.type === 'ExportNamedDeclaration') {
      // 处理 export { a, b } 形式
      node.specifiers = node.specifiers.filter(spec =>
        spec.type === 'ExportSpecifier' ? picks.includes(spec.exported?.value ? spec.exported.value : spec.orig.value) : false,
      )
      return node.specifiers.length > 0
    }
    else if (node.type === 'ExportDeclaration') {
      const type = node.declaration.type
      switch (type) {
        case 'FunctionDeclaration':
          return picks.includes(node.declaration.identifier.value)

        case 'VariableDeclaration':
          return node.declaration.declarations.some(decl => decl.id.type === 'Identifier' ? picks.includes(decl.id.value) : false)

        default:
          break
      }
    }
    else if (node.type === 'ExportDefaultDeclaration') {
      // 处理默认导出
      return picks.includes('default')
    }
    else if (node.type === 'ExportDefaultExpression') {
      // 处理 export default expression 形式
      return picks.includes('default')
    }
    return true
  })

  // 创建新的 AST
  const newAst = {
    ...ast,
    body: filteredBody,
  }

  // 将新 AST 转换为代码
  const { code: newCode } = transformSync(newAst, {
    minify: true,
    jsc: {
      minify: {
        compress: {
          dead_code: true,
          toplevel: true,
        },
      },
    },
  })

  if (!picks.includes('css')) {
    return newCode.replace(/import"(.+?)";/g, '')
  }

  return newCode
}
