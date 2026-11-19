import type { Meta } from '@storybook/vue3-vite'
import WindowSection from '@gallery/sections/WindowSection.vue'
import WindowShowcase from '../../demos/WindowShowcase.vue'
import { showcase } from '../support/story-kit'

export default {
  title: 'Optional/QWindow',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Optional QWindow extension: native QWindow with the design-system chrome stylesheet.',
      },
    },
  },
} satisfies Meta

export const Embedded = showcase(WindowShowcase, 'An embedded window with a close and reopen path.')
export const Gallery = showcase(WindowSection, 'The gallery window proof.')
