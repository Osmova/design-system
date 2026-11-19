import type { Meta } from '@storybook/vue3-vite'
import { computed } from 'vue'
import {
  QBanner,
  QBtn,
  QCircularProgress,
  QIcon,
  QInnerLoading,
  QLinearProgress,
  QSkeleton,
  QSpinner,
  QSpinnerBars,
  QSpinnerDots,
  QSpinnerGears,
  QSpinnerHourglass,
  QSpinnerIos,
  QSpinnerOval,
  QSpinnerPuff,
  QSpinnerRings,
  QSpinnerTail,
} from 'quasar'
import BannerApi from 'quasar/dist/api/QBanner.json'
import LinearApi from 'quasar/dist/api/QLinearProgress.json'
import CircularApi from 'quasar/dist/api/QCircularProgress.json'
import SpinnerApi from 'quasar/dist/api/QSpinner.json'
import SkeletonApi from 'quasar/dist/api/QSkeleton.json'
import InnerLoadingApi from 'quasar/dist/api/QInnerLoading.json'
import FeedbackShowcase from '../../demos/FeedbackShowcase.vue'
import { color, controls, ICONS, showcase, type Story } from '../support/story-kit'

const SPINNERS = { default: QSpinner, bars: QSpinnerBars, dots: QSpinnerDots, gears: QSpinnerGears, hourglass: QSpinnerHourglass, ios: QSpinnerIos, oval: QSpinnerOval, puff: QSpinnerPuff, rings: QSpinnerRings, tail: QSpinnerTail }

export default {
  title: 'Components/Feedback',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Banners, progress, spinners, skeletons and loading overlays.' } },
  },
} satisfies Meta

export const Showcase = showcase(FeedbackShowcase, 'Static loading states plus a Notify trigger.')

export const Banner: Story = {
  args: { text: 'You are offline. Changes will sync when the connection returns.', role: 'warning', dense: false, rounded: true, inlineActions: false, actions: true, icon: true },
  argTypes: {
    text: { description: 'Banner message', control: { type: 'text' } },
    role: { description: 'Role class applied to the banner (`bg-*`, `text-*` or none)', control: { type: 'select' }, options: ['none', 'info', 'warning', 'negative', 'positive'] },
    actions: { description: 'Show the action slot', control: { type: 'boolean' } },
    icon: { description: 'Show the avatar slot', control: { type: 'boolean' } },
    ...controls(BannerApi, { dense: true, rounded: true, inlineActions: true }),
  },
  render: (args) => ({
    components: { QBanner, QBtn, QIcon },
    setup: () => ({ args, icons: ICONS, roleClass: computed(() => (args.role === 'none' ? '' : `bg-${args.role} text-white`)) }),
    template: `
      <QBanner :class="roleClass" :dense="args.dense" :rounded="args.rounded" :inline-actions="args.inlineActions" style="max-width: 40rem">
        <template v-if="args.icon" #avatar><QIcon :name="icons.bell" size="sm" /></template>
        {{ args.text }}
        <template v-if="args.actions" #action>
          <QBtn flat label="Dismiss" no-caps />
          <QBtn flat label="Retry" no-caps />
        </template>
      </QBanner>`,
  }),
}

export const LinearProgress: Story = {
  args: { value: 0.64, buffer: 0.8, indeterminate: false, query: false, stripe: false, rounded: true, size: '8px', color: 'primary', trackColor: '', reverse: false },
  argTypes: {
    value: { description: 'Progress value (0..1)', control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    buffer: { description: 'Buffer value (0..1)', control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    ...controls(LinearApi, { indeterminate: true, query: true, stripe: true, rounded: true, size: true, color: color(), trackColor: { ...color('Track colour'), options: ['', 'grey-3', 'primary', 'secondary'] }, reverse: true }),
  },
  render: (args) => ({
    components: { QLinearProgress },
    setup: () => ({ args }),
    template: '<QLinearProgress v-bind="args" style="max-width: 28rem" aria-label="Upload progress" />',
  }),
}

export const CircularProgress: Story = {
  args: { value: 64, indeterminate: false, showValue: true, size: '5rem', thickness: 0.2, color: 'primary', trackColor: 'grey-3', rounded: false, reverse: false },
  argTypes: {
    value: { description: 'Progress value (0..100)', control: { type: 'range', min: 0, max: 100 } },
    ...controls(CircularApi, { indeterminate: true, showValue: true, size: true, thickness: { control: { type: 'range', min: 0, max: 1, step: 0.05 } }, color: color(), trackColor: { ...color('Track colour'), options: ['grey-3', 'transparent', 'primary', 'secondary'] }, rounded: true, reverse: true }),
  },
  render: (args) => ({
    components: { QCircularProgress },
    setup: () => ({ args }),
    template: '<QCircularProgress v-bind="args" aria-label="Sync progress">{{ args.value }}%</QCircularProgress>',
  }),
}

export const Spinner: Story = {
  args: { type: 'default', size: '3em', color: 'primary' },
  argTypes: {
    type: { description: 'One of the Quasar spinner components', control: { type: 'select' }, options: Object.keys(SPINNERS) },
    ...controls(SpinnerApi, { size: true, color: color() }),
  },
  render: (args) => ({
    setup: () => ({ args, spinner: computed(() => SPINNERS[args.type as keyof typeof SPINNERS]) }),
    template: '<component :is="spinner" :size="args.size" :color="args.color" role="status" aria-label="Loading" />',
  }),
}

export const Skeleton: Story = {
  args: { type: 'rect', animation: 'wave', square: false, bordered: false, size: '', width: '100%', height: '' },
  argTypes: controls(SkeletonApi, { type: true, animation: true, square: true, bordered: true, size: true, width: true, height: true }),
  render: (args) => ({
    components: { QSkeleton },
    setup: () => ({ args }),
    template: `
      <div class="qds-story-stack" style="max-width: 24rem">
        <QSkeleton v-bind="args" />
        <QSkeleton type="text" :animation="args.animation" />
        <QSkeleton type="text" width="60%" :animation="args.animation" />
      </div>`,
  }),
}

export const InnerLoading: Story = {
  args: { showing: true, label: 'Refreshing…', color: 'primary', size: '42px', dark: false },
  argTypes: controls(InnerLoadingApi, { showing: true, label: true, color: color(), size: true, dark: true }),
  render: (args) => ({
    components: { QInnerLoading },
    setup: () => ({ args }),
    template: `
      <div class="qds-story-demo" style="position: relative; max-width: 24rem; min-height: 9rem">
        <p>Quarterly summary is being recalculated.</p>
        <QInnerLoading v-bind="args" />
      </div>`,
  }),
}
