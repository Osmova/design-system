import type { Meta } from '@storybook/vue3-vite'
import { computed, ref } from 'vue'
import {
  QAvatar,
  QBadge,
  QChip,
  QExpansionItem,
  QIcon,
  QItem,
  QItemLabel,
  QItemSection,
  QList,
  QMarkupTable,
  QSeparator,
  QTable,
  QTimeline,
  QTimelineEntry,
  QTree,
  QVirtualScroll,
} from 'quasar'
import TableApi from 'quasar/dist/api/QTable.json'
import ListApi from 'quasar/dist/api/QList.json'
import ExpansionApi from 'quasar/dist/api/QExpansionItem.json'
import TreeApi from 'quasar/dist/api/QTree.json'
import ChipApi from 'quasar/dist/api/QChip.json'
import BadgeApi from 'quasar/dist/api/QBadge.json'
import TimelineApi from 'quasar/dist/api/QTimeline.json'
import MarkupTableApi from 'quasar/dist/api/QMarkupTable.json'
import CatalogLoadingData from '@gallery/sections/catalog/CatalogLoadingData.vue'
import DataDisplayShowcase from '../../demos/DataDisplayShowcase.vue'
import ScrollingDataShowcase from '../../demos/ScrollingDataShowcase.vue'
import { color, controls, icon, ICONS, showcase, type Story } from '../support/story-kit'

const rows = [
  { id: 1, name: 'Button', family: 'Actions', status: 'Stable', coverage: 96 },
  { id: 2, name: 'Field', family: 'Inputs', status: 'Stable', coverage: 92 },
  { id: 3, name: 'Tabs', family: 'Navigation', status: 'Beta', coverage: 88 },
  { id: 4, name: 'Menu', family: 'Overlays', status: 'Stable', coverage: 90 },
  { id: 5, name: 'Table', family: 'Data', status: 'Beta', coverage: 84 },
  { id: 6, name: 'Stepper', family: 'Navigation', status: 'Alpha', coverage: 71 },
]

const columns = [
  { name: 'name', label: 'Component', field: 'name', align: 'left' as const, sortable: true },
  { name: 'family', label: 'Family', field: 'family', align: 'left' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'left' as const },
  { name: 'coverage', label: 'Coverage', field: 'coverage', align: 'right' as const, sortable: true, format: (value: number) => `${value}%` },
]

const treeNodes = [
  {
    label: 'tokens',
    children: [{ label: 'colour' }, { label: 'space' }, { label: 'radius' }],
  },
  {
    label: 'components',
    children: [{ label: 'button' }, { label: 'field', children: [{ label: 'input' }, { label: 'select' }] }],
  },
]

export default {
  title: 'Components/Data display',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Tables, lists, expansion items, trees, chips, badges, timelines and virtual lists.' } },
  },
} satisfies Meta

export const Showcase = showcase(DataDisplayShowcase, 'Tables, pagination, lists and expansion.')
export const ScrollingShowcase = showcase(ScrollingDataShowcase, 'Trees, virtualised rows, static tables and progress.')
export const Gallery = showcase(CatalogLoadingData, 'The gallery loading and data family.')

export const Table: Story = {
  args: { title: 'Components', dense: false, flat: true, bordered: true, square: false, separator: 'horizontal', wrapCells: false, loading: false, selection: 'none', grid: false, hideBottom: false },
  argTypes: controls(TableApi, { title: true, dense: true, flat: true, bordered: true, square: true, separator: true, wrapCells: true, loading: true, selection: true, grid: true, hideBottom: true }),
  render: (args) => ({
    components: { QTable },
    setup: () => ({ args, rows, columns, selected: ref([rows[1]]) }),
    template: '<QTable v-model:selected="selected" v-bind="args" :rows="rows" :columns="columns" row-key="id" :rows-per-page-options="[0]" />',
  }),
}

