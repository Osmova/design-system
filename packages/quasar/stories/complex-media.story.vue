<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import ComplexMediaShowcase from '../../../apps/storybook/demos/ComplexMediaShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Design System / Complex & Media" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="Stepper, media, ratings, plugins and rich-content shells">
      <template #default="{ state }">
        <StoryShell
          title="Complex & media states"
          description="Representative local parity proofs for flow, media, and rich-content states—not an exhaustive gallery fixture."
          :mode="state.mode"
          :variant="state.variant"
        >
          <ComplexMediaShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
