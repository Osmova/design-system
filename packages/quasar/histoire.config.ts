import { defineConfig } from 'histoire'
import { HstVue } from '@histoire/plugin-vue'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  setupFile: '/histoire.setup.ts',
  outDir: '.histoire/dist',
  routerMode: 'hash',
  defaultStoryProps: {
    responsiveDisabled: true,
    autoPropsDisabled: true,
  },
  theme: {
    title: 'Osmova Design System',
    logo: {
      square: './public/ods-logo-square.svg',
      light: './public/ods-logo-light.svg',
      dark: './public/ods-logo-dark.svg',
    },
    favicon: 'ods-favicon.svg',
    colors: {
      primary: {
        500: '#005a9e',
      },
    },
  },
  plugins: [HstVue()],
  vite: {
    base: './',
    plugins: [vue()],
    ssr: {
      noExternal: ['@quasar/quasar-ui-qwindow'],
    },
  },
})
