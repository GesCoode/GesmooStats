<script lang="ts">
  import type { FinancesData, OneOffEntry } from '$lib/finances/types';
  import { todayISO } from '$lib/finances/dates';
  import { parseAmount } from '$lib/finances/format';

  let {
    data,
    onchange
  }: {
    data: FinancesData;
    onchange: () => void;
  } = $props();

  const expenses = $derived(
    data.oneOffs
      .filter((entry) => entry.kind === 'expense')
      .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name))
  );

  const incomes = $derived(
    data.oneOffs
      .filter((entry) => entry.kind === 'income')
      .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name))
  );

  function addEntry(kind: OneOffEntry['kind']) {
    data.oneOffs = [
      ...data.oneOffs,
      {
        id: crypto.randomUUID(),
        name: kind === 'expense' ? 'New expense' : 'New income',
        amount: 0,
        date: todayISO(),
        kind
      }
    ];
    onchange();
  }

  function removeEntry(id: string) {
    data.oneOffs = data.oneOffs.filter((entry) => entry.id !== id);
    onchange();
  }

  function updateEntry(id: string, patch: Partial<OneOffEntry>) {
    data.oneOffs = data.oneOffs.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
    onchange();
  }
</script>

<div class="fin-oneoffs-columns">
  <section class="fin-oneoffs-col">
    <header class="fin-oneoffs-col__header">
      <h2 class="fin-oneoffs-col__title">Expenses</h2>
      <button class="fin-plus fin-plus--small" type="button" onclick={() => addEntry('expense')}>+</button>
    </header>

    <div class="fin-oneoffs-table">
      <div class="fin-oneoffs-table__head">
        <span>Name</span>
        <span>Date</span>
        <span>Amount</span>
        <span></span>
      </div>

      {#each expenses as entry (entry.id)}
        <div class="fin-oneoffs-row">
          <input
            class="fin-oneoffs-row__input"
            value={entry.name}
            oninput={(event) => updateEntry(entry.id, { name: event.currentTarget.value })}
            aria-label="Expense name"
          />
          <input
            class="fin-oneoffs-row__input fin-oneoffs-row__input--date"
            type="date"
            value={entry.date}
            oninput={(event) => updateEntry(entry.id, { date: event.currentTarget.value })}
            aria-label="Expense date"
          />
          <input
            class="fin-oneoffs-row__input fin-oneoffs-row__input--amount"
            inputmode="decimal"
            value={entry.amount || ''}
            placeholder="0"
            oninput={(event) =>
              updateEntry(entry.id, { amount: parseAmount(event.currentTarget.value) })}
            aria-label="{entry.name} amount"
          />
          <button
            class="fin-icon-btn"
            type="button"
            aria-label="Remove {entry.name}"
            onclick={() => removeEntry(entry.id)}>×</button
          >
        </div>
      {:else}
        <p class="muted fin-oneoffs-empty">No expenses yet.</p>
      {/each}
    </div>
  </section>

  <section class="fin-oneoffs-col fin-oneoffs-col--income">
    <header class="fin-oneoffs-col__header">
      <h2 class="fin-oneoffs-col__title">Income</h2>
      <button class="fin-plus fin-plus--small fin-plus--income" type="button" onclick={() => addEntry('income')}>
        +
      </button>
    </header>

    <div class="fin-oneoffs-table">
      <div class="fin-oneoffs-table__head">
        <span>Name</span>
        <span>Date</span>
        <span>Amount</span>
        <span></span>
      </div>

      {#each incomes as entry (entry.id)}
        <div class="fin-oneoffs-row">
          <input
            class="fin-oneoffs-row__input"
            value={entry.name}
            oninput={(event) => updateEntry(entry.id, { name: event.currentTarget.value })}
            aria-label="Income name"
          />
          <input
            class="fin-oneoffs-row__input fin-oneoffs-row__input--date"
            type="date"
            value={entry.date}
            oninput={(event) => updateEntry(entry.id, { date: event.currentTarget.value })}
            aria-label="Income date"
          />
          <input
            class="fin-oneoffs-row__input fin-oneoffs-row__input--amount"
            inputmode="decimal"
            value={entry.amount || ''}
            placeholder="0"
            oninput={(event) =>
              updateEntry(entry.id, { amount: parseAmount(event.currentTarget.value) })}
            aria-label="{entry.name} amount"
          />
          <button
            class="fin-icon-btn"
            type="button"
            aria-label="Remove {entry.name}"
            onclick={() => removeEntry(entry.id)}>×</button
          >
        </div>
      {:else}
        <p class="muted fin-oneoffs-empty">No income yet.</p>
      {/each}
    </div>
  </section>
</div>
