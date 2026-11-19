import type { Meta } from '@storybook/vue3-vite'
import { ref } from 'vue'
import { QBreadcrumbs, QBreadcrumbsEl, QPagination, QStep, QStepper, QStepperNavigation, QBtn, QTab, QTabPanel, QTabPanels, QTabs } from 'quasar'
import TabsApi from 'quasar/dist/api/QTabs.json'
import BreadcrumbsApi from 'quasar/dist/api/QBreadcrumbs.json'
import PaginationApi from 'quasar/dist/api/QPagination.json'
import StepperApi from 'quasar/dist/api/QStepper.json'
import NavigationShowcase from '../../demos/NavigationShowcase.vue'
import { color, controls, ICONS, showcase, type Story } from '../support/story-kit'

export default {
  title: 'Components/Navigation',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Tabs and panels, breadcrumbs, pagination and steppers.' } },
  },
} satisfies Meta

export const Showcase = showcase(NavigationShowcase, 'Tabs, panels, menus, drawers and modal overlays.')

export const Tabs: Story = {
  args: { tabs: 4, align: 'left', dense: false, inlineLabel: false, narrowIndicator: false, vertical: false, activeColor: 'primary', indicatorColor: 'primary', disabledLast: true, icons: false },
  argTypes: {
    tabs: { description: 'Number of tabs', control: { type: 'range', min: 2, max: 8 } },
    disabledLast: { description: 'Disable the last tab', control: { type: 'boolean' } },
    icons: { description: 'Show an icon in each tab', control: { type: 'boolean' } },
    ...controls(TabsApi, { align: true, dense: true, inlineLabel: true, narrowIndicator: true, vertical: true, activeColor: color(), indicatorColor: color() }),
  },
  render: (args) => ({
    components: { QTab, QTabPanel, QTabPanels, QTabs },
    setup: () => ({ args, model: ref('tab-1'), icons: [ICONS.home, ICONS.folder, ICONS.bell, ICONS.settings, ICONS.user, ICONS.star, ICONS.share, ICONS.search] }),
    template: `
      <div :style="args.vertical ? 'display:flex;gap:1rem' : ''">
        <QTabs v-model="model" :align="args.align" :dense="args.dense" :inline-label="args.inlineLabel" :narrow-indicator="args.narrowIndicator"
          :vertical="args.vertical" :active-color="args.activeColor" :indicator-color="args.indicatorColor" no-caps>
          <QTab v-for="n in args.tabs" :key="n" :name="'tab-' + n" :label="'Section ' + n" :icon="args.icons ? icons[n - 1] : undefined"
            :disable="args.disabledLast && n === args.tabs" />
        </QTabs>
        <QTabPanels v-model="model" animated>
          <QTabPanel v-for="n in args.tabs" :key="n" :name="'tab-' + n">Panel {{ n }} content.</QTabPanel>
        </QTabPanels>
      </div>`,
  }),
}

export const Breadcrumbs: Story = {
  args: { separator: '/', gutter: 'sm', activeColor: 'primary', icons: true },
  argTypes: {
    icons: { description: 'Show icons on the crumbs', control: { type: 'boolean' } },
    ...controls(BreadcrumbsApi, { separator: true, gutter: true, activeColor: color() }),
  },
  render: (args) => ({
    components: { QBreadcrumbs, QBreadcrumbsEl },
    setup: () => ({ args, icons: ICONS }),
    template: `
      <QBreadcrumbs :separator="args.separator" :gutter="args.gutter" :active-color="args.activeColor">
        <QBreadcrumbsEl label="Home" :icon="args.icons ? icons.home : undefined" href="#" />
        <QBreadcrumbsEl label="Projects" :icon="args.icons ? icons.folder : undefined" href="#" />
        <QBreadcrumbsEl label="Design system" />
      </QBreadcrumbs>`,
  }),
}

export const Pagination: Story = {
  args: { max: 12, maxPages: 6, color: 'primary', activeColor: 'primary', directionLinks: true, boundaryLinks: false, boundaryNumbers: true, input: false, flat: false, outline: false, unelevated: false, rounded: false, size: 'md', disable: false },
  argTypes: controls(PaginationApi, { max: true, maxPages: true, color: color(), activeColor: color(), directionLinks: true, boundaryLinks: true, boundaryNumbers: true, input: true, flat: true, outline: true, unelevated: true, rounded: true, size: true, disable: true }),
  render: (args) => ({
    components: { QPagination },
    setup: () => ({ args, model: ref(4) }),
    template: '<QPagination v-model="model" v-bind="args" />',
  }),
}

export const Stepper: Story = {
  args: { vertical: false, flat: false, bordered: false, alternativeLabels: false, headerNav: true, contracted: false, activeColor: 'primary', doneColor: 'positive' },
  argTypes: controls(StepperApi, { vertical: true, flat: true, bordered: true, alternativeLabels: true, headerNav: true, contracted: true, activeColor: color(), doneColor: color() }),
  render: (args) => ({
    components: { QBtn, QStep, QStepper, QStepperNavigation },
    setup: () => ({ args, step: ref(2) }),
    template: `
      <QStepper v-model="step" v-bind="args" animated>
        <QStep :name="1" title="Account" :done="step > 1">Choose an account.</QStep>
        <QStep :name="2" title="Workspace" caption="Optional" :done="step > 2">Name the workspace.</QStep>
        <QStep :name="3" title="Review" :error="false">Check the summary.</QStep>
        <template #navigation>
          <QStepperNavigation class="ods-story-row">
            <QBtn color="primary" :label="step === 3 ? 'Finish' : 'Continue'" no-caps unelevated @click="step = step === 3 ? 1 : step + 1" />
            <QBtn v-if="step > 1" flat color="primary" label="Back" no-caps @click="step--" />
          </QStepperNavigation>
        </template>
      </QStepper>`,
  }),
}
