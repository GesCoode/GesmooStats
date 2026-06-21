<script lang="ts">
  import type { ExpenseLine, FinancesData } from '$lib/finances/types';
  import { monthStartISO } from '$lib/finances/dates';
  import { parseAmount } from '$lib/finances/format';

  let {
    data,
    onchange
  }: {
    data: FinancesData;
    onchange: () => void;
  } = $props();

  function addRow() {
    data.expenses = [
      ...data.expenses,
      {
        id: crypto.randomUUID(),
        name: 'New expense',
        amount: 0,
        startDate: monthStartISO(),
        endDate: ''
      }
    ];
    onchange();
  }

  function removeRow(id: string) {
    data.expenses = data.expenses.filter((item) => item.id !== id);
    onchange();
  }

  function updateRow(id: string, patch: Partial<ExpenseLine>) {
    data.expenses = data.expenses.map((item) => (item.id === id ? { ...item, ...patch } : item));
    onchange();
  }
</script>

<div class="fin-entry-list">
  {#each data.expenses as item (item.id)}
    <article class="fin-entry-card">
      <div class="fin-entry-card__top">
        <div class="fin-pill fin-pill--grow">
          <input
            class="fin-pill__input"
            value={item.name}
            oninput={(event) => updateRow(item.id, { name: event.currentTarget.value })}
            aria-label="Expense name"
          />
        </div>
        <button
          class="fin-icon-btn"
          type="button"
          aria-label="Remove {item.name}"
          onclick={() => removeRow(item.id)}>×</button
        >
      </div>

      <div class="fin-entry-card__grid">
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
          <span>Monthly amount</span>
          <input
            class="fin-field__input fin-field__input--amount"
            inputmode="decimal"
            value={item.amount || ''}
            placeholder="0"
            oninput={(event) => updateRow(item.id, { amount: parseAmount(event.currentTarget.value) })}
          />
        </label>
      </div>
    </article>
  {:else}
    <p class="muted fin-empty">No expenses yet. Add rent, subscriptions, and bills.</p>
  {/each}

  <button class="fin-plus fin-plus--wide" type="button" onclick={addRow}>+ Add expense</button>
</div>

<p class="muted fin-hint">Leave end date empty for ongoing expenses. Amounts apply only between start and end.</p>
