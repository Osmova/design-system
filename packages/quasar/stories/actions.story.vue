<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import ActionsShowcase from '../../../apps/storybook/demos/ActionsShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Design System / Actions" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="Buttons, groups and FAB">
      <template #default="{ state }">
        <StoryShell
          title="Action primitives"
          description="Focused coverage for grouped actions, dropdown affordances, toggles, and floating entry points."
          :mode="state.mode"
          :variant="state.variant"
        >
          <ActionsShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
