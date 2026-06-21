<script lang="ts">
  import type { FinancesData, LiquidAccount } from '$lib/finances/types';
  import { todayISO } from '$lib/finances/dates';
  import { parseAmount } from '$lib/finances/format';

  let {
    data,
    onchange
  }: {
    data: FinancesData;
    onchange: () => void;
  } = $props();

  function addColumn() {
    const account: LiquidAccount = {
      id: crypto.randomUUID(),
      name: `Account ${data.liquidAccounts.length + 1}`
    };
    data.liquidAccounts = [...data.liquidAccounts, account];
    onchange();
  }

  function removeColumn(id: string) {
    if (data.liquidAccounts.length <= 1) return;
    data.liquidAccounts = data.liquidAccounts.filter((account) => account.id !== id);
    data.liquidRows = data.liquidRows.map((row) => {
      const { [id]: _, ...values } = row.values;
      return { ...row, values };
    });
    onchange();
  }

  function addRow() {
    data.liquidRows = [
      ...data.liquidRows,
      {
        id: crypto.randomUUID(),
        label: `Snapshot ${data.liquidRows.length + 1}`,
        values: {},
        asOfDate: todayISO()
      }
    ];
    onchange();
  }

  function removeRow(id: string) {
    if (data.liquidRows.length <= 1) return;
    data.liquidRows = data.liquidRows.filter((row) => row.id !== id);
    onchange();
  }

  function updateAccountName(account: LiquidAccount, name: string) {
    account.name = name;
    onchange();
  }

  function updateRow(rowId: string, patch: { label?: string; asOfDate?: string }) {
    data.liquidRows = data.liquidRows.map((row) =>
      row.id === rowId ? { ...row, ...patch } : row
    );
    onchange();
  }

  function updateCell(rowId: string, accountId: string, raw: string) {
    const amount = parseAmount(raw);
    data.liquidRows = data.liquidRows.map((row) =>
      row.id === rowId ? { ...row, values: { ...row.values, [accountId]: amount } } : row
    );
    onchange();
  }
</script>

<div class="fin-liquid">
  <div class="fin-liquid__accounts">
    <div class="fin-liquid__accounts-header">
      <span class="muted">Accounts</span>
      <button class="fin-plus fin-plus--small" type="button" aria-label="Add account" onclick={addColumn}
        >+</button
      >
    </div>
    <div class="fin-liquid__account-pills">
      {#each data.liquidAccounts as account (account.id)}
        <div class="fin-pill fin-pill--header">
          <input
            class="fin-pill__input"
            value={account.name}
            oninput={(event) => updateAccountName(account, event.currentTarget.value)}
            aria-label="Account name"
          />
          {#if data.liquidAccounts.length > 1}
            <button
              class="fin-pill__remove"
              type="button"
              aria-label="Remove account"
              onclick={() => removeColumn(account.id)}>×</button
            >
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="fin-liquid__rows">
    {#each data.liquidRows as row (row.id)}
      <article class="fin-liquid-row">
        <div class="fin-liquid-row__meta">
          <div class="fin-pill fin-pill--label">
            <input
              class="fin-pill__input"
              value={row.label}
              oninput={(event) => updateRow(row.id, { label: event.currentTarget.value })}
              aria-label="Row label"
            />
          </div>
          <label class="fin-field fin-field--compact">
            <span>As of</span>
            <input
              class="fin-field__input"
              type="date"
              value={row.asOfDate}
              oninput={(event) => updateRow(row.id, { asOfDate: event.currentTarget.value })}
            />
          </label>
          {#if data.liquidRows.length > 1}
            <button
              class="fin-icon-btn"
              type="button"
              aria-label="Remove row"
              onclick={() => removeRow(row.id)}>×</button
            >
          {/if}
        </div>

        <div class="fin-liquid-row__amounts">
          {#each data.liquidAccounts as account (account.id)}
            <label class="fin-liquid-cell">
              <span>{account.name}</span>
              <div class="fin-pill fin-pill--amount">
                <input
                  class="fin-pill__input fin-pill__input--amount"
                  inputmode="decimal"
                  value={row.values[account.id] ?? ''}
                  placeholder="0"
                  oninput={(event) => updateCell(row.id, account.id, event.currentTarget.value)}
                  aria-label="{row.label} in {account.name}"
                />
              </div>
            </label>
          {/each}
        </div>
      </article>
    {/each}
  </div>

  <button class="fin-plus fin-plus--wide" type="button" onclick={addRow}>+ Add snapshot row</button>
</div>

<p class="muted fin-hint">
  Each row is a dated snapshot of your liquid balances. Net worth uses the latest snapshot on or before
  each month.
</p>
