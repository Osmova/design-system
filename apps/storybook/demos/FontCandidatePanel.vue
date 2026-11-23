<script setup lang="ts">
// Development-only specimen panel: shows one font candidate at the active variant's real type ramp.
defineProps<{
  candidate: string
  target: string
  family: string
  licence: string
  note?: string
  bodyAlternative?: string
  shipStack?: string
}>()
</script>

<template>
  <section class="ods-story-demo ods-font-panel" data-test="ods-font-panel">
    <header class="ods-font-panel__head">
      <div>
        <p class="ods-font-panel__kicker">variant {{ target }} — font candidate</p>
        <h2 class="ods-font-panel__name" :style="{ fontFamily: family }">{{ candidate }}</h2>
      </div>
      <p class="ods-font-panel__meta">
        {{ licence }}<template v-if="note"> — {{ note }}</template>
      </p>
    </header>

    <div class="ods-font-panel__row" data-test="ods-font-display">
      <p class="ods-font-panel__label">Display heading — h1 tokens</p>
      <p class="ods-font-specimen ods-font-specimen--display" :style="{ fontFamily: family }">
        Interfaces calmes et arrondies
      </p>
    </div>

    <div class="ods-font-panel__row" data-test="ods-font-title">
      <p class="ods-font-panel__label">Title — h4 tokens</p>
      <p class="ods-font-specimen ods-font-specimen--title" :style="{ fontFamily: family }">
        Titre de section — l'œuvre récente de l'atelier
      </p>
    </div>

    <div class="ods-font-panel__row" data-test="ods-font-body">
      <p class="ods-font-panel__label">Body paragraph — body1 tokens</p>
      <p class="ods-font-specimen ods-font-specimen--body" :style="{ fontFamily: family }">
        À l'école, l'élève distingue le cœur de l'œuvre : où le goût précis d'un très vieux café
        s'accroche à l'aïeule comme à l'hôtel voisin, chacun garde son aperçu du système.
      </p>
    </div>

    <div v-if="bodyAlternative" class="ods-font-panel__row" data-test="ods-font-body-alt">
      <p class="ods-font-panel__label">Body alternative — Inter Light 300</p>
      <p
        class="ods-font-specimen ods-font-specimen--body"
        :style="{ fontFamily: bodyAlternative, fontWeight: 300 }"
      >
        À l'école, l'élève distingue le cœur de l'œuvre : où le goût précis d'un très vieux café
        s'accroche à l'aïeule comme à l'hôtel voisin, chacun garde son aperçu du système.
      </p>
    </div>

    <div class="ods-font-panel__row" data-test="ods-font-label">
      <p class="ods-font-panel__label">Label — the variant's field-label size</p>
      <p class="ods-font-specimen ods-font-specimen--label" :style="{ fontFamily: family }">
        Étiquette — cœur de l'œuvre, élève à Paris
      </p>
    </div>

    <div class="ods-font-panel__row" data-test="ods-font-numbers">
      <p class="ods-font-panel__label">Numbers</p>
      <p class="ods-font-specimen ods-font-specimen--numbers" :style="{ fontFamily: family }">
        0123456789 · 1 234 567,89 € · +33 1 23 45 67 89 · 3,14159 · 42 %
      </p>
    </div>

    <div v-if="shipStack" class="ods-font-panel__row" data-test="ods-font-shipped">
      <p class="ods-font-panel__label">As shipped — system first, this face as the fallback</p>
      <p class="ods-font-specimen ods-font-specimen--body" :style="{ fontFamily: shipStack }">
        Sur Apple : SF Pro Text ; ailleurs : {{ candidate }}.
      </p>
    </div>
  </section>
</template>

<style scoped>
.ods-font-panel {
  display: grid;
  gap: var(--ods-space-lg);
  max-inline-size: 56rem;
}

.ods-font-panel__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ods-space-md);
  align-items: end;
  justify-content: space-between;
  padding-block-end: var(--ods-space-sm);
  border-block-end: var(--ods-border-width-control) solid var(--ods-border-subtle);
}

.ods-font-panel__kicker {
  margin: 0;
  color: var(--ods-text-muted);
  font-size: var(--ods-font-size-caption);
  font-weight: var(--ods-font-weight-caption);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ods-font-panel__name {
  margin: 0;
  font-size: var(--ods-font-size-h3);
  line-height: var(--ods-line-height-h3);
  font-weight: var(--ods-font-weight-h3);
}

.ods-font-panel__meta {
  margin: 0;
  color: var(--ods-text-muted);
  font-size: var(--ods-font-size-caption);
}

.ods-font-panel__row {
  display: grid;
  gap: var(--ods-space-xs);
}

.ods-font-panel__label {
  margin: 0;
  color: var(--ods-text-muted);
  font-size: var(--ods-font-size-caption);
  font-weight: var(--ods-font-weight-caption);
}

.ods-font-specimen {
  margin: 0;
}

.ods-font-specimen--display {
  font-size: var(--ods-font-size-h1);
  line-height: var(--ods-line-height-h1);
  font-weight: var(--ods-font-weight-h1);
  letter-spacing: var(--ods-letter-spacing-h1, 0);
}

.ods-font-specimen--title {
  font-size: var(--ods-font-size-h4);
  line-height: var(--ods-line-height-h4);
  font-weight: var(--ods-font-weight-h4);
}

.ods-font-specimen--body {
  font-size: var(--ods-font-size-body1);
  line-height: var(--ods-line-height-body1);
  font-weight: var(--ods-font-weight-body1);
  max-inline-size: 68ch;
}

.ods-font-specimen--label {
  font-size: var(--ods-field-label-size, var(--ods-font-size-body2));
  line-height: var(--ods-line-height-body2);
  font-weight: var(--ods-font-weight-medium);
}

.ods-font-specimen--numbers {
  font-size: var(--ods-font-size-body1);
  line-height: var(--ods-line-height-body1);
  font-weight: var(--ods-font-weight-medium);
  font-variant-numeric: tabular-nums;
}
</style>
