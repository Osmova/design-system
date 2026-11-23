<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import {
  PhBellRinging,
  PhCheckCircle,
  PhSparkle,
} from '@phosphor-icons/vue'

const $q = useQuasar()

const density = ref('Comfortable')
const search = ref('Design tokens')
const enabled = ref(true)

function notify() {
  $q.notify({
    type: 'info',
    message: 'ODS notification surface',
    caption: 'Phosphor control icons via odsIconSet',
    timeout: 1400,
  })
}
</script>

<template>
  <q-toolbar class="ods-story-toolbar q-mb-lg rounded-borders">
    <q-toolbar-title>
      <div class="text-h6 ods-story-title">Component catalog</div>
      <div class="text-caption ods-text-muted">Fields, feedback, typography, and semantic actions.</div>
    </q-toolbar-title>
    <q-btn color="info" unelevated @click="notify">
      <template #default>
        <PhBellRinging :size="18" weight="regular" />
        Notify
      </template>
    </q-btn>
  </q-toolbar>

  <div class="row q-col-gutter-lg">
    <div class="col-12 col-lg-4">
      <q-card class="q-pa-lg ods-story-panel ods-story-panel--neutral">
        <div class="text-overline ods-text-muted">Field controls</div>
        <div class="text-h6 q-mb-md">Interactive states</div>
        <q-input v-model="search" label="Search field" outlined dense class="q-mb-md">
          <template #prepend>
            <PhSparkle :size="18" weight="regular" />
          </template>
        </q-input>
        <q-select v-model="density" :options="['Compact', 'Comfortable', 'Spacious']" label="Density sample" outlined dense class="q-mb-md" />
        <q-toggle v-model="enabled" color="primary" label="Interactive state" />
        <q-separator class="q-my-md" />
        <div class="text-caption ods-text-muted">Mode and variant are controlled from the Storybook toolbar.</div>
      </q-card>
    </div>

    <div class="col-12 col-lg-8">
      <q-card class="q-pa-lg ods-story-panel q-mb-lg">
        <div class="row items-start q-col-gutter-lg">
          <div class="col-12 col-md-7">
            <div class="text-overline ods-text-muted">Buttons</div>
            <h2 class="ods-story-heading q-mt-none q-mb-sm">Neutral first, colour for meaning</h2>
            <p class="ods-text-muted q-mb-lg">
              Default actions are neutral; <code>color</code> gives a solid role fill and <code>ods-tonal</code> opts into a soft wash.
            </p>
            <div class="q-gutter-sm q-mb-md">
              <q-btn label="Neutral" />
              <q-btn unelevated color="primary" label="Primary" />
              <q-btn outline label="Outline" />
              <q-btn flat label="Subtle" />
            </div>
            <div class="q-gutter-sm">
              <q-btn unelevated class="ods-tonal" color="primary" label="Primary tonal" />
              <q-btn unelevated class="ods-tonal" color="positive" label="Positive tonal" />
              <q-btn unelevated class="ods-tonal" color="warning" label="Warning tonal" />
              <q-btn unelevated class="ods-tonal" color="negative" label="Negative tonal" />
            </div>
          </div>

          <div class="col-12 col-md-5">
            <div class="ods-story-feature q-pa-lg rounded-borders">
              <PhSparkle :size="44" weight="duotone" />
              <div class="text-h6 q-mt-md">Phosphor content icon</div>
              <p class="ods-text-muted q-mb-none">
                Content uses duotone icons; Quasar controls use the ODS Phosphor line icon set.
              </p>
            </div>
          </div>
        </div>
      </q-card>

      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-6">
          <q-card class="q-pa-lg ods-story-panel full-height">
            <div class="text-overline ods-text-muted">Cards and surfaces</div>
            <div class="text-h6 q-mb-sm">Layered surface rhythm</div>
            <p class="ods-text-muted">Cards keep a neutral border, subtle depth, and tokenized radius across variants.</p>
            <div class="ods-story-surface q-pa-md rounded-borders q-mb-md">
              Muted surface utility with body text and soft boundary.
            </div>
            <div class="ods-glass q-pa-md rounded-borders">Acrylic utility for translucent emphasis.</div>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card class="q-pa-lg ods-story-panel full-height">
            <div class="text-overline ods-text-muted">Feedback</div>
            <div class="text-h6 q-mb-md">Badges, chips, notification</div>
            <div class="q-gutter-sm q-mb-md">
              <q-badge color="primary" label="Primary" />
              <q-badge color="positive" label="Ready" />
              <q-chip color="warning" label="Review" />
              <q-chip color="info" removable label="Info chip" />
            </div>
            <q-banner rounded class="ods-story-banner">
              <template #avatar>
                <PhCheckCircle :size="24" weight="duotone" />
              </template>
              Toolbar, menu, fields, and Notify all inherit ODS tokens.
            </q-banner>
          </q-card>
        </div>
      </div>

      <q-card class="q-pa-lg ods-story-panel q-mt-lg">
        <div class="text-overline ods-text-muted">Typography</div>
        <div class="ods-story-display">Display face: Fluent-inspired, calm, readable.</div>
        <p class="ods-story-body q-mb-none">
          Body face: Inter variable with local font assets and semantic token fallbacks for public package consumers.
        </p>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
.ods-story-toolbar,
.ods-story-panel {
  background: var(--ods-card-bg);
  border: var(--ods-border-width-control) solid var(--ods-card-border);
}

.ods-story-toolbar :deep(.q-toolbar__title) {
  overflow: visible;
  white-space: normal;
  text-overflow: clip;
}

.ods-story-toolbar {
  min-height: auto;
  gap: var(--ods-space-sm);
}

.ods-story-toolbar :deep(.q-toolbar__title) {
  min-width: 0;
}

.ods-story-title,
.ods-story-display {
  font-family: var(--ods-font-family-display);
}

.ods-story-feature {
  background: rgba(var(--ods-color-primary-rgb), var(--ods-tonal-bg-opacity));
  border: var(--ods-border-width-control) solid rgba(var(--ods-color-primary-rgb), var(--ods-tonal-border-opacity));
}

.ods-story-surface,
.ods-story-banner {
  background: var(--ods-surface-1);
  border: var(--ods-border-width-control) solid var(--ods-border-subtle);
}

.ods-story-display {
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: var(--ods-font-weight-bold);
  line-height: 1.05;
}

.ods-story-body {
  max-width: 64ch;
  color: var(--ods-text-muted);
}

@media (max-width: 32rem) {
  .ods-story-toolbar {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .ods-story-toolbar :deep(.q-toolbar__title),
  .ods-story-toolbar :deep(.q-btn) {
    flex-basis: 100%;
  }
}
</style>
