<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import StructureIdentityShowcase from '../examples/storybook/demos/StructureIdentityShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Design System / Structure &amp; Identity" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="Chrome, identity and grouped structure">
      <template #default="{ state }">
        <StoryShell
          title="Structure &amp; identity"
          description="Window chrome, identity marks, wayfinding and the containers that group them."
          :mode="state.mode"
          :variant="state.variant"
        >
          <StructureIdentityShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
