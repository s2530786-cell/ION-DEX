/// <reference types="vite/client" />

interface Window {
  ethereum?: any
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
