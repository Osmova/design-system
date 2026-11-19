import type { StorybookConfig } from '@storybook/vue3-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const galleryRoot = path.resolve(repoRoot, 'apps/gallery')

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.ts'],
  framework: {
    name: '@storybook/vue3-vite',
    options: { docgen: false },
  },
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: [path.resolve(galleryRoot, 'public')],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  async viteFinal(config) {
    const { default: vue } = await import('@vitejs/plugin-vue')
    const { quasar, transformAssetUrls } = await import('@quasar/vite-plugin')

    const baseAlias = config.resolve?.alias
    const baseEntries: Array<{ find: string | RegExp; replacement: string }> = Array.isArray(baseAlias)
      ? baseAlias
      : Object.entries(baseAlias ?? {}).map(([find, replacement]) => ({ find, replacement: String(replacement) }))

    return {
      ...config,
      plugins: [...(config.plugins ?? []), vue({ template: { transformAssetUrls } }), quasar()],
      resolve: {
        ...config.resolve,
        alias: [
          ...baseEntries,
          { find: '@qds-catalog', replacement: path.resolve(repoRoot, 'packages/quasar/catalog') },
          { find: '@gallery', replacement: path.resolve(galleryRoot, 'src') },
        ],
      },
      optimizeDeps: {
        ...config.optimizeDeps,
        exclude: [...(config.optimizeDeps?.exclude ?? []), '@osmova/quasar-design-system'],
      },
      build: { ...config.build, chunkSizeWarningLimit: 4096 },
      server: {
        ...config.server,
        fs: { ...(config.server?.fs ?? {}), allow: [...(config.server?.fs?.allow ?? []), repoRoot] },
      },
    }
  },
}

export default config
