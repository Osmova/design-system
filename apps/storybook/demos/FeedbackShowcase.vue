<script setup lang="ts">
import { ref } from 'vue'
import {
  QBanner,
  QBtn,
  QCard,
  QCircularProgress,
  QInnerLoading,
  QKnob,
  QLinearProgress,
  QSeparator,
  QSkeleton,
  QSpinner,
  useQuasar,
} from 'quasar'
import { PhBellRinging, PhCheckCircle, PhCloudArrowUp, PhWarningCircle } from '@phosphor-icons/vue'

const $q = useQuasar()
const knobValue = ref(64)

function notify() {
  $q.notify({
    type: 'positive',
    message: 'Design-system notification',
    caption: 'Notify plugin preview from Storybook',
    timeout: 1400,
  })
}
</script>

<template>
  <div class="ods-story-stack ods-story-stack--relaxed">
    <QCard class="ods-story-panel q-pa-lg">
      <div class="row items-center justify-between q-gutter-md">
        <div>
          <div class="text-overline ods-text-muted">Notify</div>
          <div class="text-h6 ods-story-title">Plugin-level feedback</div>
        </div>
      <QBtn color="primary" unelevated no-caps @click="notify">
        <PhBellRinging :size="18" weight="regular" />
        Show Notify
      </QBtn>
      </div>
    </QCard>
    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <QCard class="ods-story-panel q-pa-lg">
          <div class="text-overline ods-text-muted">QBanner</div>
          <QBanner rounded class="ods-story-banner q-mt-sm">
            <template #avatar>
              <PhCheckCircle :size="28" weight="duotone" />
            </template>
            <div class="text-weight-medium">Visual gate ready</div>
            <div class="ods-text-muted">Banners use surface, border, icon, and muted-text tokens across modes.</div>
          </QBanner>
          <QBanner rounded class="ods-story-banner ods-story-banner--warning q-mt-md">
            <template #avatar>
              <PhWarningCircle :size="28" weight="duotone" />
            </template>
            <div class="text-weight-medium">Review required</div>
            <div class="ods-text-muted">Secondary banner state with warning color context.</div>
          </QBanner>
        </QCard>
      </div>

      <div class="col-12 col-md-6">
        <QCard class="ods-story-panel q-pa-lg full-height">
          <div class="text-overline ods-text-muted">QLinearProgress</div>
          <div class="text-h6 ods-story-title q-mb-md">Progress states</div>
          <QLinearProgress :value="0.68" rounded color="primary" size="12px" aria-label="Upload progress" />
          <QLinearProgress :value="0.38" rounded color="secondary" size="8px" class="q-mt-md" aria-label="Sync progress" />
          <QSeparator class="q-my-md" />
          <div class="row items-center q-gutter-md">
            <QCircularProgress class="ods-story-progress-track" aria-label="Storage used" show-value :value="72" size="3.5rem" color="accent" track-color="transparent" />
            <QSpinner color="primary" size="2rem" />
            <div>
              <div class="text-weight-medium">Circular progress + spinner</div>
              <div class="ods-text-muted">Static proof for determinate and live wait treatments.</div>
            </div>
          </div>
          <QSeparator class="q-my-md" />
          <div class="row items-center q-gutter-md">
            <QKnob v-model="knobValue" aria-label="Brightness" class="ods-story-progress-track" show-value size="4.5rem" :thickness="0.18" color="primary" track-color="transparent" />
            <div class="ods-text-muted">Knob inherits ODS progress color and track tokens.</div>
          </div>
        </QCard>
      </div>

      <div class="col-12 col-md-6">
        <QCard class="ods-story-panel q-pa-lg full-height">
          <div class="text-overline ods-text-muted">QSkeleton</div>
          <div class="text-h6 ods-story-title q-mb-md">Placeholder block</div>
          <QSkeleton type="text" animation="none" width="42%" />
          <QSkeleton type="rect" animation="none" height="72px" class="q-mt-sm" />
          <QSkeleton type="text" animation="none" width="72%" class="q-mt-sm" />
          <QSkeleton type="text" animation="none" width="56%" class="q-mt-sm" />
        </QCard>
      </div>

      <div class="col-12">
        <QCard class="ods-story-panel q-pa-lg">
          <div class="text-overline ods-text-muted">QInnerLoading overlay</div>
          <div class="ods-story-loading-box q-mt-sm">
            <div class="row items-center q-col-gutter-md">
              <div class="col-auto"><PhCloudArrowUp :size="34" weight="duotone" /></div>
              <div class="col">
                <div class="text-h6 ods-story-title">Syncing design assets</div>
                <p class="ods-text-muted q-mb-none">A deterministic overlay state for loading-surface review.</p>
              </div>
            </div>
            <QInnerLoading showing label="Syncing" color="primary" class="qds-plugin-inner-loading" data-test="qds-story-inner-loading" />
          </div>
        </QCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ods-story-title {
  font-family: var(--ods-font-family-display);
}

.ods-story-banner,
.ods-story-loading-box {
  background: var(--ods-surface-1);
  border: var(--ods-border-width-control) solid var(--ods-border-subtle);
}

.ods-story-progress-track :deep(.q-circular-progress__track),
.ods-story-progress-track :deep(.q-knob__track) {
  stroke: var(--ods-border-subtle);
}

.ods-story-banner--warning {
  border-color: rgba(var(--ods-color-warning-rgb), var(--ods-tonal-border-opacity));
}

.ods-story-loading-box {
  position: relative;
  min-height: 9rem;
  padding: var(--ods-space-lg);
  border-radius: var(--ods-radius-lg);
}
</style>
