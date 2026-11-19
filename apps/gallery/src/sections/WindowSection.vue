<script setup lang="ts">
import { ref } from 'vue'
import { OdsWindow } from '@osmova/ds-quasar/qwindow'

const visible = ref(true)
const maximized = ref(false)
</script>

<template>
  <section class="catalog-window" data-test="qds-window-proof">
    <div class="catalog-window__intro">
      <p class="text-overline ods-text-muted q-mb-xs">Optional module</p>
      <h2 class="ods-display q-mt-none q-mb-sm">QWindow extension</h2>
      <p class="ods-text-muted q-mb-none">
        The gallery imports native QWindow CSS, then the optional ODS QWindow stylesheet. The package's default CSS bundle remains unchanged.
      </p>
    </div>

    <div class="catalog-window__stage" data-test="qds-window-stage">
      <OdsWindow
        v-model="visible"
        v-model:maximized="maximized"
        title="ODS window shell"
        embedded
        dense
        no-resize
        :actions="['close']"
        aria-label="ODS gallery window proof"
      >
        <div class="catalog-window__content">
          <div>
            <p class="text-overline ods-text-muted q-mb-xs">Embedded deterministic proof</p>
            <h3 class="q-mt-none q-mb-sm">Native QWindow, ODS chrome</h3>
            <p class="ods-text-muted q-mb-md">
              The wrapper passes QWindow state and geometry props through while adding strict <code>ods-window</code> BEM classes.
            </p>
          </div>

          <div class="catalog-window__tiles" aria-label="Window token checks">
            <div class="catalog-window__tile">
              <span>Surface</span>
              <strong>var(--ods-card-bg)</strong>
            </div>
            <div class="catalog-window__tile">
              <span>Radius</span>
              <strong>var(--ods-card-radius)</strong>
            </div>
            <div class="catalog-window__tile">
              <span>Actions</span>
              <strong>close</strong>
            </div>
          </div>
        </div>
      </OdsWindow>
    </div>
  </section>
</template>

<style scoped>
.catalog-window {
  display: grid;
  gap: var(--ods-space-lg);
}

.catalog-window__intro {
  max-width: 68ch;
}

.catalog-window__stage {
  padding: var(--ods-space-md);
  border-radius: var(--ods-radius-xl);
  background:
    radial-gradient(circle at top right, rgba(var(--ods-color-primary-rgb), 0.13), transparent 24rem),
    var(--ods-surface-1);
}

.catalog-window__content {
  display: grid;
  gap: var(--ods-space-lg);
}

.catalog-window__tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ods-space-sm);
}

.catalog-window__tile {
  padding: var(--ods-space-md);
  border-radius: var(--ods-radius-md);
  background: var(--ods-surface-1);
}

.catalog-window__tile span,
.catalog-window__tile strong {
  display: block;
}

.catalog-window__tile span {
  color: var(--ods-text-muted);
  font-size: var(--ods-font-size-sm);
}

@media (max-width: 720px) {
  .catalog-window__tiles {
    grid-template-columns: 1fr;
  }
}
</style>
