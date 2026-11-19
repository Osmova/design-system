<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import DataDisplayShowcase from '../../../apps/storybook/demos/DataDisplayShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Design System / Data Display" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="Tables, pagination, lists and expansion">
      <template #default="{ state }">
        <StoryShell
          title="Structured content"
          description="Deterministic table, pagination, list, and expansion states for visual parity checks."
          :mode="state.mode"
          :variant="state.variant"
        >
          <DataDisplayShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
