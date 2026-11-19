import type { Meta } from '@storybook/vue3-vite'
import { computed, ref } from 'vue'
import { QCheckbox, QFile, QInput, QOptionGroup, QRadio, QRange, QSelect, QSlider, QToggle } from 'quasar'
import InputApi from 'quasar/dist/api/QInput.json'
import SelectApi from 'quasar/dist/api/QSelect.json'
import FileApi from 'quasar/dist/api/QFile.json'
import CheckboxApi from 'quasar/dist/api/QCheckbox.json'
import RadioApi from 'quasar/dist/api/QRadio.json'
import ToggleApi from 'quasar/dist/api/QToggle.json'
import OptionGroupApi from 'quasar/dist/api/QOptionGroup.json'
import SliderApi from 'quasar/dist/api/QSlider.json'
import RangeApi from 'quasar/dist/api/QRange.json'
import CatalogForms from '@gallery/sections/catalog/CatalogForms.vue'
import FormsPickersShowcase from '../../demos/FormsPickersShowcase.vue'
import { color, controls, showcase, type QuasarApi, type Story } from '../support/story-kit'

const appearance = {
  description: 'Field design (filled, outlined, standout, borderless are mutually exclusive)',
  control: { type: 'select' as const },
  options: ['outlined', 'filled', 'standout', 'borderless', 'standard'],
}

const fieldArgs = { label: 'Workspace name', appearance: 'outlined', hint: 'Use 3 to 40 characters', dense: false, stackLabel: false, clearable: false, loading: false, error: false, errorMessage: 'This name is taken', disable: false, readonly: false }

const fieldControls = (api: QuasarApi) => ({
  appearance,
  ...controls(api, { label: true, hint: true, dense: true, stackLabel: true, clearable: true, loading: true, error: true, errorMessage: true, disable: true, readonly: true }),
})

const styled = (args: Record<string, unknown>) => {
  const { appearance: look, ...rest } = args
  return look === 'standard' ? rest : { ...rest, [String(look)]: true }
}

const choiceControls = (api: QuasarApi) => controls(api, { label: true, color: color(), dense: true, leftLabel: true, disable: true })

const OPTIONS = ['Compact', 'Comfortable', 'Touch', 'Spacious']

export default {
  title: 'Components/Inputs',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Text fields, selects, files, selection controls and sliders.' } },
  },
} satisfies Meta

export const Showcase = showcase(FormsPickersShowcase, 'Selection controls, fields and pickers in checked, dense, disabled and error states.')
export const Gallery = showcase(CatalogForms, 'The gallery form family.')

export const Input: Story = {
  args: { ...fieldArgs, type: 'text', counter: false, maxlength: 40, prefix: '', suffix: '' },
  argTypes: { ...fieldControls(InputApi), ...controls(InputApi, { type: true, counter: true, maxlength: true, prefix: true, suffix: true }) },
  render: (args) => ({
    components: { QInput },
    setup: () => ({ props: computed(() => styled(args)), model: ref('Design tokens') }),
    template: '<QInput v-model="model" v-bind="props" style="max-width: 24rem" />',
  }),
}

export const Select: Story = {
  args: { ...fieldArgs, label: 'Density', hint: '', multiple: false, useChips: false, optionsDense: false },
  argTypes: { ...fieldControls(SelectApi), ...controls(SelectApi, { multiple: true, useChips: true, optionsDense: true }) },
  render: (args) => ({
    components: { QSelect },
    setup: () => {
      const one = ref<string | null>('Comfortable')
      const many = ref(['Compact', 'Touch'])
      const model = computed({
        get: () => (args.multiple ? many.value : one.value),
        set: (value: string | string[] | null) => (Array.isArray(value) ? (many.value = value) : (one.value = value)),
      })
      return { props: computed(() => styled(args)), model, options: OPTIONS }
    },
    template: '<QSelect v-model="model" v-bind="props" :options="options" style="max-width: 24rem" />',
  }),
}

export const File: Story = {
  args: { ...fieldArgs, label: 'Attachment', hint: 'PDF up to 2 MB', multiple: false, counter: false },
  argTypes: { ...fieldControls(FileApi), ...controls(FileApi, { multiple: true, counter: true }) },
  render: (args) => ({
    components: { QFile },
    setup: () => ({ props: computed(() => styled(args)), model: ref(null) }),
    template: '<QFile v-model="model" v-bind="props" style="max-width: 24rem" />',
  }),
}

