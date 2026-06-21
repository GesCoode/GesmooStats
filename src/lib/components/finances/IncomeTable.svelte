<script lang="ts">
  import type { FinancesData, IncomeLine } from '$lib/finances/types';
  import { monthStartISO } from '$lib/finances/dates';
  import { formatCurrency, netIncomeAmount, parseAmount } from '$lib/finances/format';

  let {
    data,
    onchange
  }: {
    data: FinancesData;
    onchange: () => void;
  } = $props();

  function addRow() {
    data.income = [
      ...data.income,
      {
        id: crypto.randomUUID(),
        name: 'New income',
        amount: 0,
        taxPercent: 0,
        startDate: monthStartISO(),
        endDate: ''
      }
    ];
    onchange();
  }

  function removeRow(id: string) {
    data.income = data.income.filter((item) => item.id !== id);
    onchange();
  }

  function updateRow(id: string, patch: Partial<IncomeLine>) {
    data.income = data.income.map((item) => (item.id === id ? { ...item, ...patch } : item));
    onchange();
  }
</script>

<div class="fin-entry-list">
  {#each data.income as item (item.id)}
    {@const net = netIncomeAmount(item.amount, item.taxPercent)}
    <article class="fin-entry-card">
      <div class="fin-entry-card__top">
        <div class="fin-pill fin-pill--grow">
          <input
            class="fin-pill__input"
            value={item.name}
            oninput={(event) => updateRow(item.id, { name: event.currentTarget.value })}
            aria-label="Income name"
          />
        </div>
        <button
          class="fin-icon-btn"
          type="button"
          aria-label="Remove {item.name}"
          onclick={() => removeRow(item.id)}>×</button
        >
      </div>

      <div class="fin-entry-card__grid fin-entry-card__grid--income">
        <label class="fin-field">
          <span>Start</span>
          <input
            class="fin-field__input"
            type="date"
            value={item.startDate}
            oninput={(event) => updateRow(item.id, { startDate: event.currentTarget.value })}
          />
        </label>
        <label class="fin-field">
          <span>End</span>
          <input
            class="fin-field__input"
            type="date"
            value={item.endDate}
            oninput={(event) => updateRow(item.id, { endDate: event.currentTarget.value })}
          />
        </label>
        <label class="fin-field">
          <span>Gross / month</span>
          <input
            class="fin-field__input fin-field__input--amount"
            inputmode="decimal"
            value={item.amount || ''}
            placeholder="0"
            oninput={(event) => updateRow(item.id, { amount: parseAmount(event.currentTarget.value) })}
          />
        </label>
        <label class="fin-field">
          <span>Tax %</span>
          <input
            class="fin-field__input fin-field__input--amount"
            inputmode="decimal"
            value={item.taxPercent || ''}
            placeholder="0"
            oninput={(event) =>
              updateRow(item.id, { taxPercent: parseAmount(event.currentTarget.value) })}
          />
        </label>
        <div class="fin-field fin-field--readout">
          <span>Net / month</span>
          <strong>{formatCurrency(net)}</strong>
        </div>
      </div>
    </article>
  {:else}
    <p class="muted fin-empty">No income streams yet.</p>
  {/each}

  <button class="fin-plus fin-plus--wide" type="button" onclick={addRow}>+ Add income</button>
</div>

<p class="muted fin-hint">Net amount is calculated from gross minus tax percentage.</p>
