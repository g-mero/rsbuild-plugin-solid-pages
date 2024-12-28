/* eslint-disable node/prefer-global/process */
import { join } from 'node:path'
import fs from 'fs-extra'

export class TempDummyModule {
  private tempDir: string
  private moduleIds: Record<string, string> = {}

  constructor(moduleNames: string[]) {
    const nodeModulesDir = join(process.cwd(), 'node_modules')
    if (!fs.existsSync(nodeModulesDir)) {
      fs.mkdirSync(nodeModulesDir)
    }

    this.tempDir = join(nodeModulesDir, 'solid-pages-fake-node-module')

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir)
    }

    moduleNames.forEach((moduleName, i) => {
      this.writeModule(moduleName, `module${i}`)
    })
  }

  cleanup() {
    fs.removeSync(this.tempDir)
  }

  writeModule(moduleName: string, fileName: string) {
    const modulePath = join(this.tempDir, `${fileName}.js`)
    this.moduleIds[moduleName] = modulePath
    fs.writeFileSync(modulePath, `export default {}`)
  }

  ids() {
    return this.moduleIds
  }
}
