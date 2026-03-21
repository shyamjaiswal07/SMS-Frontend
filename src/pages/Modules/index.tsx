import { BellOutlined, CarOutlined, DollarOutlined, HomeOutlined, ReadOutlined, TeamOutlined, SyncOutlined } from "@ant-design/icons";
import { Alert, Spin, Table, Typography } from "antd";
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {summaries.map(({ title, state }) => (
        <div key={title} className="h-full relative group p-6 rounded-[2rem] border border-white/10 bg-[var(--cv-card)] backdrop-blur-xl overflow-hidden shadow-xl hover:-translate-y-1 transition-all duration-500 hover:border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--cv-accent)]/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="text-white/60 font-semibold mb-4 uppercase tracking-widest text-xs flex items-center justify-between">
              {title}
              {state.loading && <div className="h-2 w-2 rounded-full bg-[var(--cv-accent)] animate-pulse shadow-[0_0_8px_var(--cv-accent)]" />}
            </div>
            
            {state.loading ? (
              <div className="flex justify-center py-6"><Spin size="large" /></div>
            ) : null}
            {state.error ? (
              <Alert type="error" showIcon message={state.error} className="mb-2 !bg-red-500/10 !border-red-500/30 !text-red-200 !rounded-xl" />
            ) : null}
            {state.data ? (
              <div className="space-y-3 mt-4">
                {Object.entries(state.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                    <span className="text-white/50 text-sm">{key.replace(/_/g, " ")}</span>
                    <span className="text-white font-medium text-right text-base max-w-[60%] truncate" title={Array.isArray(value) ? JSON.stringify(value) : stringify(value)}>
                      {Array.isArray(value) ? JSON.stringify(value) : stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
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
    <div className="space-y-8 relative pb-10">
      {/* Background ambient glow */}
      <div className="absolute top-[-3rem] left-1/3 w-[600px] h-[400px] bg-[var(--cv-accent)]/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div>
          <Typography.Title level={2} className="!mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight font-extrabold flex items-center gap-3">
            ERP <span className="text-[var(--cv-accent)]">Modules</span>
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/50 max-w-2xl text-sm md:text-base leading-relaxed">
            Tenant-aware coverage for the SaaS test workflow endpoints across institution, finance, HR, communication, library, and transport modules.
          </Typography.Paragraph>
        </div>
        <button 
          onClick={() => void loadModule(activeKey)}
          className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--cv-accent)] text-white font-semibold hover:bg-[var(--cv-accent)]/80 transition-all duration-300 active:scale-95 shadow-lg shadow-[var(--cv-accent)]/20 hover:shadow-[var(--cv-accent)]/40"
        >
          <SyncOutlined className="transition-transform duration-500 group-hover:rotate-180" />
          Refresh Module
        </button>
      </div>

      <OperationsPanel />

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 relative z-10">
        {(Object.keys(erpModuleConfigs) as ModuleKey[]).map((key) => {
          const isActive = activeKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={`group relative overflow-hidden text-left rounded-3xl p-5 transition-all duration-400 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-2xl ${
                isActive 
                  ? "bg-gradient-to-b from-[var(--cv-accent)]/20 to-[var(--cv-accent)]/5 border border-[var(--cv-accent)]/50 shadow-[0_8px_30px_rgba(var(--cv-accent-rgb),0.15)]" 
                  : "border border-white/10 bg-[var(--cv-card)] hover:bg-white/5"
              }`}
            >
              <div className="relative z-10 flex flex-col items-center text-center gap-3">
                <div className={`h-[52px] w-[52px] shrink-0 rounded-2xl grid place-items-center text-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-[var(--cv-accent)] text-white shadow-lg shadow-[var(--cv-accent)]/40 scale-105' 
                    : 'bg-[var(--cv-accent)]/10 border border-[var(--cv-accent)]/20 text-[var(--cv-accent)] group-hover:bg-[var(--cv-accent)]/20 group-hover:scale-110'
                }`}>
                  {icons[key]}
                </div>
                <div>
                  <div className={`font-bold transition-colors ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                    {labels[key]}
                  </div>
                  <div className={`text-xs mt-1 transition-colors font-medium ${isActive ? 'text-[var(--cv-accent)]' : 'text-white/40 group-hover:text-white/60'}`}>
                    {erpModuleConfigs[key].dataSets.length} Endpoints
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Module Content Display */}
      <div className="space-y-6 transition-all duration-500 ease-out transform opacity-100 translate-y-0">
        <SummaryCards summaries={summaryItems} />
        
        {currentConfig.dataSets.map((item) => {
          const state = dataStates[item.key] ?? { rows: [], count: 0, loading: false };
          const columns = columnsFor(state.rows);
          return (
            <div key={item.key} className="bg-[var(--cv-card)] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-xl transition-all hover:border-[var(--cv-accent)]/40 hover:shadow-[0_0_30px_rgba(var(--cv-accent-rgb),0.05)]">
              <div className="p-6 md:px-8 border-b border-white/5 flex items-center justify-between gap-4 flex-wrap bg-gradient-to-r from-white/[0.03] to-transparent">
                <div>
                  <h3 className="text-xl text-white font-bold tracking-tight mb-2 flex items-center gap-3">
                    {item.title}
                    {state.loading && <div className="h-2 w-2 rounded-full bg-[var(--cv-accent)] animate-pulse" />}
                  </h3>
                  <div className="text-[var(--cv-accent)]/80 text-sm font-mono bg-[var(--cv-accent)]/10 px-3 py-1 rounded-lg inline-block border border-[var(--cv-accent)]/20">
                    {item.endpoint}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-5 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-semibold shadow-[0_0_15px_rgba(59,130,246,0.1)] backdrop-blur-sm">
                    {state.count} Records
                  </span>
                </div>
              </div>
              
              <div className="p-4 md:p-6">
                {state.error ? <Alert type="error" showIcon message={state.error} className="mb-6 !bg-red-500/10 !border-red-500/30 !text-red-200 !rounded-xl" /> : null}
                
                <Table
                  rowKey={(row) => String(row.id ?? JSON.stringify(row))}
                  loading={state.loading}
                  dataSource={state.rows}
                  columns={columns}
                  pagination={{ pageSize: 8, className: "custom-pagination" }}
                  scroll={{ x: true }}
                  className="custom-table"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
