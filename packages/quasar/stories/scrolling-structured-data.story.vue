<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import ScrollingDataShowcase from '../../../apps/storybook/demos/ScrollingDataShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Design System / Scrolling &amp; Structured Data" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="Trees, virtualised rows, static tables and progress">
      <template #default="{ state }">
        <StoryShell
          title="Scrolling &amp; structured data"
          description="Hierarchies, long lists and the static table that is not QTable."
          :mode="state.mode"
          :variant="state.variant"
        >
          <ScrollingDataShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
