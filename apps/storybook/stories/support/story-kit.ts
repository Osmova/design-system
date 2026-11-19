import type { ArgTypes, StoryObj, VueRenderer } from '@storybook/vue3-vite'
import type { StoryAnnotations } from 'storybook/internal/types'
import type { Component } from 'vue'
import {
  ppArrowRight,
  ppBell,
  ppCaretDown,
  ppFolder,
  ppGear,
  ppHouse,
  ppMagnifyingGlass,
  ppPencilSimple,
  ppPlus,
  ppShareNetwork,
  ppStar,
  ppTrash,
  ppUser,
} from 'quasar-extras-svg-icons/phosphor-icons-v2'

export const ICONS = {
  none: '',
  plus: ppPlus,
  search: ppMagnifyingGlass,
  edit: ppPencilSimple,
  delete: ppTrash,
  share: ppShareNetwork,
  bell: ppBell,
  star: ppStar,
  user: ppUser,
  home: ppHouse,
  folder: ppFolder,
  settings: ppGear,
  'arrow right': ppArrowRight,
  'caret down': ppCaretDown,
}

export const icon = (description = 'Phosphor icon (SVG path)'): NonNullable<ArgTypes[string]> => ({
  description,
  control: { type: 'select' },
  options: Object.keys(ICONS),
  mapping: ICONS,
})

interface ApiProp {
  type: string | string[]
  desc?: string
  values?: string[]
  default?: string
  category?: string
}

export interface QuasarApi {
  props?: Record<string, ApiProp>
}

export type Story = StoryAnnotations<VueRenderer, Record<string, any>>

type Override = NonNullable<ArgTypes[string]> | true

export const ROLE_COLORS = ['primary', 'secondary', 'accent', 'positive', 'negative', 'info', 'warning', 'dark']

const kebab = (name: string) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
const unquote = (value: string) => value.replace(/^'(.*)'$/, '$1')

// Builds Controls from the API description Quasar ships in quasar/dist/api.
export function controls(api: QuasarApi, picks: Record<string, Override>): ArgTypes {
  const argTypes: ArgTypes = {}
  for (const [name, override] of Object.entries(picks)) {
    const prop = api.props?.[kebab(name)]
    if (!prop) throw new Error(`Quasar API has no prop "${kebab(name)}"`)
    const types = [prop.type].flat()
    const options = prop.values?.map(unquote)
    const control = options
      ? { type: 'select' as const }
      : types.includes('Boolean')
        ? { type: 'boolean' as const }
        : types.includes('Number')
          ? { type: 'number' as const }
          : { type: 'text' as const }
    argTypes[name] = {
      description: prop.desc,
      control,
      ...(options ? { options } : {}),
      table: {
        category: prop.category,
        type: { summary: types.join(' | ') },
        ...(prop.default ? { defaultValue: { summary: unquote(prop.default) } } : {}),
      },
      ...(override === true ? {} : override),
    }
  }
  return argTypes
}

export const color = (description = 'Role colour'): NonNullable<ArgTypes[string]> => ({
  description,
  control: { type: 'select' },
  options: ROLE_COLORS,
})

export function showcase(component: Component, description: string): StoryObj {
  return {
    render: () => ({
      components: { Showcase: component },
      template: '<main class="qds-story-shell"><Showcase /></main>',
    }),
    parameters: {
      layout: 'fullscreen',
      controls: { disable: true },
      docs: { description: { story: description }, iframeHeight: '720px' },
    },
  }
}
