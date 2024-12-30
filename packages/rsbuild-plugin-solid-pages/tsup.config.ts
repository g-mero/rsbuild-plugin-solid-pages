// tsup.config.ts
import { defineConfig, type Options } from 'tsup'

function generateConfig(opt: Options, dts: boolean): Options {
  return {
    target: 'esnext',
    platform: 'node',
    format: ['cjs', 'esm'],
    clean: true,
    dts,
    entry: ['src/index.ts'],
    outDir: 'dist/',
    treeshake: { preset: 'smallest' },
    replaceNodeEnv: true,
    esbuildOptions(options) {
      if (!opt.watch) {
        options.drop = ['console', 'debugger']
      }
    },
  }
}

export default defineConfig(options => [generateConfig(options, true)])
