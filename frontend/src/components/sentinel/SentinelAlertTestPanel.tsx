import { useCallback, useState } from "react";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { useI18n } from "@/i18n/I18nProvider";
import { runSentinelAlertSelfTest } from "@/lib/ionApi";

type ResultTone = "emerald" | "amber" | "rose";

export function SentinelAlertTestPanel({ testId = "sentinel-alert-test" }: { testId?: string }) {
  const { isZh } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<ResultTone>("amber");

  const onTest = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { httpStatus, result } = await runSentinelAlertSelfTest();
      setTone(result.ok ? "emerald" : httpStatus === 503 ? "amber" : "rose");
      const channel = result.channel ? ` · ${result.channel}` : "";
      const host = result.endpointHost ? ` (${result.endpointHost})` : "";
      setMessage(`${result.message}${channel}${host}`);
    } catch (error) {
      setTone("rose");
      setMessage(error instanceof Error ? error.message : isZh ? "告警自检请求失败。" : "Alert self-test request failed.");
    } finally {
      setBusy(false);
    }
  }, [isZh]);

  const bannerClass =
    tone === "emerald"
      ? "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100"
      : tone === "amber"
        ? "border-amber-300/25 bg-amber-300/[0.08] text-amber-100"
        : "border-rose-300/25 bg-rose-400/[0.08] text-rose-100";

  return (
    <GlassPanel eyebrow="AI Sentinel" testId={testId} title={isZh ? "告警通道自检" : "Alert Channel Self-Test"}>
      <p className="text-sm text-cyan-100/70">
        {isZh
          ? "向已配置的 Slack 或 Webhook 发送一条测试消息，确认 P0/P1 自动告警可达。需在服务端设置 ION_SENTINEL_SLACK_WEBHOOK_URL 或 ION_SENTINEL_ALERT_WEBHOOK_URL。"
          : "Send a test message to the configured Slack or webhook endpoint to verify P0/P1 alert delivery. Configure ION_SENTINEL_SLACK_WEBHOOK_URL or ION_SENTINEL_ALERT_WEBHOOK_URL on the server first."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <NeonButton
          className="w-full sm:w-fit"
          data-testid={`${testId}-btn`}
          disabled={busy}
          onClick={() => void onTest()}
          type="button"
        >
          {busy ? (isZh ? "测试中…" : "Testing…") : isZh ? "测试告警" : "Test Alert"}
        </NeonButton>
      </div>
      {message ? (
        <p
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${bannerClass}`}
          data-testid={`${testId}-result`}
        >
          {message}
        </p>
      ) : null}
    </GlassPanel>
  );
}