export const List: Story = {
  args: { bordered: true, separator: true, dense: false, padding: false, clickable: true, activeIndex: 1 },
  argTypes: {
    clickable: { description: 'Items are clickable (hover and focus states)', control: { type: 'boolean' } },
    activeIndex: { description: 'Index of the active item', control: { type: 'range', min: -1, max: 3 } },
    ...controls(ListApi, { bordered: true, separator: true, dense: true, padding: true }),
  },
  render: (args) => ({
    components: { QAvatar, QIcon, QItem, QItemLabel, QItemSection, QList },
    setup: () => ({
      args,
      items: [
        { title: 'Inbox', caption: '12 unread', icon: ICONS.bell },
        { title: 'Projects', caption: '4 active', icon: ICONS.folder },
        { title: 'Team', caption: '9 members', icon: ICONS.user },
        { title: 'Settings', caption: 'Workspace', icon: ICONS.settings },
      ],
    }),
    template: `
      <QList :bordered="args.bordered" :separator="args.separator" :dense="args.dense" :padding="args.padding" style="max-width: 24rem">
        <QItem v-for="(item, index) in items" :key="item.title" :clickable="args.clickable" :active="index === args.activeIndex">
          <QItemSection avatar><QAvatar size="md"><QIcon :name="item.icon" /></QAvatar></QItemSection>
          <QItemSection>
            <QItemLabel>{{ item.title }}</QItemLabel>
            <QItemLabel caption>{{ item.caption }}</QItemLabel>
          </QItemSection>
        </QItem>
      </QList>`,
  }),
}

export const ExpansionItem: Story = {
  args: { label: 'Advanced settings', caption: 'Three options', open: true, dense: false, switchToggleSide: false, expandSeparator: true, disable: false, icon: 'settings' },
  argTypes: {
    open: { description: 'Expanded state (v-model)', control: { type: 'boolean' } },
    icon: icon(),
    ...controls(ExpansionApi, { label: true, caption: true, dense: true, switchToggleSide: true, expandSeparator: true, disable: true }),
  },
  render: (args) => ({
    components: { QExpansionItem, QList },
    setup: () => ({ args }),
    template: `
      <QList bordered style="max-width: 28rem">
        <QExpansionItem :model-value="args.open" :label="args.label" :caption="args.caption" :icon="args.icon || undefined" :dense="args.dense"
          :switch-toggle-side="args.switchToggleSide" :expand-separator="args.expandSeparator" :disable="args.disable">
          <div class="q-pa-md">Hidden content revealed by the header.</div>
        </QExpansionItem>
        <QExpansionItem label="Notifications" caption="Collapsed" :dense="args.dense">
          <div class="q-pa-md">More content.</div>
        </QExpansionItem>
      </QList>`,
  }),
}

export const Tree: Story = {
  args: { tickStrategy: 'none', dense: false, noConnectors: false, color: 'primary', defaultExpandAll: true },
  argTypes: controls(TreeApi, { tickStrategy: true, dense: true, noConnectors: true, color: color(), defaultExpandAll: true }),
  render: (args) => ({
    components: { QTree },
    setup: () => ({ args, nodes: treeNodes, ticked: ref(['button']), selected: ref('field') }),
    template: '<QTree v-model:ticked="ticked" v-model:selected="selected" v-bind="args" :key="String(args.defaultExpandAll)" :nodes="nodes" node-key="label" />',
  }),
}

export const Chip: Story = {
  args: { label: 'Design tokens', color: '', outline: false, square: false, dense: false, clickable: false, removable: true, selected: false, icon: 'star', disable: false },
  argTypes: {
    icon: icon(),
    ...controls(ChipApi, { label: true, color: { ...color(), options: ['', ...color().options as string[]] }, outline: true, square: true, dense: true, clickable: true, removable: true, selected: true, disable: true }),
  },
  render: (args) => ({
    components: { QChip },
    setup: () => ({ props: computed(() => ({ ...args, color: args.color || undefined, icon: args.icon || undefined, textColor: args.color && !args.outline ? 'white' : undefined })) }),
    template: `
      <div class="qds-story-row">
        <QChip v-bind="props" />
        <QChip :dense="props.dense" :outline="props.outline" label="Neutral" />
        <QChip :dense="props.dense" :outline="props.outline" color="positive" text-color="white" label="Positive" />
      </div>`,
  }),
}