export const Checkbox: Story = {
  args: { label: 'Email me a weekly digest', color: 'primary', dense: false, leftLabel: false, disable: false, state: 'checked' },
  argTypes: {
    state: { description: 'Model value', control: { type: 'inline-radio' }, options: ['checked', 'unchecked', 'indeterminate'] },
    ...choiceControls(CheckboxApi),
  },
  render: (args) => ({
    components: { QCheckbox },
    setup: () => ({
      args,
      model: computed(() => ({ checked: true, unchecked: false, indeterminate: null })[String(args.state) as 'checked']),
    }),
    template: '<QCheckbox :model-value="model" :label="args.label" :color="args.color" :dense="args.dense" :left-label="args.leftLabel" :disable="args.disable" toggle-indeterminate />',
  }),
}

export const Radio: Story = {
  args: { label: 'Comfortable', color: 'primary', dense: false, leftLabel: false, disable: false },
  argTypes: choiceControls(RadioApi),
  render: (args) => ({
    components: { QRadio },
    setup: () => ({ args, model: ref('comfortable') }),
    template: `
      <div class="qds-story-row" role="radiogroup" aria-label="Density">
        <QRadio v-model="model" val="compact" label="Compact" :color="args.color" :dense="args.dense" :left-label="args.leftLabel" :disable="args.disable" />
        <QRadio v-model="model" val="comfortable" :label="args.label" :color="args.color" :dense="args.dense" :left-label="args.leftLabel" :disable="args.disable" />
      </div>`,
  }),
}

export const Toggle: Story = {
  args: { label: 'Sync with system', color: 'primary', dense: false, leftLabel: false, disable: false, checked: true },
  argTypes: { checked: { description: 'Model value', control: { type: 'boolean' } }, ...choiceControls(ToggleApi) },
  render: (args) => ({
    components: { QToggle },
    setup: () => ({ args }),
    template: '<QToggle :model-value="args.checked" :label="args.label" :color="args.color" :dense="args.dense" :left-label="args.leftLabel" :disable="args.disable" />',
  }),
}

export const OptionGroup: Story = {
  args: { type: 'checkbox', color: 'primary', inline: false, dense: false, disable: false },
  argTypes: controls(OptionGroupApi, { type: true, color: color(), inline: true, dense: true, disable: true }),
  render: (args) => ({
    components: { QOptionGroup },
    setup: () => {
      const many = ref(['motion', 'contrast'])
      const one = ref('motion')
      return {
        args,
        model: computed({
          get: () => (args.type === 'radio' ? one.value : many.value),
          set: (value: string | string[]) => (Array.isArray(value) ? (many.value = value) : (one.value = value)),
        }),
        options: [
          { label: 'Reduce motion', value: 'motion' },
          { label: 'Increase contrast', value: 'contrast' },
          { label: 'Keyboard hints', value: 'keyboard' },
        ],
      }
    },
    template: '<QOptionGroup v-model="model" :options="options" :type="args.type" :color="args.color" :inline="args.inline" :dense="args.dense" :disable="args.disable" aria-label="Accessibility" />',
  }),
}

export const Slider: Story = {
  args: { min: 0, max: 100, step: 1, color: 'primary', label: false, markers: false, snap: false, vertical: false, disable: false },
  argTypes: controls(SliderApi, { min: true, max: true, step: true, color: color(), label: true, markers: true, snap: true, vertical: true, disable: true }),
  render: (args) => ({
    components: { QSlider },
    setup: () => ({ args, model: ref(64) }),
    template: '<div style="max-width: 24rem; min-height: 8rem; padding-top: 2rem"><QSlider v-model="model" v-bind="args" aria-label="Volume" /></div>',
  }),
}

export const Range: Story = {
  args: { min: 0, max: 100, step: 1, color: 'primary', label: false, markers: false, dragRange: false, disable: false },
  argTypes: controls(RangeApi, { min: true, max: true, step: true, color: color(), label: true, markers: true, dragRange: true, disable: true }),
  render: (args) => ({
    components: { QRange },
    setup: () => ({ args, model: ref({ min: 22, max: 78 }) }),
    template: '<div style="max-width: 24rem; padding-top: 2rem"><QRange v-model="model" v-bind="args" aria-label="Price range" /></div>',
  }),
}
