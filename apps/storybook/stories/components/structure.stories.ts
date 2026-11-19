import type { Meta } from '@storybook/vue3-vite'
import { ref } from 'vue'
import {
  QAvatar,
  QBar,
  QBtn,
  QCard,
  QCardActions,
  QCardSection,
  QScrollArea,
  QSeparator,
  QSpace,
  QSplitter,
  QToolbar,
  QToolbarTitle,
} from 'quasar'
import CardApi from 'quasar/dist/api/QCard.json'
import ToolbarApi from 'quasar/dist/api/QToolbar.json'
import AvatarApi from 'quasar/dist/api/QAvatar.json'
import SeparatorApi from 'quasar/dist/api/QSeparator.json'
import SplitterApi from 'quasar/dist/api/QSplitter.json'
import BarApi from 'quasar/dist/api/QBar.json'
import CatalogIdentity from '@gallery/sections/catalog/CatalogIdentity.vue'
import CatalogIntro from '@gallery/sections/catalog/CatalogIntro.vue'
import StructureIdentityShowcase from '../../demos/StructureIdentityShowcase.vue'
import { color, controls, icon, ICONS, showcase, type Story } from '../support/story-kit'

export default {
  title: 'Components/Structure',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Cards, toolbars, bars, avatars, separators, splitters and scroll areas.' } },
  },
} satisfies Meta

export const Showcase = showcase(StructureIdentityShowcase, 'Window chrome, identity marks, wayfinding and grouping containers.')
export const GalleryIntro = showcase(CatalogIntro, 'The gallery wayfinding family: badges, banners and breadcrumbs.')
export const GalleryIdentity = showcase(CatalogIdentity, 'The gallery identity family: avatars and tabs.')

export const Card: Story = {
  args: { flat: false, bordered: true, square: false, title: 'Quarterly report', body: 'Revenue grew 12% against the same period last year.', actions: true },
  argTypes: {
    title: { description: 'Card title', control: { type: 'text' } },
    body: { description: 'Card body text', control: { type: 'text' } },
    actions: { description: 'Show the actions row', control: { type: 'boolean' } },
    ...controls(CardApi, { flat: true, bordered: true, square: true }),
  },
  render: (args) => ({
    components: { QBtn, QCard, QCardActions, QCardSection, QSeparator },
    setup: () => ({ args }),
    template: `
      <QCard :flat="args.flat" :bordered="args.bordered" :square="args.square" style="max-width: 24rem">
        <QCardSection><div class="text-h6">{{ args.title }}</div><div class="text-caption">Updated today</div></QCardSection>
        <QCardSection class="q-pt-none">{{ args.body }}</QCardSection>
        <template v-if="args.actions">
          <QSeparator />
          <QCardActions align="right">
            <QBtn flat color="primary" label="Share" no-caps />
            <QBtn unelevated color="primary" label="Open" no-caps />
          </QCardActions>
        </template>
      </QCard>`,
  }),
}

export const Toolbar: Story = {
  args: { title: 'Workspace', role: 'none', inset: false, dense: false },
  argTypes: {
    title: { description: 'Toolbar title', control: { type: 'text' } },
    role: { description: 'Background role class', control: { type: 'select' }, options: ['none', 'primary', 'secondary', 'dark'] },
    ...controls(ToolbarApi, { inset: true }),
    dense: { description: 'Dense buttons inside the toolbar', control: { type: 'boolean' } },
  },
  render: (args) => ({
    components: { QBtn, QToolbar, QToolbarTitle },
    setup: () => ({ args, icons: ICONS }),
    template: `
      <QToolbar :class="args.role === 'none' ? '' : 'bg-' + args.role + ' text-white'" :inset="args.inset">
        <QBtn flat round :dense="args.dense" :icon="icons.home" aria-label="Home" />
        <QToolbarTitle>{{ args.title }}</QToolbarTitle>
        <QBtn flat round :dense="args.dense" :icon="icons.search" aria-label="Search" />
        <QBtn flat round :dense="args.dense" :icon="icons.bell" aria-label="Notifications" />
      </QToolbar>`,
  }),
}

