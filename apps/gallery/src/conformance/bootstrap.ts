import { createApp } from 'vue'
import { BottomSheet, Dialog, Loading, LoadingBar, Notify, Quasar } from 'quasar'
import { configureDesignSystem, odsIconSet } from '@osmova/quasar-design-system'
import NativeConformance from './NativeConformance.vue'

const query = new URLSearchParams(location.search)
const app = createApp(NativeConformance)
app.use(Quasar, {
  plugins: { BottomSheet, Dialog, Loading, LoadingBar, Notify },
  iconSet: odsIconSet,
  config: { loadingBar: { skipHijack: true } },
})
const ds = configureDesignSystem(app, {
  variant: 'shadcn', mode: 'light', persist: query.get('persist') === '1',
  storageKey: 'qds.shadcn.conformance',
})
;(window as unknown as { __odsGallery: typeof ds }).__odsGallery = ds
app.mount('#app')
