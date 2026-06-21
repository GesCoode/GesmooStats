<script lang="ts">
  type Series = {
    id: string;
    label: string;
    color: string;
    points: { date: string; label: string; value: number }[];
  };

  let {
    series,
    height = 220,
    formatValue = (value: number) => value.toLocaleString(undefined, { style: 'currency', currency: 'EUR' }),
    zeroLine = false
  }: {
    series: Series[];
    height?: number;
    formatValue?: (value: number) => string;
    zeroLine?: boolean;
  } = $props();

  const width = 900;
  const padding = { top: 16, right: 16, bottom: 36, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = $derived(height - padding.top - padding.bottom);

  const allValues = $derived(
    series.flatMap((item) => item.points.map((point) => point.value)).filter(Number.isFinite)
  );
  const minValue = $derived(allValues.length ? Math.min(...allValues, zeroLine ? 0 : Infinity) : 0);
  const maxValue = $derived(allValues.length ? Math.max(...allValues, zeroLine ? 0 : -Infinity) : 1);
  const valueSpan = $derived(Math.max(maxValue - minValue, 1));

  const labelIndexes = $derived.by(() => {
    const count = series[0]?.points.length ?? 0;
    if (count <= 1) return [0];
    const maxLabels = 8;
    const step = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));
    const indexes = [];
    for (let index = 0; index < count; index += step) indexes.push(index);
    if (indexes[indexes.length - 1] !== count - 1) indexes.push(count - 1);
    return indexes;
  });

  function xAt(index: number, count: number): number {
    if (count <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (count - 1)) * plotWidth;
  }

  function yAt(value: number): number {
    return padding.top + plotHeight - ((value - minValue) / valueSpan) * plotHeight;
  }

  function linePath(points: { value: number }[]): string {
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xAt(index, points.length)} ${yAt(point.value)}`)
      .join(' ');
  }

  const yTicks = $derived.by(() => {
    const ticks = 4;
    return Array.from({ length: ticks + 1 }, (_, index) => minValue + (valueSpan / ticks) * index);
  });
</script>

<div class="fin-line-chart">
  <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Chart">
    {#each yTicks as tick (tick)}
      <line
        x1={padding.left}
        x2={width - padding.right}
        y1={yAt(tick)}
        y2={yAt(tick)}
        class="fin-line-chart__grid"
      />
      <text x={padding.left - 8} y={yAt(tick) + 4} class="fin-line-chart__tick" text-anchor="end">
        {formatValue(tick)}
      </text>
    {/each}

    {#if zeroLine && minValue < 0 && maxValue > 0}
      <line
        x1={padding.left}
        x2={width - padding.right}
        y1={yAt(0)}
        y2={yAt(0)}
        class="fin-line-chart__zero"
      />
    {/if}

    {#each series as item (item.id)}
      <path d={linePath(item.points)} class="fin-line-chart__line" stroke={item.color} fill="none" />
      {#each item.points as point, index (point.date)}
        <circle
          cx={xAt(index, item.points.length)}
          cy={yAt(point.value)}
          r="2.5"
          fill={item.color}
          class="fin-line-chart__dot"
        />
      {/each}
    {/each}

    {#if series[0]}
      {#each labelIndexes as index (index)}
        <text
          x={xAt(index, series[0].points.length)}
          y={height - 10}
          class="fin-line-chart__label"
          text-anchor="middle"
        >
          {series[0].points[index]?.label}
        </text>
      {/each}
    {/if}
  </svg>

  {#if series.length > 1}
    <ul class="fin-line-chart__legend">
      {#each series as item (item.id)}
        <li><span class="fin-line-chart__swatch" style={`background:${item.color}`}></span>{item.label}</li>
      {/each}
    </ul>
  {/if}
</div>
