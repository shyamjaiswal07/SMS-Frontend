import { ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space } from "antd";

type Props = {
  startDate: string;
  endDate: string;
  loading?: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export default function AnalyticsFilters({
  startDate,
  endDate,
  loading = false,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
}: Props) {
  return (
    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-white/60 text-sm">
          Filter the shared analytics window. Module drill-downs follow the same date range.
        </div>
        <Space wrap>
          <Input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
          <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" onClick={onApply} loading={loading}>
            Apply
          </Button>
          <Button icon={<ReloadOutlined />} onClick={onReset} loading={loading}>
            Reset
          </Button>
        </Space>
      </div>
    </Card>
  );
}
