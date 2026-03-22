import { ArrowRightOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Progress, Space } from "antd";
import type { AnalyticsModuleConfig } from "./analyticsConfig";
import { analyticsMetricLabel, analyticsMetricValue, analyticsPreviewRows, analyticsProgressValue } from "./analyticsUtils";

type Props = {
  config: AnalyticsModuleConfig;
  periodLabel: string;
  metrics: Record<string, unknown>;
  onOpenRoute: () => void;
  onOpenDetail: () => void;
};

export default function AnalyticsModuleCard({ config, periodLabel, metrics, onOpenRoute, onOpenDetail }: Props) {
  const entries = analyticsPreviewRows(metrics);
  const progressValue = analyticsProgressValue(metrics);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="h-10 w-10 rounded-2xl bg-[var(--cv-accent)]/15 border border-[var(--cv-accent)]/20 grid place-items-center text-[var(--cv-accent)]">
            {config.icon}
          </div>
          <div className="mt-3 text-white font-semibold">{config.title}</div>
          <div className="text-white/45 text-xs mt-1">{periodLabel}</div>
        </div>
        <Space direction="vertical" size={0} align="end">
          <Button type="link" className="px-0" onClick={onOpenRoute}>
            Open <ArrowRightOutlined />
          </Button>
          <Button type="link" className="px-0" icon={<EyeOutlined />} onClick={onOpenDetail}>
            Details
          </Button>
        </Space>
      </div>

      {progressValue !== undefined ? (
        <Progress
          percent={progressValue}
          showInfo={false}
          strokeColor="#f97316"
          trailColor="rgba(255,255,255,0.1)"
          className="!mt-4 !mb-4"
        />
      ) : null}

      <div className="space-y-2">
        {entries.length ? (
          entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white/55">{analyticsMetricLabel(key)}</span>
              <span className="text-white/85">{analyticsMetricValue(value)}</span>
            </div>
          ))
        ) : (
          <div className="text-white/45 text-sm">No metrics available for this window.</div>
        )}
      </div>
    </div>
  );
}
