import type { Meta } from '@storybook/vue3-vite'
import { ref, watch } from 'vue'
import { QBtn, QCard, QCardActions, QCardSection, QDialog, QItem, QItemSection, QList, QMenu, QSeparator, QTooltip } from 'quasar'
import MenuApi from 'quasar/dist/api/QMenu.json'
import DialogApi from 'quasar/dist/api/QDialog.json'
import TooltipApi from 'quasar/dist/api/QTooltip.json'
import MediaOverlaysShowcase from '../../demos/MediaOverlaysShowcase.vue'
import { controls, showcase, type Story } from '../support/story-kit'

const open = { description: 'Open state (v-model); the surface renders in a body portal', control: { type: 'boolean' as const } }

export default {
  title: 'Components/Overlays',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: 'Menus, dialogs and tooltips. All of them portal to `document.body`, which the controller paints.' },
      iframeHeight: '520px',
    },
  },
} satisfies Meta

export const Showcase = showcase(MediaOverlaysShowcase, 'Media frames, gesture rows, transient overlays and plugin surfaces.')

export const Menu: Story = {
  args: { open: true, anchor: 'bottom left', self: 'top left', fit: false, square: false, dense: false },
  argTypes: {
    open,
    dense: { description: 'Dense list inside the menu', control: { type: 'boolean' } },
    ...controls(MenuApi, { anchor: true, self: true, fit: true, square: true }),
  },
  render: (args) => ({
    components: { QBtn, QItem, QItemSection, QList, QMenu, QSeparator },
    setup: () => {
      const model = ref(Boolean(args.open))
      watch(() => args.open, (value) => (model.value = Boolean(value)))
      return { args, model }
    },
    template: `
      <div style="min-height: 16rem">
        <QBtn color="primary" label="Workspace" unelevated no-caps>
          <QMenu v-model="model" :anchor="args.anchor" :self="args.self" :fit="args.fit" :square="args.square">
            <QList :dense="args.dense" style="min-width: 12rem">
              <QItem v-close-popup clickable><QItemSection>Rename</QItemSection></QItem>
              <QItem v-close-popup clickable><QItemSection>Duplicate</QItemSection></QItem>
              <QSeparator />
              <QItem v-close-popup clickable class="text-negative"><QItemSection>Delete</QItemSection></QItem>
            </QList>
          </QMenu>
        </QBtn>
      </div>`,
  }),
}

export const Dialog: Story = {
  args: { open: true, position: 'standard', persistent: false, maximized: false, fullWidth: false, seamless: false, square: false },
  argTypes: { open, ...controls(DialogApi, { position: true, persistent: true, maximized: true, fullWidth: true, seamless: true, square: true }) },
  render: (args) => ({
    components: { QBtn, QCard, QCardActions, QCardSection, QDialog },
    setup: () => {
      const model = ref(Boolean(args.open))
      watch(() => args.open, (value) => (model.value = Boolean(value)))
      return { args, model }
    },
    template: `
      <div>
        <QBtn color="primary" label="Open dialog" unelevated no-caps @click="model = true" />
        <QDialog v-model="model" :position="args.position" :persistent="args.persistent" :maximized="args.maximized"
          :full-width="args.fullWidth" :seamless="args.seamless" :square="args.square" aria-labelledby="sb-dialog-title">
          <QCard style="min-width: 20rem">
            <QCardSection><div id="sb-dialog-title" class="text-h6">Discard draft?</div></QCardSection>
            <QCardSection class="q-pt-none">The draft has unsaved token overrides.</QCardSection>
            <QCardActions align="right">
              <QBtn v-close-popup flat color="primary" label="Cancel" no-caps />
              <QBtn v-close-popup unelevated color="negative" label="Discard" no-caps />
            </QCardActions>
          </QCard>
        </QDialog>
      </div>`,
  }),
}

export const Tooltip: Story = {
  args: { open: true, text: 'Copies the share link', anchor: 'bottom middle', self: 'top middle', delay: 0 },
  argTypes: {
    open,
    text: { description: 'Tooltip content', control: { type: 'text' } },
    ...controls(TooltipApi, { anchor: true, self: true, delay: true }),
  },
  render: (args) => ({
    components: { QBtn, QTooltip },
    setup: () => {
      const model = ref(Boolean(args.open))
      watch(() => args.open, (value) => (model.value = Boolean(value)))
      return { args, model }
    },
    template: `
      <div style="min-height: 8rem; padding: 1rem">
        <QBtn outline color="primary" label="Share" no-caps>
          <QTooltip v-model="model" :anchor="args.anchor" :self="args.self" :delay="args.delay">{{ args.text }}</QTooltip>
        </QBtn>
      </div>`,
  }),
}
