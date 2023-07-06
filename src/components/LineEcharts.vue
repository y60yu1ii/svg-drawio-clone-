<template>
  <v-chart class="chart" />
</template>

<script lang="ts" setup>
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  // TooltipComponentOption,
} from "echarts/components";
import VChart from "vue-echarts";

use([
  CanvasRenderer,
  TitleComponent,
  TooltipComponent,
  LineChart,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
]);
</script>

<style scoped>
.chart {
  height: 100vh;
}
</style>
