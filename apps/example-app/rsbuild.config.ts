import { defineConfig } from '@rsbuild/core'
import { pluginBabel } from '@rsbuild/plugin-babel'
import { pluginSass } from '@rsbuild/plugin-sass'
import { pluginSolid } from '@rsbuild/plugin-solid'
import { UnoCSSRspackPlugin } from '@unocss/webpack/rspack'
import pluginSolidPages from 'rsbuild-plugin-solid-pages'

export default defineConfig({
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginSolid(),
    pluginSolidPages({
      dir: 'src/pages',
      extensions: ['tsx'],
    }),
    pluginSass(),
  ],
  tools: {
    rspack(config, ctx) {
      ctx.prependPlugins(UnoCSSRspackPlugin())
      config.optimization ??= {}
      config.optimization.realContentHash = true
    },
  },
})
