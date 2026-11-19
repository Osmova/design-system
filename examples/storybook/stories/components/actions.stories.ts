import type { Meta } from '@storybook/vue3-vite'
import { computed, ref } from 'vue'
import { QBtn, QBtnDropdown, QBtnGroup, QBtnToggle, QFab, QFabAction, QItem, QItemSection, QList } from 'quasar'
import BtnApi from 'quasar/dist/api/QBtn.json'
import BtnDropdownApi from 'quasar/dist/api/QBtnDropdown.json'
import BtnGroupApi from 'quasar/dist/api/QBtnGroup.json'
import BtnToggleApi from 'quasar/dist/api/QBtnToggle.json'
import FabApi from 'quasar/dist/api/QFab.json'
import CatalogActions from '@gallery/sections/catalog/CatalogActions.vue'
import ActionsShowcase from '../../demos/ActionsShowcase.vue'
import { color, controls, icon, ICONS, showcase, type Story } from '../support/story-kit'

const appearance = {
  description: 'Quasar design flag (unelevated, flat, outline, push, glossy are mutually exclusive)',
  control: { type: 'select' as const },
  options: ['unelevated', 'flat', 'outline', 'push', 'glossy', 'standard'],
}

const styled = (args: Record<string, unknown>) => {
  const { appearance: look, ...rest } = args
  return look === 'standard' ? rest : { ...rest, [String(look)]: true }
}

export default {
  title: 'Components/Actions',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Buttons, grouped and segmented actions, dropdowns and the floating action button.',
      },
    },
  },
} satisfies Meta

export const Showcase = showcase(ActionsShowcase, 'Buttons, groups and FAB, ported from the previous catalog.')
export const Gallery = showcase(CatalogActions, 'The gallery action family: buttons, groups, toolbars, bars and ratings.')

export const Button: Story = {
  args: { label: 'Save changes', color: 'primary', appearance: 'unelevated', size: 'md', icon: 'none', iconRight: 'none', noCaps: true, dense: false, round: false, rounded: false, square: false, loading: false, disable: false },
  argTypes: {
    appearance,
    ...controls(BtnApi, {
      label: true,
      color: color(),
      size: { control: { type: 'select' }, options: ['xs', 'sm', 'md', 'lg', 'xl'] },
      icon: icon(),
      iconRight: icon('Icon after the label'),
      noCaps: true,
      dense: true,
      round: true,
      rounded: true,
      square: true,
      loading: true,
      disable: true,
    }),
  },
  render: (args) => ({
    components: { QBtn },
    setup: () => ({ props: computed(() => styled(args)) }),
    template: '<QBtn v-bind="props" :aria-label="props.label || \'Action\'" />',
  }),
}

export const Roles: Story = {
  args: { appearance: 'unelevated', dense: false },
  argTypes: { appearance, ...controls(BtnApi, { dense: true }) },
  render: (args) => ({
    components: { QBtn },
    setup: () => ({ args, roles: ['primary', 'secondary', 'accent', 'positive', 'negative', 'info', 'warning'], look: computed(() => styled({ appearance: args.appearance })) }),
    template: `
      <div class="qds-story-row">
        <QBtn v-for="role in roles" :key="role" v-bind="look" :dense="args.dense" :color="role" :label="role" no-caps />
        <QBtn v-bind="look" :dense="args.dense" label="Disabled" color="primary" disable no-caps />
      </div>`,
  }),
}

export const ButtonGroup: Story = {
  args: { appearance: 'unelevated', spread: false, rounded: false, stretch: false },
  argTypes: {
    appearance: { ...appearance, options: ['unelevated', 'flat', 'outline', 'push', 'glossy', 'standard'] },
    ...controls(BtnGroupApi, { spread: true, rounded: true, stretch: true }),
  },
  render: (args) => ({
    components: { QBtn, QBtnGroup },
    setup: () => ({ props: computed(() => styled(args)) }),
    template: `
      <QBtnGroup v-bind="props">
        <QBtn color="primary" label="One" no-caps />
        <QBtn color="primary" label="Two" no-caps />
        <QBtn color="primary" label="Three" no-caps />
      </QBtnGroup>`,
  }),
}

export const ButtonToggle: Story = {
  args: { appearance: 'unelevated', toggleColor: 'primary', spread: false, rounded: false, dense: false, disable: false },
  argTypes: {
    appearance,
    ...controls(BtnToggleApi, { toggleColor: color('Colour of the selected option'), spread: true, rounded: true, dense: true, disable: true }),
  },
  render: (args) => ({
    components: { QBtnToggle },
    setup: () => ({
      props: computed(() => styled(args)),
      model: ref('weekly'),
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
    }),
    template: '<QBtnToggle v-model="model" v-bind="props" :options="options" no-caps aria-label="Cadence" />',
  }),
}

export const ButtonDropdown: Story = {
  args: { label: 'Actions', color: 'primary', appearance: 'unelevated', split: false, dense: false, disable: false, menuOpen: false },
  argTypes: {
    appearance,
    menuOpen: { description: 'Open the menu (portal) on render', control: { type: 'boolean' } },
    ...controls(BtnDropdownApi, { label: true, color: color(), split: true, dense: true, disable: true }),
  },
  render: (args) => ({
    components: { QBtnDropdown, QItem, QItemSection, QList },
    setup: () => ({ props: computed(() => styled({ ...args, menuOpen: undefined })), open: computed(() => Boolean(args.menuOpen)) }),
    template: `
      <QBtnDropdown v-bind="props" :model-value="open" no-caps>
        <QList dense style="min-width: 180px">
          <QItem v-for="item in ['Duplicate', 'Move', 'Archive']" :key="item" v-close-popup clickable>
            <QItemSection>{{ item }}</QItemSection>
          </QItem>
        </QList>
      </QBtnDropdown>`,
  }),
}

export const FloatingAction: Story = {
  args: { label: 'Create', color: 'accent', direction: 'up', open: true, verticalActionsAlign: 'center', square: false, disable: false },
  argTypes: {
    open: { description: 'Expanded state (v-model)', control: { type: 'boolean' } },
    ...controls(FabApi, { label: true, color: color(), direction: true, verticalActionsAlign: true, square: true, disable: true }),
  },
  render: (args) => ({
    components: { QFab, QFabAction },
    setup: () => ({ args, icons: ICONS }),
    template: `
      <div style="display:flex;align-items:center;justify-content:center;min-height:16rem">
        <QFab :model-value="args.open" :label="args.label" :color="args.color" :direction="args.direction"
          :vertical-actions-align="args.verticalActionsAlign" :square="args.square" :disable="args.disable" :icon="icons.plus" no-caps>
          <QFabAction color="primary" :icon="icons.edit" label="Draft" no-caps />
          <QFabAction color="secondary" :icon="icons.share" label="Share" no-caps />
        </QFab>
      </div>`,
  }),
}
