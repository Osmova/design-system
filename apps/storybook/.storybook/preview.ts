import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { BottomSheet, ClosePopup, Dialog, Loading, LoadingBar, Notify, Quasar } from 'quasar'
import {
  configureDesignSystem,
  DESIGN_SYSTEM_VARIANTS,
  INK_COLORS,
  odsIconSet,
  SHADCN_BASE_COLORS,
  type DesignSystemController,
  type DesignSystemMode,
  type InkColor,
  type ShadcnBaseColor,
} from '@osmova/quasar-design-system'
import { ownPreviewController } from '../../../packages/quasar/catalog/preview/index'

// Same consumer order as the gallery: native, design system, extension, then fonts and demo helpers.
import '@gallery/adoption-default.scss'
import '@gallery/fonts/plus-jakarta-sans.css'
import '@gallery/gallery.css'
import '@osmova/quasar-design-system/fonts/default.css'
import '@osmova/quasar-design-system/fonts/open-sans.css'
import '@osmova/quasar-design-system/fonts/selawik.css'
import '@osmova/quasar-design-system/fonts/zen.css'
import '@osmova/quasar-design-system/fonts/ink.css'
import '../demos/showcase.scss'

export interface ThemeGlobals {
  scheme: DesignSystemMode
  variant: string
  ink: InkColor
  palette: ShadcnBaseColor
}

const VARIANTS = Object.values(DESIGN_SYSTEM_VARIANTS).filter((variant) => variant.cssClass === `ods-variant-${variant.name}`)

const initialGlobals: ThemeGlobals = { scheme: 'light', variant: 'win', ink: 'charcoal', palette: 'neutral' }
let wanted: ThemeGlobals = { ...initialGlobals }
let live: DesignSystemController | null = null

function paint(controller: DesignSystemController, globals: ThemeGlobals): void {
  controller.setVariant(globals.variant)
  controller.setInkColor(globals.ink)
  controller.setShadcnBaseColor(globals.palette)
  controller.setMode(globals.scheme)
}

setup((app) => {
  app.use(Quasar, {
    iconSet: odsIconSet,
    plugins: { BottomSheet, Dialog, Loading, LoadingBar, Notify },
    directives: { ClosePopup },
    config: { loadingBar: { color: 'primary', size: '4px', skipHijack: true } },
  })

  const controller = configureDesignSystem(app, {
    persist: false,
    mode: wanted.scheme,
    variant: wanted.variant,
    inkColor: wanted.ink,
    shadcnBaseColor: wanted.palette,
  })
  ownPreviewController(app, controller)
  paint(controller, wanted)
  live = controller
  app.onUnmount(() => {
    if (live === controller) live = null
  })
})

const preview: Preview = {
  globalTypes: {
    variant: {
      description: 'Design-system variant (controller.setVariant)',
      toolbar: {
        title: 'Variant',
        icon: 'component',
        dynamicTitle: true,
        items: VARIANTS.map((variant) => ({ value: variant.name, title: variant.label })),
      },
    },
    scheme: {
      description: 'Design-system color mode (controller.setMode)',
      toolbar: {
        title: 'Scheme',
        icon: 'mirror',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'system', title: 'System', icon: 'browser' },
        ],
      },
    },
    ink: {
      description: 'Ink colour (controller.setInkColor; paints the ink variant)',
      toolbar: {
        title: 'Ink',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: INK_COLORS.map((color) => ({ value: color.name, title: `Ink: ${color.label}` })),
      },
    },
    palette: {
      description: 'Shadcn palette axis (controller.setShadcnBaseColor; paints the shadcn variant)',
      toolbar: {
        title: 'Palette',
        icon: 'contrast',
        dynamicTitle: true,
        items: SHADCN_BASE_COLORS.map((color) => ({ value: color.name, title: `Palette: ${color.label}` })),
      },
    },
  },
  initialGlobals: { ...initialGlobals },
  parameters: {
    layout: 'padded',
    controls: { expanded: true, sort: 'requiredFirst' },
    docs: {
      story: { inline: false },
      iframeHeight: '420px',
    },
    a11y: { context: 'body' },
    options: {
      storySort: { order: ['Introduction', 'Foundations', 'Components', 'Patterns', 'Systems', 'Optional', '*'] },
    },
  },
  decorators: [
    (story, context) => {
      if (context.viewMode !== 'docs') {
        wanted = { ...initialGlobals, ...(context.globals as Partial<ThemeGlobals>) }
        if (live) paint(live, wanted)
      }
      return story()
    },
  ],
}

export default preview
