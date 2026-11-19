import { createApp } from 'vue'
import { BottomSheet, Dialog, Loading, LoadingBar, Notify, Quasar } from 'quasar'

// Keep native → ODS → extension ordering indivisible across MPA shared chunks.
import './adoption-default.scss'

// 3. Gallery-only demo helpers (NOT part of the published design-system package).
import './fonts/plus-jakarta-sans.css'
import './gallery.css'

// 4. Optional design-system fonts (drive --ods-font-family* faces).
import '@osmova/ds-quasar/fonts/inter.css'
import '@osmova/ds-quasar/fonts/open-sans.css'
import '@osmova/ds-quasar/fonts/selawik.css'
import '@osmova/ds-quasar/fonts/zen.css'
import '@osmova/ds-quasar/fonts/ink.css'

import {
  configureDesignSystem,
  odsIconSet,
} from '@osmova/ds-quasar'

import App from './App.vue'
import { parseGalleryHash } from './gallery-url'

const initialVariant = parseGalleryHash(window.location.hash).variant ?? 'win'

const app = createApp(App)

app.use(Quasar, {
  plugins: { BottomSheet, Dialog, Loading, LoadingBar, Notify },
  config: {
    loadingBar: {
      color: 'primary',
      size: '4px',
      skipHijack: true,
    },
  },
  iconSet: odsIconSet,
})

// Initialize the runtime theme controller exactly as an external app would.
// `persist: false` keeps the visual gate deterministic (no localStorage carry-over
// of mode/variant between matrix cells).
const ds = configureDesignSystem(app, {
  mode: 'system',
  variant: initialVariant,
  persist: false,
})

// Expose the controller so the Playwright visual gate can drive mode/variant
// directly (same API an external app uses), instead of clicking switchers.
;(window as unknown as { __odsGallery?: typeof ds }).__odsGallery = ds

app.mount('#app')
