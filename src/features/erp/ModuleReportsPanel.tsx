import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Table, Tabs, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { erpApi } from "@/features/erp/erpApi";
import { currentTenant, downloadFromApi, parseApiError } from "@/utils/platform";

type ModuleKey = "library" | "transport";

type LibraryAnalytics = {
  start_date?: string;
  end_date?: string;
  summary?: Record<string, unknown>;
  daily_trends?: Array<Record<string, unknown>>;
  top_books?: Array<Record<string, unknown>>;
  member_type_breakdown?: Array<Record<string, unknown>>;
};
type OverdueReport = {
  count?: number;
  results?: Array<Record<string, unknown>>;
};
type OccupancyReport = { count?: number; results?: Array<Record<string, unknown>> };
type UtilizationReport = { route_rows?: Array<Record<string, unknown>>; stop_rows?: Array<Record<string, unknown>> };
type CostTrendReport = {
  start_date?: string;
  end_date?: string;
  monthly_trend?: Array<Record<string, unknown>>;
  vehicle_rows?: Array<Record<string, unknown>>;
  summary?: Record<string, unknown>;
};

function dynamicColumns(rows: Array<Record<string, unknown>>): ColumnsType<Record<string, unknown>> {
  const sample = rows[0];
  if (!sample) {
    return [{ title: "Data", key: "empty", render: () => <span className="text-white/50">No data</span> }];
  }
  return Object.keys(sample).map((key) => ({
    title: key.replace(/_/g, " "),
    dataIndex: key,
    key,
    render: (value: unknown) => <span className="text-white/75">{String(value ?? "-")}</span>,
  }));
}

