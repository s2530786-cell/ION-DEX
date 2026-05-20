import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ION DEX] render crash", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "2rem",
            background: "#030716",
            color: "#f8fbff",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ color: "#24f7ff", marginTop: 0 }}>ION DEX 渲染错误</h1>
          <p>页面未加载是因为 React 组件抛错，不是 Mock 数据本身。</p>
          <pre
            style={{
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: "12px",
              background: "rgba(255,59,212,0.12)",
              border: "1px solid rgba(255,59,212,0.35)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {this.state.error.message}
          </pre>
          <p style={{ marginTop: "1rem", opacity: 0.75 }}>
            请把上述信息发给开发者，或硬刷新（Ctrl+F5）后重试 http://127.0.0.1:3001/
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
