import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

const adoptionModules = new Map([
  [fileURLToPath(new URL('./src/adoption-default.scss', import.meta.url)), 'adoption-default'],
  [fileURLToPath(new URL('./src/conformance/quasar-layered.css', import.meta.url)), 'adoption-layered-native'],
  [fileURLToPath(new URL('../../packages/quasar/src/css/index.layered.scss', import.meta.url)), 'adoption-layered-qds'],
  [fileURLToPath(new URL('../../packages/quasar/src/css/extensions/qwindow.layered.scss', import.meta.url)), 'adoption-layered-window'],
])

// Rollup's shared JS traversal is not a CSS cascade contract. Explicit CSS-only
// chunks keep default adoption atomic and layered adoption separately ordered.
// Emitted asset metadata identifies them
// without guessing hashed filenames (or the misleading former qwindow chunk).
function consumerCssOrder(): Plugin {
  const emittedModules = new Map<string, string[]>()
  let base = './'
  return {
    name: 'gallery-consumer-css-order',
    enforce: 'post',
    configResolved(config) { base = config.base },
    buildStart() { emittedModules.clear() },
    renderChunk(_, chunk) {
      if ([...adoptionModules.values()].includes(chunk.name)) {
        const modules = Object.keys(chunk.modules)
        if (modules.length !== 1 || adoptionModules.get(modules[0]) !== chunk.name) {
          this.error(`Unexpected modules in consumer CSS chunk ${chunk.name}`)
        }
        emittedModules.set(chunk.name, modules)
      }
      return null
    },
    generateBundle(_, bundle) {
      const adoptionAssets = new Map<string, string>()
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset') continue
        for (const name of adoptionModules.values()) {
          if (asset.names.includes(`${name}.css`)) {
            if (!emittedModules.has(name) || adoptionAssets.has(name)) this.error(`Ambiguous consumer CSS asset ${name}`)
            adoptionAssets.set(name, asset.fileName)
          }
        }
      }
      const evidence: Record<string, unknown> = {}
      for (const [html, adoption] of [
        ['index.html', ['adoption-default']],
        ['conformance.html', ['adoption-default']],
        ['conformance-layered.html', ['adoption-layered-native', 'adoption-layered-qds', 'adoption-layered-window']],
      ] as const) {
        const asset = bundle[html]
        const css = adoption.map((name) => adoptionAssets.get(name))
        if (!asset || asset.type !== 'asset' || css.some((file) => !file)) this.error(`Missing consumer CSS for ${html}`)
        const source = String(asset.source)
        const links = source.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g) ?? []
        const first = css.map((file) => {
          const matches = links.filter((link) => link.includes(`${base}${file}`))
          if (matches.length !== 1) this.error(`Expected exactly one ${file} link in ${html}`)
          return matches[0]
        })
        const otherAdoption = [...adoptionAssets.values()].filter((file) => !css.includes(file))
        if (links.some((link) => otherAdoption.some((file) => link.includes(`${base}${file}`)))) {
          this.error(`Mixed CSS adoption paths in ${html}`)
        }
        const ordered = [...first, ...links.filter((link) => !first.includes(link))]
        let index = 0
        asset.source = source.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, () => ordered[index++])
        evidence[html] = {
          adoptionModules: adoption.flatMap((name) => emittedModules.get(name)!.map((id) => [id, name])),
          links: ordered,
        }
      }
      this.emitFile({ type: 'asset', fileName: 'consumer-css-order.json', source: JSON.stringify(evidence, null, 2) })
    },
  }
}

// Relative by default so the build serves from any subpath; the /next/ preview sets ODS_GALLERY_BASE.
export default defineConfig({
  base: process.env.ODS_GALLERY_BASE || './',
  build: {
    rollupOptions: {
      input: {
        gallery: fileURLToPath(new URL('./index.html', import.meta.url)),
        conformance: fileURLToPath(new URL('./conformance.html', import.meta.url)),
        layered: fileURLToPath(new URL('./conformance-layered.html', import.meta.url)),
      },
      output: {
        onlyExplicitManualChunks: true,
        manualChunks: (id) => adoptionModules.get(id),
      },
    },
  },
  plugins: [
    vue({
      template: {
        transformAssetUrls,
        compilerOptions: { isCustomElement: (tag) => tag.startsWith('fluent-') },
      },
    }),
    quasar(),
    consumerCssOrder(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // QWindow imports quasar internals without declaring it; resolve them from this app.
    dedupe: ['quasar'],
  },
  // The design-system is a source-only package (.ts/.scss). Keep it out of
  // esbuild's dep prebundle so Vite/Quasar/Sass compile its sources directly.
  optimizeDeps: {
    exclude: ['@osmova/ds-quasar'],
  },
  // The Docker Desktop screens runner reaches the preview through this host name.
  preview: { allowedHosts: ['host.docker.internal'] },
})
