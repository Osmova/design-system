import type { Meta, StoryObj } from '@storybook/vue3-vite'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/sora'
import '@fontsource-variable/outfit'
import '@fontsource-variable/red-hat-display'
import '@fontsource-variable/inter'
import FontCandidatePanel from '../../demos/FontCandidatePanel.vue'

// Owner decision panels for T223 — nothing here ships to consumers. The candidate fonts are
// dev-only @fontsource packages (all SIL OFL 1.1) of this Storybook app, never of packages/quasar.
// Set the toolbar Variant to the panel's variant to judge it on its own surface and type ramp.

const meta = {
  title: 'Typography / Variant candidates',
  component: FontCandidatePanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Font choice panels for the v1 typography pass (nothing decided yet — the owner picks).',
          '',
          '**Variant `one`** — One UI-like rounded display candidates: Plus Jakarta Sans, Sora, Outfit, Red Hat Display,',
          'each shown as the display family and as the body face, with an Inter Light 300 body alternative.',
          '',
          '**Variant `glass`** — a system-first stack (SF Pro on Apple devices) plus one free SF-like fallback: **Inter**,',
          'chosen over Geist because its text-size metrics (x-height, apertures) track SF Pro Text closest, it is the most',
          'battle-tested at UI sizes, and it already ships as `@osmova/ds-quasar/fonts/inter.css` — glass would add no new',
          'consumer font file. Geist is OFL too, but more geometric/display-flavoured at text sizes.',
          '',
          'Every panel renders the display heading, title, body, label, numbers and French accents',
          '("cœur, œuvre, élève") at the active variant\'s real type-ramp tokens. All candidate fonts are SIL OFL 1.1.',
        ].join('\n'),
      },
    },
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta

export default meta

type CandidateStory = StoryObj

const shell = (args: Record<string, unknown>, description: string): CandidateStory => ({
  args,
  render: (storyArgs: Record<string, unknown>) => ({
    components: { FontCandidatePanel },
    setup: () => ({ storyArgs }),
    template: '<main class="ods-story-shell"><FontCandidatePanel v-bind="storyArgs" /></main>',
  }),
  parameters: {
    docs: { description: { story: description }, iframeHeight: '860px' },
    controls: { disable: true },
  },
})

const INTER_BODY = "'Inter Variable', 'Inter', system-ui, sans-serif"

export const OnePlusJakartaSans = shell(
  {
    candidate: 'Plus Jakarta Sans',
    target: 'one',
    family: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', system-ui, sans-serif",
    licence: 'SIL OFL 1.1',
    note: 'the rounded One UI-like reference candidate',
    bodyAlternative: INTER_BODY,
  },
  'Variant one: Plus Jakarta Sans as display (and body), with an Inter Light body alternative. Toolbar variant: one.',
)

export const OneSora = shell(
  {
    candidate: 'Sora',
    target: 'one',
    family: "'Sora Variable', 'Sora', system-ui, sans-serif",
    licence: 'SIL OFL 1.1',
    note: 'geometric rounded alternate',
    bodyAlternative: INTER_BODY,
  },
  'Variant one: Sora as display (and body), with an Inter Light body alternative. Toolbar variant: one.',
)

export const OneOutfit = shell(
  {
    candidate: 'Outfit',
    target: 'one',
    family: "'Outfit Variable', 'Outfit', system-ui, sans-serif",
    licence: 'SIL OFL 1.1',
    note: 'clean rounded alternate',
    bodyAlternative: INTER_BODY,
  },
  'Variant one: Outfit as display (and body), with an Inter Light body alternative. Toolbar variant: one.',
)

export const OneRedHatDisplay = shell(
  {
    candidate: 'Red Hat Display',
    target: 'one',
    family: "'Red Hat Display Variable', 'Red Hat Display', system-ui, sans-serif",
    licence: 'SIL OFL 1.1',
    note: 'low-contrast rounded alternate',
    bodyAlternative: INTER_BODY,
  },
  'Variant one: Red Hat Display as display (and body), with an Inter Light body alternative. Toolbar variant: one.',
)

export const GlassSystemFirst = shell(
  {
    candidate: 'System first',
    target: 'glass',
    family: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
    licence: 'no font bundled',
    note: 'SF Pro on Apple devices; a non-Apple capture machine shows its own system-ui face',
  },
  'Variant glass: the system-first stack, nothing bundled. Toolbar variant: glass.',
)

export const GlassInterFallback = shell(
  {
    candidate: 'Inter (SF-like fallback)',
    target: 'glass',
    family: INTER_BODY,
    licence: 'SIL OFL 1.1',
    note: 'closest open SF Pro Text metrics; already bundled as fonts/inter.css',
    shipStack: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter Variable', 'Inter', system-ui, sans-serif",
  },
  'Variant glass: Inter as the free SF-like fallback behind the system stack, shown alone and as shipped. Toolbar variant: glass.',
)
