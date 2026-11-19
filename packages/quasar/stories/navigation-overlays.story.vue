<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import NavigationShowcase from '../../../apps/storybook/demos/NavigationShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Design System / Navigation" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="Tabs, panels, dialog and menu">
      <template #default="{ state }">
        <StoryShell
          title="Navigation states"
          description="Tabs, panels, menus, drawers, and modal overlays use tokenized chrome across ODS variants."
          :mode="state.mode"
          :variant="state.variant"
        >
          <NavigationShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
