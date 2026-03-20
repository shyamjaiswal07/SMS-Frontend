import { BellOutlined, CarOutlined, DollarOutlined, HomeOutlined, ReadOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Descriptions, Row, Spin, Table, Tabs, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import OperationsPanel from "@/features/erp/OperationsPanel";
import { erpApi, erpModuleConfigs, type DataSetConfig, type SummaryConfig } from "@/features/erp/erpApi";

type GenericRow = Record<string, unknown> & { id?: number | string };
type LoadState = { rows: GenericRow[]; count: number; loading: boolean; error?: string };
type SummaryState = { data?: Record<string, unknown>; loading: boolean; error?: string };
type ModuleKey = keyof typeof erpModuleConfigs;

const icons: Record<ModuleKey, JSX.Element> = {
  institutions: <HomeOutlined />,
  finance: <DollarOutlined />,
  hr: <TeamOutlined />,
  communications: <BellOutlined />,
  library: <ReadOutlined />,
  transport: <CarOutlined />,
};

const labels: Record<ModuleKey, string> = {
  institutions: "Institution & SaaS",
  finance: "Finance",
  hr: "HR & Payroll",
  communications: "Communication",
  library: "Library",
  transport: "Transport",
};

function normalize(data: unknown): { rows: GenericRow[]; count: number } {
  if (Array.isArray(data)) return { rows: data as GenericRow[], count: data.length };
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown[] }).results)) {
    const typed = data as { results: GenericRow[]; count?: number };
    return { rows: typed.results, count: typeof typed.count === "number" ? typed.count : typed.results.length };
  }
  return { rows: [], count: 0 };
}

function stringify(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function columnsFor(rows: GenericRow[]): ColumnsType<GenericRow> {
  const sample = rows[0];
  if (!sample) {
    return [{ title: "Data", key: "empty", render: () => <span className="text-white/50">No data</span> }];
  }
  return Object.keys(sample).slice(0, 6).map((key) => ({
    title: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    dataIndex: key,
    key,
    render: (value: unknown) => <span className="text-white/80">{stringify(value)}</span>,
  }));
}

function SummaryCards({ summaries }: { summaries: Array<{ title: string; state: SummaryState }> }) {
  if (!summaries.length) return null;
  return (
    <Row gutter={[16, 16]}>
      {summaries.map(({ title, state }) => (
        <Col xs={24} md={12} xl={8} key={title}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
            <div className="text-white font-medium mb-3">{title}</div>
            {state.loading ? <Spin /> : null}
            {state.error ? <Alert type="error" showIcon message={state.error} /> : null}
            {state.data ? (
              <Descriptions column={1} size="small" styles={{ label: { color: "rgba(255,255,255,0.55)" }, content: { color: "#e5e7eb" } }}>
                {Object.entries(state.data).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key.replace(/_/g, " ")}>{Array.isArray(value) ? JSON.stringify(value) : stringify(value)}</Descriptions.Item>
                ))}
              </Descriptions>
            ) : null}
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default function ModulesPage() {
  const [activeKey, setActiveKey] = useState<ModuleKey>("institutions");
  const [dataStates, setDataStates] = useState<Record<string, LoadState>>({});
  const [summaryStates, setSummaryStates] = useState<Record<string, SummaryState>>({});

  const loadModule = async (moduleKey: ModuleKey) => {
    const config = erpModuleConfigs[moduleKey];

    setDataStates((prev) => {
      const next = { ...prev };
      config.dataSets.forEach((item) => {
        next[item.key] = { rows: prev[item.key]?.rows ?? [], count: prev[item.key]?.count ?? 0, loading: true };
      });
      return next;
    });

    setSummaryStates((prev) => {
      const next = { ...prev };
      config.summaries.forEach((item) => {
        next[item.key] = { data: prev[item.key]?.data, loading: true };
      });
      return next;
    });

    await Promise.all([
      ...config.dataSets.map(async (item: DataSetConfig) => {
        try {
          const data = await erpApi.fetchDataSet(item);
          const normalized = normalize(data);
          setDataStates((prev) => ({ ...prev, [item.key]: { ...normalized, loading: false } }));
        } catch (error: any) {
          setDataStates((prev) => ({ ...prev, [item.key]: { rows: [], count: 0, loading: false, error: error?.response?.data?.detail ?? `Failed to load ${item.title}` } }));
        }
      }),
      ...config.summaries.map(async (item: SummaryConfig) => {
        try {
          const data = await erpApi.fetchSummary(item);
          setSummaryStates((prev) => ({ ...prev, [item.key]: { data, loading: false } }));
        } catch (error: any) {
          setSummaryStates((prev) => ({ ...prev, [item.key]: { loading: false, error: error?.response?.data?.detail ?? `Failed to load ${item.title}` } }));
        }
      }),
    ]);
  };

  useEffect(() => { void loadModule(activeKey); }, [activeKey]);

  const currentConfig = erpModuleConfigs[activeKey];
  const summaryItems = useMemo(
    () => currentConfig.summaries.map((item) => ({ title: item.title, state: summaryStates[item.key] ?? { loading: false } })),
    [activeKey, summaryStates],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            ERP <span className="text-[var(--cv-accent)]">Modules</span>
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Tenant-aware coverage for the SaaS test workflow endpoints across institution, finance, HR, communication, library, and transport modules.
          </Typography.Paragraph>
        </div>
        <Button onClick={() => void loadModule(activeKey)}>Refresh Active Module</Button>
      </div>

      <OperationsPanel />

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {(Object.keys(erpModuleConfigs) as ModuleKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={`text-left rounded-2xl border p-4 transition ${activeKey === key ? "border-[var(--cv-accent)] bg-[var(--cv-accent)]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
            >
              <div className="text-[var(--cv-accent)] mb-2">{icons[key]}</div>
              <div className="text-white font-medium">{labels[key]}</div>
              <div className="text-white/50 text-xs mt-1">{erpModuleConfigs[key].dataSets.length} endpoints</div>
            </button>
          ))}
        </div>
      </Card>

      <Tabs
        activeKey={activeKey}
        onChange={(value) => setActiveKey(value as ModuleKey)}
        items={(Object.keys(erpModuleConfigs) as ModuleKey[]).map((key) => ({
          key,
          label: labels[key],
          children: (
            <div className="space-y-4">
              <SummaryCards summaries={key === activeKey ? summaryItems : []} />
              {erpModuleConfigs[key].dataSets.map((item) => {
                const state = dataStates[item.key] ?? { rows: [], count: 0, loading: false };
                const columns = columnsFor(state.rows);
                return (
                  <Card key={item.key} className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div>
                        <div className="text-white font-medium">{item.title}</div>
                        <div className="text-white/50 text-sm">`{item.endpoint}`</div>
                      </div>
                      <Tag color="blue">{state.count} records</Tag>
                    </div>
                    {state.error ? <Alert type="error" showIcon message={state.error} className="mb-3" /> : null}
                    <Table
                      rowKey={(row) => String(row.id ?? JSON.stringify(row))}
                      loading={state.loading}
                      dataSource={state.rows}
                      columns={columns}
                      pagination={{ pageSize: 8 }}
                      scroll={{ x: true }}
                    />
                  </Card>
                );
              })}
            </div>
          ),
        }))}
      />
    </div>
  );
}
