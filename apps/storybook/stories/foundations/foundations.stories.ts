import type { Meta } from '@storybook/vue3-vite'
import TokensSection from '@gallery/sections/TokensSection.vue'
import TypographySection from '@gallery/sections/TypographySection.vue'
import IconsSection from '@gallery/sections/IconsSection.vue'
import FontsSection from '@gallery/sections/FontsSection.vue'
import OverviewShowcase from '../../demos/OverviewShowcase.vue'
import { showcase } from '../support/story-kit'

export default {
  title: 'Foundations',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Tokens, type, icons and fonts. Every value is a `--ods-*` custom property that the toolbar globals repaint.',
      },
    },
  },
} satisfies Meta

export const Overview = showcase(OverviewShowcase, 'A compact overview of neutral-first components over Quasar 2 primitives.')
export const Tokens = showcase(TokensSection, 'Role colours, surfaces, text, borders and the other semantic tokens.')
export const Typography = showcase(TypographySection, 'The type ramp from display to caption.')
export const Icons = showcase(IconsSection, 'Phosphor icon set wired into Quasar through `odsIconSet`.')
export const Fonts = showcase(FontsSection, 'Optional font faces shipped under `@osmova/quasar-design-system/fonts/*`.')
