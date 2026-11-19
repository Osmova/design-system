import type { Meta } from '@storybook/vue3-vite'
import { computed, ref } from 'vue'
import { QColor, QDate, QTime } from 'quasar'
import DateApi from 'quasar/dist/api/QDate.json'
import TimeApi from 'quasar/dist/api/QTime.json'
import ColorApi from 'quasar/dist/api/QColor.json'
import { color, controls, type Story } from '../support/story-kit'

export default {
  title: 'Components/Pickers',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Date, time and colour pickers.' }, iframeHeight: '560px' },
  },
} satisfies Meta

export const Date: Story = {
  args: { color: 'primary', range: false, minimal: false, landscape: false, todayBtn: false, flat: false, bordered: false, readonly: false, disable: false, defaultView: 'Calendar' },
  argTypes: controls(DateApi, { color: color(), range: true, minimal: true, landscape: true, todayBtn: true, flat: true, bordered: true, readonly: true, disable: true, defaultView: true }),
  render: (args) => ({
    components: { QDate },
    setup: () => {
      const day = ref('2026/08/02')
      const span = ref({ from: '2026/08/06', to: '2026/08/12' })
      return {
        args,
        model: computed<string | { from: string, to: string }>({
          get: () => (args.range ? span.value : day.value),
          set: (value) => (typeof value === 'string' ? (day.value = value) : (span.value = value)),
        }),
      }
    },
    template: '<QDate v-model="model" v-bind="args" :key="args.defaultView" />',
  }),
}

export const Time: Story = {
  args: { color: 'primary', format24h: true, withSeconds: false, landscape: false, flat: false, bordered: false, readonly: false, disable: false },
  argTypes: controls(TimeApi, { color: color(), format24h: true, withSeconds: true, landscape: true, flat: true, bordered: true, readonly: true, disable: true }),
  render: (args) => ({
    components: { QTime },
    setup: () => ({ args, model: ref('10:30:00') }),
    template: '<QTime v-model="model" v-bind="args" />',
  }),
}

export const Color: Story = {
  args: { defaultView: 'spectrum', formatModel: 'hex', noHeader: false, noFooter: false, flat: false, bordered: false, readonly: false, disable: false },
  argTypes: controls(ColorApi, { defaultView: true, formatModel: true, noHeader: true, noFooter: true, flat: true, bordered: true, readonly: true, disable: true }),
  render: (args) => ({
    components: { QColor },
    setup: () => ({ args, model: ref('#6366f1') }),
    template: '<QColor v-model="model" v-bind="args" :key="args.defaultView + args.formatModel" style="max-width: 18rem" />',
  }),
}
