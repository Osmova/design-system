<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import OverviewShowcase from '../../../apps/storybook/demos/OverviewShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Design System / Overview" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="QDS catalog">
      <template #default="{ state }">
        <StoryShell
          title="Quasar Design System"
          description="Neutral-first components over Quasar 2 primitives."
          :mode="state.mode"
          :variant="state.variant"
        >
          <OverviewShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
