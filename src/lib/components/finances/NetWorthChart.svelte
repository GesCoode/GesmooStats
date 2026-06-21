<script lang="ts">
  import { formatCompactCurrency } from '$lib/finances/format';

  type Point = {
    date: string;
    label: string;
    value: number;
  };

  let {
    points,
    height = 320,
    formatValue = formatCompactCurrency
  }: {
    points: Point[];
    height?: number;
    formatValue?: (value: number) => string;
  } = $props();

  const width = 900;
  const padding = { top: 16, right: 16, bottom: 36, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = $derived(height - padding.top - padding.bottom);

  const values = $derived(points.map((point) => point.value));
  const minValue = $derived(values.length ? Math.min(...values, 0) : 0);
  const maxValue = $derived(values.length ? Math.max(...values, 0) : 1);
  const valueSpan = $derived(Math.max(maxValue - minValue, 1));

  const labelIndexes = $derived.by(() => {
    const count = points.length;
    if (count <= 1) return [0];
    const maxLabels = 8;
    const step = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));
    const indexes = [];
    for (let index = 0; index < count; index += step) indexes.push(index);
    if (indexes[indexes.length - 1] !== count - 1) indexes.push(count - 1);
    return indexes;
  });

  const yTicks = $derived.by(() => {
    const ticks = 4;
    return Array.from({ length: ticks + 1 }, (_, index) => minValue + (valueSpan / ticks) * index);
  });

  const zeroY = $derived(padding.top + plotHeight - ((0 - minValue) / valueSpan) * plotHeight);

  const plotPoints = $derived.by(() =>
    points.map((point, index) => ({
      ...point,
      x: xAt(index, points.length),
      y: yAt(point.value)
    }))
  );

  const areaSegments = $derived.by(() => {
    const segments: { path: string; positive: boolean }[] = [];
    const plotted = plotPoints;

    for (let index = 0; index < plotted.length - 1; index += 1) {
      const start = plotted[index];
      const end = plotted[index + 1];

      if (start.value === 0 && end.value === 0) continue;

      if (
        (start.value > 0 && end.value < 0) ||
        (start.value < 0 && end.value > 0)
      ) {
        const ratio = start.value / (start.value - end.value);
        const crossX = start.x + ratio * (end.x - start.x);
        const cross = { x: crossX, y: zeroY, value: 0 };
        segments.push({
          path: areaPath(start, cross),
          positive: start.value >= 0
        });
        segments.push({
          path: areaPath(cross, end),
          positive: end.value >= 0
        });
        continue;
      }

      segments.push({
        path: areaPath(start, end),
        positive: start.value >= 0 && end.value >= 0
      });
    }

    return segments;
  });

  const linePath = $derived(
    plotPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')
  );

  function xAt(index: number, count: number): number {
    if (count <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (count - 1)) * plotWidth;
  }

  function yAt(value: number): number {
    return padding.top + plotHeight - ((value - minValue) / valueSpan) * plotHeight;
  }

  function areaPath(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): string {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y} L ${end.x} ${zeroY} L ${start.x} ${zeroY} Z`;
  }
</script>

<div class="fin-line-chart fin-networth-chart">
  <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Net worth over time">
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

    <line
      x1={padding.left}
      x2={width - padding.right}
      y1={zeroY}
      y2={zeroY}
      class="fin-line-chart__zero fin-networth-chart__zero"
    />

    {#each areaSegments as segment, index (index)}
      <path
        d={segment.path}
        class={segment.positive
          ? 'fin-networth-chart__area fin-networth-chart__area--positive'
          : 'fin-networth-chart__area fin-networth-chart__area--negative'}
      />
    {/each}

    {#if linePath}
      <path d={linePath} class="fin-networth-chart__line" fill="none" />
    {/if}

    {#each labelIndexes as index (index)}
      <text
        x={xAt(index, points.length)}
        y={height - 10}
        class="fin-line-chart__label"
        text-anchor="middle"
      >
        {points[index]?.label}
      </text>
    {/each}
  </svg>
</div>
