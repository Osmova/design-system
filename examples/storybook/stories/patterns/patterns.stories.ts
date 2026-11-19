import type { Meta } from '@storybook/vue3-vite'
import AppsSection from '@gallery/sections/AppsSection.vue'
import ComponentsSection from '@gallery/sections/ComponentsSection.vue'
import FormsSection from '@gallery/sections/FormsSection.vue'
import NativeConformance from '@gallery/conformance/NativeConformance.vue'
import { showcase } from '../support/story-kit'

export default {
  title: 'Patterns',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Whole screens composed from the components, shared with the gallery.' } },
  },
} satisfies Meta

export const Apps = showcase(AppsSection, 'Application shells: navigation, list-detail, settings and an add dialog.')
export const Forms = showcase(FormsSection, 'Form layout pattern: labels, help, errors, groups and actions.')
export const ComponentSheet = showcase(ComponentsSection, 'One sheet with the everyday components side by side.')
export const NativeConformanceSheet = showcase(NativeConformance, 'Native anatomy, overlays and local scheme states.')
