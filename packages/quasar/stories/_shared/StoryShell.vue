<script setup lang="ts">
import { computed, watch } from 'vue'
import { QBadge, QSelect } from 'quasar'
import {
  DESIGN_SYSTEM_VARIANTS,
  SHADCN_BASE_COLORS,
  type ShadcnBaseColor,
  useDesignSystem,
  type DesignSystemMode,
  type DesignSystemVariantName,
} from '../../src'

const props = defineProps<{
  title: string
  description?: string
  mode: DesignSystemMode
  variant: DesignSystemVariantName
}>()

const designSystem = useDesignSystem()

watch(() => props.mode, (mode) => {
  designSystem.setMode(mode)
}, { immediate: true })

watch(() => props.variant, (variant) => {
  designSystem.setVariant(variant)
}, { immediate: true })

const rootState = computed(() => {
  const variant = DESIGN_SYSTEM_VARIANTS[designSystem.variant.value as keyof typeof DESIGN_SYSTEM_VARIANTS]

  return [
    'ods-ui',
    `ods-theme-${designSystem.resolvedMode.value}`,
    variant?.cssClass ?? DESIGN_SYSTEM_VARIANTS.fluent.cssClass,
  ].join(' · ')
})
</script>

<template>
  <main class="ods-story-shell">
    <header class="ods-story-header">
      <div>
        <p class="ods-story-kicker">Osmova Design System</p>
        <h1 class="ods-story-heading">{{ title }}</h1>
        <p v-if="description" class="ods-story-description">{{ description }}</p>
      </div>
      <QBadge class="ods-story-root-state" color="primary" text-color="white" role="status" aria-live="polite">
        {{ rootState }}
      </QBadge>
      <QSelect
        v-if="designSystem.variant.value === 'shadcn'"
        :model-value="designSystem.shadcnBaseColor.value"
        :options="SHADCN_BASE_COLORS"
        option-value="name"
        option-label="label"
        emit-value
        map-options
        dense
        outlined
        label="Base palette"
        aria-label="Shadcn base palette"
        style="min-width: 8rem; max-width: 100%"
        @update:model-value="(color: ShadcnBaseColor) => designSystem.setShadcnBaseColor(color)"
      />
    </header>

    <slot />
  </main>
</template>
