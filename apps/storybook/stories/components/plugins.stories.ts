import type { Meta } from '@storybook/vue3-vite'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { BottomSheet, Dialog, Loading, LoadingBar, Notify, QBtn } from 'quasar'
import PluginsSection from '@gallery/sections/PluginsSection.vue'
import { color, ICONS, showcase, type Story } from '../support/story-kit'

type Close = () => void

// Opens a plugin surface on mount, reopens it when Controls change and closes it on unmount.
function live(args: Record<string, unknown>, open: () => Close) {
  let close: Close | undefined
  const reopen = () => {
    close?.()
    close = open()
  }
  onMounted(reopen)
  watch(() => ({ ...args }), reopen)
  onBeforeUnmount(() => close?.())
  return reopen
}

const text = (description: string) => ({ description, control: { type: 'text' as const } })
const flag = (description: string) => ({ description, control: { type: 'boolean' as const } })

export default {
  title: 'Components/Plugins',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: 'Quasar plugins render outside the story tree, in body portals that follow the toolbar globals.' },
      iframeHeight: '520px',
    },
  },
} satisfies Meta

export const Gallery = showcase(PluginsSection, 'The gallery plugin bench: Notify, Dialog, BottomSheet, Loading and LoadingBar.')

export const NotifyPlugin: Story = {
  name: 'Notify',
  args: { type: 'info', message: 'Changes saved', caption: 'Synced with the workspace', position: 'bottom', actions: true, progress: false, multiLine: false },
  argTypes: {
    type: { description: 'Notify type', control: { type: 'select' }, options: ['positive', 'negative', 'warning', 'info', 'ongoing'] },
    message: text('Message'),
    caption: text('Caption'),
    position: { description: 'Screen position', control: { type: 'select' }, options: ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'] },
    actions: flag('Show actions'),
    progress: flag('Show the timeout progress bar'),
    multiLine: flag('Multi-line layout'),
  },
  render: (args) => ({
    components: { QBtn },
    setup: () => ({
      show: live(args, () => Notify.create({
        type: String(args.type),
        message: String(args.message),
        caption: String(args.caption),
        position: args.position as 'bottom',
        progress: Boolean(args.progress),
        multiLine: Boolean(args.multiLine),
        timeout: 0,
        actions: args.actions ? [{ label: 'Undo', color: 'white', noCaps: true }, { label: 'Dismiss', color: 'white', noCaps: true }] : [],
      })),
    }),
    template: '<QBtn color="primary" label="Show again" unelevated no-caps @click="show" />',
  }),
}

export const DialogPlugin: Story = {
  name: 'Dialog',
  args: { title: 'Rename workspace', message: 'Choose a short, recognisable name.', prompt: true, cancel: true, persistent: false, focus: 'ok' },
  argTypes: {
    title: text('Title'),
    message: text('Message'),
    prompt: flag('Ask for a value'),
    cancel: flag('Show a cancel button'),
    persistent: flag('Ignore outside clicks and Escape'),
    focus: { description: 'Initially focused element', control: { type: 'select' }, options: ['ok', 'cancel', 'none'] },
  },
  render: (args) => ({
    components: { QBtn },
    setup: () => ({
      show: live(args, () => {
        const dialog = Dialog.create({
          title: String(args.title),
          message: String(args.message),
          cancel: Boolean(args.cancel),
          persistent: Boolean(args.persistent),
          focus: args.focus as 'ok',
          ...(args.prompt ? { prompt: { model: 'Design system', type: 'text', outlined: true } } : {}),
        })
        return () => dialog.hide()
      }),
    }),
    template: '<QBtn color="primary" label="Open again" unelevated no-caps @click="show" />',
  }),
}

export const BottomSheetPlugin: Story = {
  name: 'BottomSheet',
  args: { title: 'Share', grid: false },
  argTypes: { title: text('Title'), grid: flag('Grid layout') },
  render: (args) => ({
    components: { QBtn },
    setup: () => ({
      show: live(args, () => {
        const sheet = BottomSheet.create({
          title: String(args.title),
          grid: Boolean(args.grid),
          actions: [
            { label: 'Copy link', icon: ICONS.share, id: 'link' },
            { label: 'Email', icon: ICONS.bell, id: 'email' },
            {},
            { label: 'Open folder', icon: ICONS.folder, id: 'folder' },
          ],
        })
        return () => sheet.hide()
      }),
    }),
    template: '<QBtn color="primary" label="Open again" unelevated no-caps @click="show" />',
  }),
}

export const LoadingPlugin: Story = {
  name: 'Loading',
  args: { message: 'Preparing preview…', spinnerColor: 'primary', duration: 1500 },
  argTypes: {
    message: text('Message'),
    spinnerColor: color('Spinner colour'),
    duration: { description: 'Milliseconds before hiding', control: { type: 'number', min: 500, max: 10000, step: 500 } },
  },
  render: (args) => ({
    components: { QBtn },
    setup: () => {
      let timer: ReturnType<typeof setTimeout> | undefined
      const hide = () => {
        clearTimeout(timer)
        Loading.hide()
      }
      onBeforeUnmount(hide)
      return {
        show: () => {
          hide()
          Loading.show({ message: String(args.message), spinnerColor: String(args.spinnerColor) })
          timer = setTimeout(hide, Number(args.duration))
        },
      }
    },
    template: '<QBtn color="primary" label="Show loading" unelevated no-caps @click="show" />',
  }),
}

export const LoadingBarPlugin: Story = {
  name: 'LoadingBar',
  args: { color: 'primary', size: '4px', position: 'top' },
  argTypes: {
    color: color('Bar colour'),
    size: text('Bar thickness'),
    position: { description: 'Edge', control: { type: 'select' }, options: ['top', 'right', 'bottom', 'left'] },
  },
  render: (args) => ({
    components: { QBtn },
    setup: () => {
      onBeforeUnmount(() => LoadingBar.stop())
      return {
        start: () => {
          LoadingBar.setDefaults({ color: String(args.color), size: String(args.size), position: args.position as 'top' })
          LoadingBar.start()
        },
        stop: () => LoadingBar.stop(),
      }
    },
    template: `
      <div class="ods-story-row">
        <QBtn color="primary" label="Start" unelevated no-caps @click="start" />
        <QBtn color="primary" label="Stop" outline no-caps @click="stop" />
      </div>`,
  }),
}
