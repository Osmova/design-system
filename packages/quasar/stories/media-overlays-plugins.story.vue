<script setup lang="ts">
import { DESIGN_SYSTEM_VARIANTS, type DesignSystemMode, type DesignSystemVariantName } from '../src'
import MediaOverlaysShowcase from '../../../apps/storybook/demos/MediaOverlaysShowcase.vue'
import StoryShell from './_shared/StoryShell.vue'

const modeOptions: DesignSystemMode[] = ['light', 'dark', 'system']
const variantOptions = Object.keys(DESIGN_SYSTEM_VARIANTS) as Array<Extract<DesignSystemVariantName, string>>
const initState = () => ({ mode: 'light' as DesignSystemMode, variant: 'win' as DesignSystemVariantName })
</script>

<template>
  <Story title="Design System / Media, Overlays &amp; Plugins" :layout="{ type: 'single', iframe: true }" :init-state="initState">
    <Variant title="Media frames, transient overlays and global plugins">
      <template #default="{ state }">
        <StoryShell
          title="Media, overlays &amp; plugins"
          description="Media frames, gesture rows, transient overlays and the plugin surfaces that leave the component tree."
          :mode="state.mode"
          :variant="state.variant"
        >
          <MediaOverlaysShowcase />
        </StoryShell>
      </template>

      <template #controls="{ state }">
        <HstSelect v-model="state.mode" title="Mode" :options="modeOptions" />
        <HstSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      </template>
    </Variant>
  </Story>
</template>
