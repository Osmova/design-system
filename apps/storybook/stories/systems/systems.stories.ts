import type { Meta } from '@storybook/vue3-vite'
import VariantsSection from '@gallery/sections/VariantsSection.vue'
import ScenesSection from '@gallery/sections/ScenesSection.vue'
import { showcase } from '../support/story-kit'

export default {
  title: 'Systems',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'The variants side by side and over scenic wallpapers.' } },
  },
} satisfies Meta

export const Variants = showcase(VariantsSection, 'Same anatomy, different visual systems.')
export const Scenes = showcase(ScenesSection, 'Variant matrix over scenic wallpapers.')
