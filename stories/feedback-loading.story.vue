<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import FeedbackShowcase from '../examples/storybook/demos/FeedbackShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Design System / Feedback" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="Notify, banner, skeleton and progress">
      <template #default="{ state }">
        <StoryShell
          title="Feedback surfaces"
          description="Static loading states plus a Notify trigger for plugin-level visual review."
          :mode="state.mode"
          :variant="state.variant"
        >
          <FeedbackShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
