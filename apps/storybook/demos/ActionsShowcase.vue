<script setup lang="ts">
import { ref } from 'vue'
import {
  QBtn,
  QBtnDropdown,
  QBtnGroup,
  QBtnToggle,
  QCard,
  QFab,
  QFabAction,
  QItem,
  QItemSection,
  QList,
} from 'quasar'
import {
  PhArrowBendUpRight,
  PhCopy,
  PhPalette,
  PhPencilSimple,
  PhPlus,
  PhShareNetwork,
  PhSparkle,
} from '@phosphor-icons/vue'

const cadence = ref('weekly')
const density = ref('comfortable')
const fabOpen = ref(true)

const cadenceOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const densityOptions = [
  { label: 'Compact', value: 'compact' },
  { label: 'Comfortable', value: 'comfortable' },
  { label: 'Touch', value: 'touch' },
]
</script>

<template>
  <div class="ods-actions-layout">
    <QCard class="ods-story-panel q-pa-lg">
      <div class="text-overline ods-text-muted">Interaction inventory</div>
      <h2 class="ods-story-heading q-my-sm">Buttons, groups and FAB</h2>
      <p class="ods-text-muted q-mb-none">
        Review action hierarchy, segmented choices, and a contained floating action state.
      </p>
    </QCard>

    <QCard class="ods-story-panel q-pa-lg">
      <div class="ods-story-grid">
        <div class="ods-story-demo">
          <div class="ods-story-label">QBtnDropdown</div>
          <QBtnDropdown unelevated color="primary" label="Actions" no-caps>
            <QList dense style="min-width: 180px">
              <QItem v-close-popup clickable>
                <QItemSection>Duplicate</QItemSection>
              </QItem>
              <QItem v-close-popup clickable>
                <QItemSection>Move</QItemSection>
              </QItem>
              <QItem v-close-popup clickable>
                <QItemSection>Archive</QItemSection>
              </QItem>
            </QList>
          </QBtnDropdown>
        </div>

        <div class="ods-story-demo">
          <div class="ods-story-label">QBtnGroup</div>
          <QBtnGroup unelevated spread>
            <QBtn color="primary" label="One" no-caps />
            <QBtn color="primary" label="Two" no-caps />
            <QBtn color="primary" label="Three" no-caps />
          </QBtnGroup>
        </div>

        <div class="ods-story-demo">
          <div class="ods-story-label">QBtnToggle</div>
          <QBtnToggle v-model="cadence" unelevated no-caps toggle-color="primary" :options="cadenceOptions" />
        </div>

        <div class="ods-story-demo">
          <div class="ods-story-label">Segmented density</div>
          <QBtnToggle v-model="density" dense unelevated no-caps toggle-color="secondary" :options="densityOptions" />
        </div>

        <div class="ods-story-demo ods-story-demo--wide">
          <div class="ods-story-label">QFab open state</div>
          <div class="ods-story-fab-stage">
            <QFab v-model="fabOpen" color="accent" direction="up" label="Create" no-caps>
              <QFabAction color="primary" label="Draft">
                <PhPencilSimple :size="18" weight="regular" />
              </QFabAction>
              <QFabAction color="secondary" label="Share">
                <PhShareNetwork :size="18" weight="regular" />
              </QFabAction>
            </QFab>
          </div>
        </div>

        <div class="ods-story-demo ods-story-demo--wide">
          <div class="ods-story-label">Icon + tonal actions</div>
          <div class="ods-actions-icon-row">
            <QBtn unelevated color="primary" no-caps>
              <PhSparkle :size="18" weight="regular" />
              Compose
            </QBtn>
            <QBtn outline color="primary" no-caps>
              <PhCopy :size="18" weight="regular" />
              Copy
            </QBtn>
            <QBtn flat color="primary" no-caps>
              <PhArrowBendUpRight :size="18" weight="regular" />
              Share
            </QBtn>
            <QBtn round color="accent" aria-label="Quick add">
              <PhPlus :size="20" weight="bold" />
            </QBtn>
            <QBtn round flat aria-label="Palette">
              <PhPalette :size="20" weight="regular" />
            </QBtn>
          </div>
        </div>
      </div>
    </QCard>
  </div>
</template>

<style scoped>
.ods-actions-layout {
  display: grid;
  gap: var(--ods-space-md);
}

.ods-story-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ods-space-md);
}

.ods-story-demo--wide {
  grid-column: 1 / -1;
}

.ods-story-fab-stage {
  display: flex;
  min-height: 12rem;
  align-items: end;
  padding: 6rem var(--ods-space-sm) var(--ods-space-sm);
}

.ods-actions-icon-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ods-space-sm);
}

@media (max-width: 42rem) {
  .ods-story-grid {
    grid-template-columns: 1fr;
  }
}
</style>
