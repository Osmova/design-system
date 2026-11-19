<script setup lang="ts">
import { ref } from 'vue'
import {
  QBtn,
  QCard,
  QCardSection,
  QDialog,
  QDrawer,
  QFooter,
  QItem,
  QItemSection,
  QLayout,
  QList,
  QMenu,
  QPage,
  QPageContainer,
  QSeparator,
  QTab,
  QTabPanel,
  QTabPanels,
  QTabs,
  QToolbar,
} from 'quasar'
import { PhBell, PhFolderOpen, PhPalette, PhSidebar, PhSparkle } from '@phosphor-icons/vue'

const tab = ref('overview')
const dialogOpen = ref(false)
const drawerOpen = ref(false)
const menuOpen = ref(false)
</script>

<template>
  <div class="ods-story-stack ods-story-stack--relaxed">
    <QCard class="ods-story-panel q-pa-lg q-mb-lg">
      <div class="text-overline ods-text-muted">QTabs + QTabPanels</div>
      <QTabs v-model="tab" align="left" inline-label class="ods-story-tabs q-mt-sm">
        <QTab name="overview" aria-label="Overview">
          <PhSparkle :size="18" weight="regular" class="ods-story-tab-icon on-left" /> <span class="ods-story-tab-label">Overview</span>
        </QTab>
        <QTab name="assets" aria-label="Assets">
          <PhFolderOpen :size="18" weight="regular" class="ods-story-tab-icon on-left" /> <span class="ods-story-tab-label">Assets</span>
        </QTab>
        <QTab name="alerts" aria-label="Alerts">
          <PhBell :size="18" weight="regular" class="ods-story-tab-icon on-left" /> <span class="ods-story-tab-label">Alerts</span>
        </QTab>
      </QTabs>
      <QSeparator />
      <QTabPanels v-model="tab" animated class="ods-story-tab-panels">
        <QTabPanel name="overview">
          <div class="row items-center q-col-gutter-md">
            <div class="col-auto"><PhSparkle :size="34" weight="duotone" /></div>
            <div class="col">
              <div class="text-h6 ods-story-title">Overview panel</div>
              <p class="ods-text-muted q-mb-none">Active panel with soft card surface and deterministic content.</p>
            </div>
          </div>
        </QTabPanel>
        <QTabPanel name="assets">
          <div class="row items-center q-col-gutter-md">
            <div class="col-auto"><PhFolderOpen :size="34" weight="duotone" /></div>
            <div class="col">Asset navigation keeps tab spacing consistent with list and menu rows.</div>
          </div>
        </QTabPanel>
        <QTabPanel name="alerts">
          <div class="row items-center q-col-gutter-md">
            <div class="col-auto"><PhBell :size="34" weight="duotone" /></div>
            <div class="col">Alert panel demonstrates icon and body text alignment.</div>
          </div>
        </QTabPanel>
      </QTabPanels>
    </QCard>

    <QCard class="ods-story-panel q-pa-lg q-mb-lg">
      <div class="text-overline ods-text-muted">QDrawer</div>
      <div class="row items-center justify-between q-gutter-md q-mb-md">
        <div class="text-h6 ods-story-title">Layout shell proof</div>
        <QBtn outline color="primary" no-caps label="Toggle drawer" @click="drawerOpen = !drawerOpen" />
      </div>
      <QLayout view="hHh lpR fFf" container class="ods-story-layout">
        <QDrawer v-model="drawerOpen" bordered :width="216" data-test="qds-story-drawer">
          <QList dense>
            <QItem clickable active>
              <QItemSection avatar><PhSparkle :size="18" weight="duotone" /></QItemSection>
              <QItemSection>Overview</QItemSection>
            </QItem>
            <QItem clickable>
              <QItemSection avatar><PhSidebar :size="18" weight="regular" /></QItemSection>
              <QItemSection>Navigation</QItemSection>
            </QItem>
          </QList>
        </QDrawer>
        <QPageContainer>
          <QPage class="q-pa-md">
            <div class="ods-story-panel q-pa-md">Fluent keeps selective material; Ink resolves to a matte separator-driven drawer.</div>
          </QPage>
        </QPageContainer>
        <QFooter bordered>
          <QToolbar style="min-height: 2.25rem"><span class="ods-text-muted">Footer edge proof</span></QToolbar>
        </QFooter>
      </QLayout>
    </QCard>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-6">
        <QCard class="ods-story-panel q-pa-lg full-height">
          <div class="text-overline ods-text-muted">QMenu</div>
          <div class="text-h6 ods-story-title q-mb-md">Anchored overlay menu</div>
          <QBtn color="primary" unelevated label="Open menu" no-caps data-test="qds-story-menu-trigger">
            <QMenu v-model="menuOpen" persistent anchor="bottom left" self="top left" :offset="[0, 8]" class="ods-story-menu-proof">
              <QList dense style="min-width: 220px">
                <QItem clickable>
                  <QItemSection avatar><PhPalette :size="18" weight="regular" /></QItemSection>
                  <QItemSection>Switch variant</QItemSection>
                </QItem>
                <QItem clickable>
                  <QItemSection avatar><PhSidebar :size="18" weight="regular" /></QItemSection>
                  <QItemSection>Pin navigation</QItemSection>
                </QItem>
                <QSeparator />
                <QItem clickable>
                  <QItemSection>Open documentation</QItemSection>
                </QItem>
              </QList>
            </QMenu>
          </QBtn>
          <p class="ods-text-muted q-mt-md q-mb-none">Open the menu to review the anchored overlay material in each variant.</p>
        </QCard>
      </div>

      <div class="col-12 col-md-6">
        <QCard class="ods-story-panel q-pa-lg full-height">
          <div class="text-overline ods-text-muted">QDialog</div>
          <div class="text-h6 ods-story-title q-mb-md">Modal surface</div>
          <QBtn outline color="primary" label="Open dialog" no-caps @click="dialogOpen = true" />
          <QDialog v-model="dialogOpen" persistent>
            <QCard class="ods-story-dialog" style="min-width: 320px">
              <QCardSection>
                <div class="text-h6 ods-story-title">Design-system dialog</div>
                <p class="ods-text-muted q-mb-none">Open on demand to review scrim, card radius, and action spacing.</p>
              </QCardSection>
              <QCardSection class="row justify-end q-gutter-sm">
                <QBtn flat label="Cancel" no-caps @click="dialogOpen = false" />
                <QBtn color="primary" unelevated label="Confirm" no-caps @click="dialogOpen = false" />
              </QCardSection>
            </QCard>
          </QDialog>
          <p class="ods-text-muted q-mt-md q-mb-none">The dialog can be closed and reopened without changing any story data.</p>
        </QCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ods-story-panel,
.ods-story-dialog {
  background: var(--ods-card-bg);
  border: var(--ods-border-width-control) solid var(--ods-card-border);
}

.ods-story-title {
  font-family: var(--ods-font-family-display);
}

.ods-story-tabs,
.ods-story-tab-panels {
  background: transparent;
}

.ods-story-layout {
  block-size: clamp(16rem, 48vw, 18.75rem);
  overflow: hidden;
  border: var(--ods-border-width-control) solid var(--ods-card-border);
  border-radius: var(--ods-card-radius);
}

@media (max-width: 32rem) {
  .ods-story-tabs :deep(.q-tab) {
    flex: 1 1 0;
    min-width: 0;
    padding-inline: var(--ods-space-sm);
  }

  .ods-story-tab-label {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .ods-story-tab-icon {
    margin-inline: 0;
  }
}
</style>