export const Bar: Story = {
  args: { dense: false, dark: false },
  argTypes: controls(BarApi, { dense: true, dark: true }),
  render: (args) => ({
    components: { QBar, QBtn, QSpace },
    setup: () => ({ args, icons: ICONS }),
    template: `
      <QBar v-bind="args" style="max-width: 32rem">
        <div>Document.txt</div>
        <QSpace />
        <QBtn dense flat :icon="icons.share" aria-label="Share" />
        <QBtn dense flat :icon="icons.settings" aria-label="Settings" />
      </QBar>`,
  }),
}

export const Avatar: Story = {
  args: { size: '48px', color: 'primary', textColor: 'white', square: false, rounded: false, content: 'initials', icon: 'user' },
  argTypes: {
    content: { description: 'Avatar content', control: { type: 'inline-radio' }, options: ['initials', 'icon'] },
    icon: icon(),
    ...controls(AvatarApi, { size: true, color: color(), textColor: { ...color('Text colour'), options: ['white', 'dark', 'primary'] }, square: true, rounded: true }),
  },
  render: (args) => ({
    components: { QAvatar },
    setup: () => ({ args }),
    template: `
      <div class="ods-story-row">
        <QAvatar :size="args.size" :color="args.color" :text-color="args.textColor" :square="args.square" :rounded="args.rounded"
          :icon="args.content === 'icon' ? args.icon : undefined">{{ args.content === 'initials' ? 'AV' : '' }}</QAvatar>
        <QAvatar :size="args.size" :square="args.square" :rounded="args.rounded" color="secondary" text-color="white">JD</QAvatar>
      </div>`,
  }),
}

export const Separator: Story = {
  args: { spaced: 'md', inset: false, vertical: false, color: '', size: '' },
  argTypes: controls(SeparatorApi, { spaced: true, inset: true, vertical: true, color: { ...color(), options: ['', 'primary', 'secondary', 'grey-4'] }, size: true }),
  render: (args) => ({
    components: { QSeparator },
    setup: () => ({ args }),
    template: `
      <div :style="args.vertical ? 'display:flex;align-items:stretch;height:6rem' : 'max-width:24rem'">
        <span>Above</span>
        <QSeparator :spaced="args.spaced" :inset="args.inset" :vertical="args.vertical" :color="args.color || undefined" :size="args.size || undefined" />
        <span>Below</span>
      </div>`,
  }),
}

export const Splitter: Story = {
  args: { horizontal: false, limits: [20, 80], disable: false },
  argTypes: controls(SplitterApi, { horizontal: true, limits: { control: { type: 'object' } }, disable: true }),
  render: (args) => ({
    components: { QSplitter },
    setup: () => ({ args, model: ref(38) }),
    template: `
      <QSplitter v-model="model" :horizontal="args.horizontal" :limits="args.limits" :disable="args.disable" class="ods-story-demo" style="height: 14rem">
        <template #before><div class="q-pa-md">Navigation pane</div></template>
        <template #after><div class="q-pa-md">Content pane</div></template>
      </QSplitter>`,
  }),
}

export const ScrollArea: Story = {
  args: { visible: true, paragraphs: 12 },
  argTypes: {
    visible: { description: 'Always show the scrollbar', control: { type: 'boolean' } },
    paragraphs: { description: 'Amount of content', control: { type: 'range', min: 1, max: 40 } },
  },
  render: (args) => ({
    components: { QScrollArea },
    setup: () => ({ args }),
    template: `
      <QScrollArea :visible="args.visible" class="ods-story-demo" style="height: 12rem; max-width: 24rem" tabindex="0" aria-label="Release notes">
        <p v-for="n in args.paragraphs" :key="n">Paragraph {{ n }}: token updates and component fixes.</p>
      </QScrollArea>`,
  }),
}