export default function ModuleReportsPanel({ moduleKey }: { moduleKey: ModuleKey }) {
  const tenant = currentTenant();
  const [loading, setLoading] = useState(false);
  const [libraryDueBefore, setLibraryDueBefore] = useState("");
  const [transportStartDate, setTransportStartDate] = useState("");
  const [transportEndDate, setTransportEndDate] = useState("");
  const [libraryAnalytics, setLibraryAnalytics] = useState<LibraryAnalytics | null>(null);
  const [overdueReport, setOverdueReport] = useState<OverdueReport | null>(null);
  const [occupancyReport, setOccupancyReport] = useState<OccupancyReport | null>(null);
  const [utilizationReport, setUtilizationReport] = useState<UtilizationReport | null>(null);
  const [costTrendReport, setCostTrendReport] = useState<CostTrendReport | null>(null);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const { analyticsData, overdueData } = await erpApi.reports.loadLibrary(libraryDueBefore);
      setLibraryAnalytics(analyticsData as LibraryAnalytics);
      setOverdueReport(overdueData as OverdueReport);
    } catch (error) {
      message.error(parseApiError(error, "Unable to load library reports"));
    } finally {
      setLoading(false);
    }
  };

  const loadTransport = async () => {
    setLoading(true);
    try {
      const params = transportStartDate || transportEndDate ? { start_date: transportStartDate || undefined, end_date: transportEndDate || undefined } : undefined;
      const { occupancyData, utilizationData, costTrendData } = await erpApi.reports.loadTransport(params);
      setOccupancyReport(occupancyData as OccupancyReport);
      setUtilizationReport(utilizationData as UtilizationReport);
      setCostTrendReport(costTrendData as CostTrendReport);
    } catch (error) {
      message.error(parseApiError(error, "Unable to load transport reports"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moduleKey === "library") {
      void loadLibrary();
    } else {
      void loadTransport();
    }
  }, [moduleKey]);

  const librarySummaryCards = useMemo(() => Object.entries(libraryAnalytics?.summary ?? {}), [libraryAnalytics?.summary]);
  const transportSummaryCards = useMemo(() => Object.entries(costTrendReport?.summary ?? {}), [costTrendReport?.summary]);

  if (moduleKey === "library") {
    return (
      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <Typography.Title level={4} className="!mb-0 text-white">
              Library Reporting
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-white/60">
              Overdue reporting, analytics, and late-fee automation for {tenant?.name ?? "current tenant"}.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Input type="date" value={libraryDueBefore} onChange={(event) => setLibraryDueBefore(event.target.value)} />
            <Button icon={<ReloadOutlined />} onClick={() => void loadLibrary()} loading={loading}>Refresh</Button>
            <Button icon={<DownloadOutlined />} onClick={() => void downloadFromApi(`/api/library/book-issues/overdue-report/${libraryDueBefore ? `?due_before=${libraryDueBefore}&` : "?"}export_format=CSV`, "library-overdue-report.csv")}>CSV</Button>
            <Button icon={<DownloadOutlined />} onClick={() => void downloadFromApi(`/api/library/book-issues/overdue-report/${libraryDueBefore ? `?due_before=${libraryDueBefore}&` : "?"}export_format=XLSX`, "library-overdue-report.xlsx")}>XLSX</Button>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              onClick={async () => {
                try {
                  await erpApi.reports.runLibraryLateFees();
                  message.success("Library late-fee automation queued");
                  await loadLibrary();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to queue library late-fee automation"));
                }
              }}
            >
              Run Late Fees
            </Button>
          </Space>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          {librarySummaryCards.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/55 text-xs uppercase tracking-wider">{key.replace(/_/g, " ")}</div>
              <div className="text-white font-medium mt-1">{String(value)}</div>
            </div>
          ))}
        </div>

        <Tabs
          defaultActiveKey="overdue"
          items={[
            {
              key: "overdue",
              label: "Overdue Report",
              children: <Table rowKey={(row) => String(row.issue_id ?? JSON.stringify(row))} loading={loading} dataSource={overdueReport?.results ?? []} columns={dynamicColumns(overdueReport?.results ?? [])} pagination={{ pageSize: 6 }} scroll={{ x: true }} />,
            },
            {
              key: "daily",
              label: "Daily Trends",
              children: <Table rowKey={(row) => String(row.date ?? JSON.stringify(row))} loading={loading} dataSource={libraryAnalytics?.daily_trends ?? []} columns={dynamicColumns(libraryAnalytics?.daily_trends ?? [])} pagination={{ pageSize: 6 }} scroll={{ x: true }} />,
            },
            {
              key: "books",
              label: "Top Books",
              children: <Table rowKey={(row) => String(row.book_id ?? JSON.stringify(row))} loading={loading} dataSource={libraryAnalytics?.top_books ?? []} columns={dynamicColumns(libraryAnalytics?.top_books ?? [])} pagination={{ pageSize: 6 }} scroll={{ x: true }} />,
            },
            {
              key: "members",
              label: "Member Mix",
              children: <Table rowKey={(row) => String(row.member_type ?? JSON.stringify(row))} loading={loading} dataSource={libraryAnalytics?.member_type_breakdown ?? []} columns={dynamicColumns(libraryAnalytics?.member_type_breakdown ?? [])} pagination={{ pageSize: 6 }} scroll={{ x: true }} />,
            },
          ]}
        />
      </Card>
    );
  }

  return (
    <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <Typography.Title level={4} className="!mb-0 text-white">
            Transport Reporting
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Occupancy, utilization, and maintenance trend reporting for transport operations.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Input type="date" value={transportStartDate} onChange={(event) => setTransportStartDate(event.target.value)} />
          <Input type="date" value={transportEndDate} onChange={(event) => setTransportEndDate(event.target.value)} />
          <Button icon={<ReloadOutlined />} onClick={() => void loadTransport()} loading={loading}>Refresh</Button>
        </Space>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {transportSummaryCards.map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/55 text-xs uppercase tracking-wider">{key.replace(/_/g, " ")}</div>
            <div className="text-white font-medium mt-1">{String(value)}</div>
          </div>
        ))}
      </div>

      <Tabs
        defaultActiveKey="occupancy"
        items={[
          {
            key: "occupancy",
            label: "Route Occupancy",
            children: <Table rowKey={(row) => String(row.route_id ?? JSON.stringify(row))} loading={loading} dataSource={occupancyReport?.results ?? []} columns={dynamicColumns(occupancyReport?.results ?? [])} pagination={{ pageSize: 6 }} scroll={{ x: true }} />,
          },
          {
            key: "utilization-routes",
            label: "Utilization by Route",
            children: <Table rowKey={(row) => String(row.route_id ?? JSON.stringify(row))} loading={loading} dataSource={utilizationReport?.route_rows ?? []} columns={dynamicColumns(utilizationReport?.route_rows ?? [])} pagination={{ pageSize: 6 }} scroll={{ x: true }} />,
          },
          {
            key: "utilization-stops",
            label: "Utilization by Stop",
            children: <Table rowKey={(row) => String(row.stop_id ?? JSON.stringify(row))} loading={loading} dataSource={utilizationReport?.stop_rows ?? []} columns={dynamicColumns(utilizationReport?.stop_rows ?? [])} pagination={{ pageSize: 6 }} scroll={{ x: true }} />,
          },
          {
            key: "cost-trend",
            label: "Cost Trend",
            children: (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/65 text-sm">
                  Window: <span className="text-white/80">{costTrendReport?.start_date || "-"} to {costTrendReport?.end_date || "-"}</span>
                </div>
                <div>
                  <div className="text-white font-medium mb-2">Monthly Trend</div>
                  <Table rowKey={(row) => String(row.month ?? JSON.stringify(row))} loading={loading} dataSource={costTrendReport?.monthly_trend ?? []} columns={dynamicColumns(costTrendReport?.monthly_trend ?? [])} pagination={{ pageSize: 6 }} scroll={{ x: true }} />
                </div>
                <div>
                  <div className="text-white font-medium mb-2">Vehicle Totals</div>
                  <Table rowKey={(row) => String(row.vehicle_id ?? JSON.stringify(row))} loading={loading} dataSource={costTrendReport?.vehicle_rows ?? []} columns={dynamicColumns(costTrendReport?.vehicle_rows ?? [])} pagination={{ pageSize: 6 }} scroll={{ x: true }} />
                </div>
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}
