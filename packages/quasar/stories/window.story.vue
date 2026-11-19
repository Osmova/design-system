<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import WindowShowcase from '../../../apps/storybook/demos/WindowShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Optional / QWindow" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="Embedded QDS window">
      <template #default="{ state }">
        <StoryShell
          title="Optional window"
          description="An embedded optional-module surface with a reliable close and reopen path."
          :mode="state.mode"
          :variant="state.variant"
        >
          <WindowShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
