import {
  CalendarOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  NotificationOutlined,
  ReloadOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Empty, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useGetAcademicYearsQuery, useGetTermsQuery } from "@/features/institutions/institutionsApiSlice";
import { formatDate, parseApiError, rowsOf } from "@/utils/platform";
import { portalApi } from "./portalApi";
import type { PortalDashboardData, PortalDocument, PortalDocumentsData, PortalInvoice, PortalStudentSummary } from "./portalTypes";

type AcademicYear = { id: number; name?: string };
type Term = { id: number; name?: string };

function currencyValue(value?: number | string | null) {
  return Number(value ?? 0);
}

function statusColor(status?: string) {
  switch (status) {
    case "PAID":
      return "green";
    case "OVERDUE":
      return "red";
    case "PARTIAL":
      return "orange";
    case "ISSUED":
      return "blue";
    case "CANCELLED":
      return "default";
    default:
      return "purple";
  }
}

export default function PortalDashboardCenter() {
  const [dashboard, setDashboard] = useState<PortalDashboardData | null>(null);
  const [documentsData, setDocumentsData] = useState<PortalDocumentsData | null>(null);
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);

  const {
    data: academicYearsData,
    isFetching: yearsLoading,
    refetch: refetchYears,
  } = useGetAcademicYearsQuery({ page: 1, page_size: 100 });
  const {
    data: termsData,
    isFetching: termsLoading,
    refetch: refetchTerms,
  } = useGetTermsQuery({ page: 1, page_size: 100 });

  const academicYears = rowsOf(academicYearsData) as AcademicYear[];
  const terms = rowsOf(termsData) as Term[];

  const loadAll = async (studentId?: number) => {
    setLoading(true);
    try {
      const { dashboardData, documentsData: nextDocumentsData, invoiceData } = await portalApi.loadWorkspace(studentId);
      setDashboard(dashboardData);
      setDocumentsData(nextDocumentsData);
      setInvoices(rowsOf(invoiceData) as PortalInvoice[]);
      if (!studentId) {
        setSelectedStudentId(dashboardData.student.id);
      }
    } catch (error) {
      message.error(parseApiError(error, "Unable to load portal workspace"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll(selectedStudentId);
  }, [selectedStudentId]);

  const studentOptions = useMemo(() => {
    const map = new Map<number, PortalStudentSummary>();
    if (dashboard?.student) {
      map.set(dashboard.student.id, dashboard.student);
    }
    for (const child of dashboard?.children ?? []) {
      map.set(child.id, child);
    }
    for (const child of documentsData?.children ?? []) {
      map.set(child.id, child);
    }
    if (documentsData?.student) {
      map.set(documentsData.student.id, documentsData.student);
    }
    return Array.from(map.values()).map((item) => ({
      value: item.id,
      label: `${item.student_id} - ${item.name}`,
    }));
  }, [dashboard, documentsData]);

  const academicYearMap = useMemo(
    () => new Map(academicYears.map((item) => [item.id, item.name ?? `Academic Year #${item.id}`])),
    [academicYears],
  );
  const termMap = useMemo(() => new Map(terms.map((item) => [item.id, item.name ?? `Term #${item.id}`])), [terms]);

  const activeStudentId = dashboard?.student.id ?? selectedStudentId;
  const activeDocuments = documentsData?.documents ?? [];
  const feeInvoices = useMemo(
    () => invoices.filter((item) => item.student === activeStudentId),
    [activeStudentId, invoices],
  );
  const reportCount = useMemo(
    () =>
      activeDocuments.filter(
        (item) => item.source === "ACADEMIC_ARTIFACT" && ["REPORT_CARD", "TRANSCRIPT"].includes(item.artifact_type ?? ""),
      ).length,
    [activeDocuments],
  );

  const invoiceColumns: ColumnsType<PortalInvoice> = [
    {
      title: "Invoice",
      dataIndex: "invoice_no",
      render: (value) => <span className="text-white/85">{value}</span>,
    },
    {
      title: "Academic Period",
      key: "period",
      render: (_, row) => (
        <div className="text-white/65">
          <div>{academicYearMap.get(row.academic_year) ?? `Year #${row.academic_year}`}</div>
          <div className="text-white/40 text-xs">{row.term ? termMap.get(row.term) ?? `Term #${row.term}` : "No term"}</div>
        </div>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      render: (_, row) => (
        <div className="text-white/60">
          <div>Issued {formatDate(row.issue_date)}</div>
          <div>Due {formatDate(row.due_date)}</div>
        </div>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, row) => (
        <div className="text-white/85">
          <div>Total {currencyValue(row.total_amount).toFixed(2)}</div>
          <div className="text-white/60">Due {currencyValue(row.due_amount).toFixed(2)}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => <Tag color={statusColor(value)}>{value ?? "UNKNOWN"}</Tag>,
    },
  ];

  const documentColumns: ColumnsType<PortalDocument> = [
    {
      title: "Document",
      key: "title",
      render: (_, row) => (
        <div>
          <div className="text-white/85 font-medium">{row.title}</div>
          <div className="text-white/45 text-xs">
            {row.source === "ACADEMIC_ARTIFACT" ? row.artifact_type?.replace(/_/g, " ") : row.document_type ?? row.source}
          </div>
        </div>
      ),
    },
    {
      title: "Issued",
      dataIndex: "issued_on",
      render: (value) => <span className="text-white/60">{formatDate(value)}</span>,
    },
    {
      title: "Verification",
      key: "verification",
      render: (_, row) => (
        <div className="text-white/60">
          {row.verification_code ? (
            <>
              <div>{row.verification_code}</div>
              {row.is_revoked ? <Tag color="red" className="!mt-2">Revoked</Tag> : null}
            </>
          ) : (
            row.document_number ?? "-"
          )}
        </div>
      ),
    },
    {
      title: "Download",
      key: "download",
      render: (_, row) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          disabled={!row.download_url || row.is_revoked}
          onClick={() => {
            if (!row.download_url) return;
            window.open(row.download_url, "_blank", "noopener,noreferrer");
          }}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Portal Dashboard
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Attendance, fees, notices, and report downloads for the currently linked learner.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          {studentOptions.length > 1 ? (
            <Select
              value={activeStudentId}
              options={studentOptions}
              className="min-w-[260px]"
              onChange={(value) => setSelectedStudentId(value)}
            />
          ) : null}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void Promise.all([loadAll(activeStudentId), refetchYears(), refetchTerms()])}
            loading={loading || yearsLoading || termsLoading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {dashboard ? (
        <>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-white/50 text-xs uppercase tracking-[0.2em]">Active Learner</div>
                <div className="mt-2 text-white text-2xl font-semibold">{dashboard.student.name}</div>
                <div className="text-white/55">{dashboard.student.student_id}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                Overdue invoices: <span className="text-white/85">{dashboard.fees.overdue_count}</span>
                <br />
                Next due date: <span className="text-white/85">{formatDate(dashboard.fees.next_due_date)}</span>
              </div>
            </div>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={6}>
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <Statistic
                  title={<span className="text-white/60">Attendance</span>}
                  value={dashboard.attendance.percentage}
                  suffix="%"
                  prefix={<CalendarOutlined className="text-[var(--cv-accent)]" />}
                  valueStyle={{ color: "#e5e7eb" }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <Statistic
                  title={<span className="text-white/60">Outstanding</span>}
                  value={currencyValue(dashboard.fees.outstanding)}
                  precision={2}
                  prefix={<WalletOutlined className="text-[var(--cv-accent)]" />}
                  valueStyle={{ color: "#e5e7eb" }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <Statistic
                  title={<span className="text-white/60">Invoices</span>}
                  value={dashboard.fees.invoice_count}
                  prefix={<NotificationOutlined className="text-[var(--cv-accent)]" />}
                  valueStyle={{ color: "#e5e7eb" }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <Statistic
                  title={<span className="text-white/60">Reports Ready</span>}
                  value={reportCount}
                  prefix={<FilePdfOutlined className="text-[var(--cv-accent)]" />}
                  valueStyle={{ color: "#e5e7eb" }}
                />
              </Card>
            </Col>
          </Row>

          <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
              <div className="text-white font-medium mb-3">Announcements</div>
              <div className="space-y-3">
                {dashboard.notices.length ? (
                  dashboard.notices.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-white font-medium">{item.title}</div>
                          <div className="text-white/45 text-xs mt-1">Published {formatDate(item.publish_at)}</div>
                        </div>
                        {item.is_pinned ? <Tag color="gold">Pinned</Tag> : null}
                      </div>
                      <div className="mt-3 text-white/70 whitespace-pre-wrap">{item.body}</div>
                    </div>
                  ))
                ) : (
                  <Empty description={<span className="text-white/45">No notices right now</span>} />
                )}
              </div>
            </Card>

            <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-white font-medium">Recent Documents & Reports</div>
                  <div className="text-white/55 text-sm">Signed downloads generated by the backend portal APIs.</div>
                </div>
                <Tag color="blue">{documentsData?.count ?? 0} total</Tag>
              </div>
              <div className="space-y-3">
                {dashboard.documents.recent.length ? (
                  dashboard.documents.recent.map((item) => (
                    <div key={`${item.source}-${item.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <div className="text-white font-medium">{item.title}</div>
                          <div className="text-white/45 text-xs mt-1">
                            {item.source === "ACADEMIC_ARTIFACT" ? item.artifact_type?.replace(/_/g, " ") : item.document_type ?? item.source}
                          </div>
                        </div>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          disabled={!item.download_url || item.is_revoked}
                          onClick={() => {
                            if (!item.download_url) return;
                            window.open(item.download_url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          Open
                        </Button>
                      </div>
                      <div className="mt-3 text-white/60 text-sm">Issued {formatDate(item.issued_on)}</div>
                    </div>
                  ))
                ) : (
                  <Empty description={<span className="text-white/45">No recent documents</span>} />
                )}
              </div>
            </Card>
          </div>

          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <div className="text-white font-medium mb-3">Fee Schedule & Status</div>
            {feeInvoices.length ? (
              <Table
                rowKey="id"
                dataSource={feeInvoices}
                columns={invoiceColumns}
                loading={loading || yearsLoading || termsLoading}
                pagination={{ pageSize: 6 }}
              />
            ) : (
              <Empty description={<span className="text-white/45">No invoices available for this learner</span>} />
            )}
          </Card>

          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <div className="text-white font-medium mb-3">All Documents & Reports</div>
            {activeDocuments.length ? (
              <Table
                rowKey={(row) => `${row.source}-${row.id}`}
                dataSource={activeDocuments}
                columns={documentColumns}
                loading={loading}
                pagination={{ pageSize: 8 }}
              />
            ) : (
              <Empty description={<span className="text-white/45">No documents or reports available</span>} />
            )}
          </Card>
        </>
      ) : (
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <Empty description={<span className="text-white/45">Portal data will appear here once a linked learner is available.</span>} />
        </Card>
      )}
    </div>
  );
}
