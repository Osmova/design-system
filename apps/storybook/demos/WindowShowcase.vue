<script setup lang="ts">
import { ref } from 'vue'
import { QBtn } from 'quasar'
import { OdsWindow } from '@osmova/ds-quasar/qwindow'

const visible = ref(true)
const maximized = ref(false)
</script>

<template>
  <div class="ods-window-story__stage">
    <OdsWindow
      v-if="visible"
      v-model="visible"
      v-model:maximized="maximized"
      title="ODS optional window"
      embedded
      dense
      no-resize
      :actions="['close']"
      aria-label="ODS optional QWindow story"
    >
      <div class="ods-window-story__content">
        <p class="text-overline ods-text-muted q-mb-xs">Optional module</p>
        <h2 class="ods-story-heading q-mt-none q-mb-sm">Window chrome follows ODS tokens</h2>
        <p class="ods-text-muted q-mb-none">
          Consumers install <code>@quasar/quasar-ui-qwindow</code>, import its native CSS, then opt into the ODS extension stylesheet.
        </p>
      </div>
    </OdsWindow>
    <div v-else class="ods-window-story__reopen">
      <QBtn color="primary" unelevated no-caps label="Reopen window" @click="visible = true" />
    </div>
  </div>
</template>

<style scoped>
.ods-window-story__stage {
  min-height: 22rem;
  padding: var(--ods-space-md);
  border: var(--ods-border-width-control) solid var(--ods-border-subtle);
  border-radius: var(--ods-radius-xl);
  background: var(--ods-surface-0);
}

.ods-window-story__reopen {
  display: grid;
  min-block-size: 18rem;
  place-items: center;
}

.ods-window-story__content {
  max-width: 44rem;
}

.ods-story-heading {
  font-family: var(--ods-font-family-display);
  font-size: clamp(1.5rem, 2.4vw, 2.2rem);
  line-height: 1.1;
}
</style>
