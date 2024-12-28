import type { RsbuildPlugin } from '@rsbuild/core'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { filePathToRoute, getPageFiles, getTitleFromPath } from './files'
import { filterExports } from './module'
import { checkRouteFileStatus } from './route-config'
import { TempDummyModule } from './temp-module'
import { normalizePath } from './utils'

const defaultExts = ['mdx']
const defaultDir = 'src/pages'

function genClientCode(routes: any[]) {
  const routeStrs: string[] = []
  const routeImports: string[] = []

  routes.forEach((route, i) => {
    const routeName = `route$${i}`
    const componentName = `${routeName}$default`

    if (!route.isLazy) {
      routeImports.push(`import ${componentName} from '${normalizePath(route.componentPath)}?pick=default';`)
    }
    if (route.hasConfig) {
      routeImports.push(`import {route as ${routeName}} from '${normalizePath(route.componentPath)}?pick=route';`)
    }
    else {
      routeImports.push(`const ${routeName} = {};`)
    }
    const componentStr = route.isLazy ? `lazy(() => import('${normalizePath(route.componentPath)}?pick=default'))` : componentName
    routeStrs.push(`{path: '${route.path}', component: ${componentStr}, info: ${JSON.stringify(route.info)}, ...${routeName}}`)
  })

  return `
  import { lazy } from 'solid-js';

  ${routeImports.join('\n')}

  const routes = [
    ${routeStrs.join(',\n')}
  ];

  export default routes;
`
}

export default function solidPagesPlugin(config?: {
  dir: string
  extensions: string[]
}): RsbuildPlugin {
  const VIRTUAL_ID = 'virtual:pages'
  const VIRTUAL_ID_RESOLVED = `\0${VIRTUAL_ID}`
  const VIRTUAL_ROUTE_INFO_ID = 'virtual:route-info'
  const VIRTUAL_ROUTE_INFO_ID_RESOLVED = `\0${VIRTUAL_ROUTE_INFO_ID}`
  const FAKE_NODE_MODULE = new TempDummyModule([VIRTUAL_ID_RESOLVED, VIRTUAL_ROUTE_INFO_ID_RESOLVED])
  const TEMP_VIRUTAL_ID = FAKE_NODE_MODULE.ids()[VIRTUAL_ID_RESOLVED]
  const TEMP_VIRUTAL_ROUTE_INFO_ID = FAKE_NODE_MODULE.ids()[VIRTUAL_ROUTE_INFO_ID_RESOLVED]

  const { dir = defaultDir, extensions = defaultExts } = config || {}
  const routes: any[] = []

  return {
    name: 'rsbuild:solid-pages',
    setup(api) {
      api.onBeforeCreateCompiler(() => {
        const files = getPageFiles(dir, extensions)
        routes.length = 0

        for (const file of files) {
          const fileStat = statSync(file)
          const info: any = {}
          info.date = fileStat.birthtime
          info.updated = fileStat.mtime
          info.title = getTitleFromPath(file)
          const route: any = {}
          route.info = info
          route.path = filePathToRoute(file, dir)
          route.componentPath = join(api.context.rootPath, file)
          const content = readFileSync(route.componentPath, 'utf-8')
          if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            const c = checkRouteFileStatus(content)
            if (!c.hasDefault) {
              continue
            }
            route.isLazy = c.isLazy
            route.hasConfig = c.hasConfig
          }
          else if (file.endsWith('.mdx')) {
            const data = matter(content)
            route.info = Object.assign(info, data.data)
          }
          routes.push(route)
        }
      })

      api.onExit(() => {
        FAKE_NODE_MODULE.cleanup()
      })

      api.modifyRsbuildConfig((c) => {
        const alias = c.resolve?.alias || {} as any
        alias[VIRTUAL_ID_RESOLVED] = TEMP_VIRUTAL_ID
        alias[VIRTUAL_ROUTE_INFO_ID_RESOLVED] = TEMP_VIRUTAL_ROUTE_INFO_ID

        return { ...c, resolve: { ...c.resolve, alias } }
      })

      api.resolve(({ resolveData }) => {
        const id = resolveData.request
        if (id === VIRTUAL_ID) {
          resolveData.request = VIRTUAL_ID_RESOLVED
        }
        if (id === VIRTUAL_ROUTE_INFO_ID) {
          resolveData.request = VIRTUAL_ROUTE_INFO_ID_RESOLVED
        }
      })

      api.transform({ test(value) {
        return value === TEMP_VIRUTAL_ID
      } }, () => {
        return genClientCode(routes)
      })

      api.transform({ test(value) {
        return value === TEMP_VIRUTAL_ROUTE_INFO_ID
      } }, () => {
        return `export default ${JSON.stringify(routes.map(r => ({ info: r.info, path: r.path })))}`
      })

      // pick
      api.transform({ test() {
        return true
      } }, ({ code, resourceQuery }) => {
        const query = new URLSearchParams(resourceQuery)
        const pick = query.get('pick')?.split(',')
        if (!pick) {
          return code
        }

        const f = filterExports(code, pick)
        return f
      })
    },
  }
}
