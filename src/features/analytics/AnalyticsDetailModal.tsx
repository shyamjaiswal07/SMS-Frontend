import { Modal, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { analyticsMetricRows, analyticsMetricValue } from "./analyticsUtils";
import type { AnalyticsModuleResponse } from "./analyticsTypes";

type DetailRow = {
  key: string;
  label: string;
  value: unknown;
};

type Props = {
  open: boolean;
  loading?: boolean;
  detail?: AnalyticsModuleResponse;
  title?: string;
  onClose: () => void;
};

const detailColumns: ColumnsType<DetailRow> = [
  { title: "Metric", dataIndex: "label", render: (value) => <span className="text-white/80">{value}</span> },
  {
    title: "Value",
    dataIndex: "value",
    render: (value) => {
      if (typeof value === "number") {
        return <Tag color="blue">{value}</Tag>;
      }
      return <span className="text-white/85">{analyticsMetricValue(value)}</span>;
    },
  },
];

export default function AnalyticsDetailModal({ open, loading = false, detail, title, onClose }: Props) {
  const rows = analyticsMetricRows(detail?.kpis);

  return (
    <Modal title={title ?? "Module Analytics"} open={open} footer={null} onCancel={onClose} width={820}>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-white/65">
          {detail?.period?.start_date || "-"} to {detail?.period?.end_date || "-"}
        </div>
        {detail?.module ? <Tag color="blue">{detail.module}</Tag> : null}
      </div>
      <Table rowKey="key" loading={loading} dataSource={rows} columns={detailColumns} pagination={false} />
    </Modal>
  );
}