export const Badge: Story = {
  args: { label: 'New', color: 'primary', outline: false, rounded: false, transparent: false, floating: false },
  argTypes: controls(BadgeApi, { label: true, color: color(), outline: true, rounded: true, transparent: true, floating: true }),
  render: (args) => ({
    components: { QBadge, QIcon },
    setup: () => ({ args, icons: ICONS }),
    template: `
      <div class="qds-story-row">
        <QBadge v-bind="args" />
        <span style="position: relative; display: inline-flex; padding: 0.5rem">
          <QIcon :name="icons.bell" size="md" aria-label="Notifications" />
          <QBadge v-bind="args" label="3" floating />
        </span>
      </div>`,
  }),
}

export const Timeline: Story = {
  args: { color: 'primary', side: 'right', layout: 'dense' },
  argTypes: controls(TimelineApi, { color: color(), side: true, layout: true }),
  render: (args) => ({
    components: { QTimeline, QTimelineEntry },
    setup: () => ({ args }),
    template: `
      <QTimeline v-bind="args" style="max-width: 32rem">
        <QTimelineEntry heading>Release 1.0</QTimelineEntry>
        <QTimelineEntry title="Tokens frozen" subtitle="Monday">Token names are final.</QTimelineEntry>
        <QTimelineEntry title="Catalog moved" subtitle="Wednesday" color="positive">Stories render in every variant.</QTimelineEntry>
        <QTimelineEntry title="Release candidate" subtitle="Friday" color="warning">Last call for bug reports.</QTimelineEntry>
      </QTimeline>`,
  }),
}

export const MarkupTable: Story = {
  args: { dense: false, flat: true, bordered: true, square: false, separator: 'horizontal', wrapCells: false },
  argTypes: controls(MarkupTableApi, { dense: true, flat: true, bordered: true, square: true, separator: true, wrapCells: true }),
  render: (args) => ({
    components: { QMarkupTable },
    setup: () => ({ args, rows: rows.slice(0, 4) }),
    template: `
      <QMarkupTable v-bind="args" style="max-width: 36rem">
        <thead><tr><th class="text-left">Component</th><th class="text-left">Family</th><th class="text-right">Coverage</th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row.id"><td>{{ row.name }}</td><td>{{ row.family }}</td><td class="text-right">{{ row.coverage }}%</td></tr></tbody>
      </QMarkupTable>`,
  }),
}

export const VirtualScroll: Story = {
  args: { rows: 2000, separator: true, dense: true },
  argTypes: {
    rows: { description: 'Number of rows in the list', control: { type: 'number', min: 10, max: 100000 } },
    separator: { description: 'Separators between rows', control: { type: 'boolean' } },
    dense: { description: 'Dense rows', control: { type: 'boolean' } },
  },
  render: (args) => ({
    components: { QItem, QItemSection, QSeparator, QVirtualScroll },
    setup: () => ({ args, items: computed(() => Array.from({ length: Number(args.rows) }, (_, index) => `Row ${index + 1}`)) }),
    template: `
      <QVirtualScroll :items="items" style="max-height: 16rem; max-width: 24rem" class="qds-story-demo" tabindex="0" aria-label="Rows" v-slot="{ item, index }">
        <QItem :key="index" :dense="args.dense"><QItemSection>{{ item }}</QItemSection></QItem>
        <QSeparator v-if="args.separator" :key="'s' + index" />
      </QVirtualScroll>`,
  }),
}
