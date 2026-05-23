<template>
  <div class="ion-glass rounded-2xl p-5 ion-liquid-border mt-5">
    <h3 class="text-lg font-bold mb-4">交易历史</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-white/50 border-b border-white/10">
            <th class="text-left py-2">交易对</th>
            <th class="text-right py-2">类型</th>
            <th class="text-right py-2">数量</th>
            <th class="text-right py-2">时间</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr>
            <td class="py-3">ION/USDT</td>
            <td class="text-right text-ion-neon-green">买入</td>
            <td class="text-right">520.00</td>
            <td class="text-right text-white/50">05-22 10:30</td>
          </tr>
          <tr>
            <td class="py-3">ION/BNB</td>
            <td class="text-right text-ion-neon-pink">卖出</td>
            <td class="text-right">180.50</td>
            <td class="text-right text-white/50">05-22 09:15</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
