<script lang="ts">
  import './finances.css';
  import { computeInsights } from '$lib/finances/calc';
  import { scheduleFinancesSave } from '$lib/finances/client';
  import type { FinancesData, FinancesTab } from '$lib/finances/types';
  import DebtsTable from '$lib/components/finances/DebtsTable.svelte';
  import ExpenseTable from '$lib/components/finances/ExpenseTable.svelte';
  import IncomeTable from '$lib/components/finances/IncomeTable.svelte';
  import InsightsView from '$lib/components/finances/InsightsView.svelte';
  import LiquidTable from '$lib/components/finances/LiquidTable.svelte';
  import OneOffTable from '$lib/components/finances/OneOffTable.svelte';

  let { data } = $props();

  let finances = $state<FinancesData>();
  let activeTab = $state<FinancesTab>('insights');
  let saveStatus = $state<'saved' | 'saving' | 'error'>('saved');

  $effect.pre(() => {
    if (!finances) {
      finances = structuredClone(data.finances);
    }
  });

  const insights = $derived(computeInsights(finances ?? data.finances));

  const tabs: { id: FinancesTab; label: string }[] = [
    { id: 'insights', label: 'Insights' },
    { id: 'liquid', label: 'Liquid assets' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'income', label: 'Income' },
    { id: 'debts', label: 'Debts' },
    { id: 'oneoffs', label: 'One-offs' }
  ];

  function persist() {
    if (!finances) return;
    scheduleFinancesSave(finances, (status) => {
      saveStatus = status;
    });
  }

  function saveLabel(): string {
    if (saveStatus === 'saving') return 'Saving…';
    if (saveStatus === 'error') return 'Save failed';
    return 'Saved';
  }
</script>

<svelte:head>
  <title>Finances · Personal</title>
</svelte:head>

<header class="header">
  <div>
    <h1>Finances</h1>
    <p>Track liquid assets, monthly cash flow, debts, and projections.</p>
  </div>
  <span class="fin-save-status" class:fin-save-status--error={saveStatus === 'error'}>
    {saveLabel()}
  </span>
</header>

<nav class="fin-tabs" aria-label="Finance sections">
  {#each tabs as tab (tab.id)}
    <button
      class="fin-tabs__btn"
      class:fin-tabs__btn--active={activeTab === tab.id}
      type="button"
      onclick={() => (activeTab = tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</nav>

<section class="panel fin-panel" class:fin-panel--insights={activeTab === 'insights'}>
  {#if finances}
    {#if activeTab === 'insights'}
      <InsightsView {insights} />
    {:else if activeTab === 'liquid'}
      <LiquidTable data={finances} onchange={persist} />
    {:else if activeTab === 'expenses'}
      <ExpenseTable data={finances} onchange={persist} />
    {:else if activeTab === 'income'}
      <IncomeTable data={finances} onchange={persist} />
    {:else if activeTab === 'debts'}
      <DebtsTable data={finances} onchange={persist} />
    {:else if activeTab === 'oneoffs'}
      <OneOffTable data={finances} onchange={persist} />
    {/if}
  {/if}
</section>
