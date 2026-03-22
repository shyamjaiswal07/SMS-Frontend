import { DownloadOutlined, ReloadOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Tabs, Typography, message } from "antd";
import { useMemo, useState } from "react";
import WorkspaceResourceCard from "@/features/workspace/WorkspaceResourceCard";
import WorkspaceSummaryGrid from "@/features/workspace/WorkspaceSummaryGrid";
import { buildDynamicColumns } from "@/features/workspace/workspaceUtils";
import { libraryApi } from "./libraryApi";
import { useGetLibraryAnalyticsQuery, useGetOverdueBookIssuesQuery } from "./libraryApiSlice";
import { parseApiError } from "@/utils/platform";

export default function LibraryReportsPanel() {
  const [dueBefore, setDueBefore] = useState("");
  const analyticsQuery = useGetLibraryAnalyticsQuery();
  const overdueQuery = useGetOverdueBookIssuesQuery(
    dueBefore ? { page: 1, page_size: 200, due_before: dueBefore } : { page: 1, page_size: 200 },
  );

  const loading = analyticsQuery.isFetching || overdueQuery.isFetching;
  const analytics = analyticsQuery.data;
  const summary = useMemo(
    () => ({
      ...(analytics?.summary ?? {}),
      overdue_items: overdueQuery.data?.count ?? 0,
    }),
    [analytics?.summary, overdueQuery.data?.count],
  );

  const refresh = async () => {
    await Promise.all([analyticsQuery.refetch(), overdueQuery.refetch()]);
  };

  return (
    <div className="space-y-4">
      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Typography.Title level={4} className="!mb-0 !text-white">
              Library Reports
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-white/60">
              Review overdue circulation, book movement trends, and membership mix without leaving the library module.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Input type="date" value={dueBefore} onChange={(event) => setDueBefore(event.target.value)} />
            <Button icon={<ReloadOutlined />} onClick={() => void refresh()} loading={loading}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => void libraryApi.downloadOverdueReport(dueBefore || undefined, "CSV")}>
              CSV
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => void libraryApi.downloadOverdueReport(dueBefore || undefined, "XLSX")}>
              XLSX
            </Button>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              icon={<ThunderboltOutlined />}
              onClick={async () => {
                try {
                  await libraryApi.runLateFees();
                  message.success("Library late-fee automation queued");
                  await refresh();
                } catch (error) {
                  message.error(parseApiError(error, "Unable to queue library late fees"));
                }
              }}
            >
              Run Late Fees
            </Button>
          </Space>
        </div>
      </Card>

      <WorkspaceSummaryGrid summary={summary} />

      <Tabs
        defaultActiveKey="overdue"
        items={[
          {
            key: "overdue",
            label: "Overdue",
            children: (
              <WorkspaceResourceCard
                title="Overdue Report"
                description="Tenant-aware overdue issues filtered by optional due date."
                endpoint="/api/library/book-issues/overdue-report/"
                rows={overdueQuery.data?.results ?? []}
                loading={loading}
                columns={buildDynamicColumns(overdueQuery.data?.results ?? [])}
              />
            ),
          },
          {
            key: "daily",
            label: "Daily Trends",
            children: (
              <WorkspaceResourceCard
                title="Daily Trends"
                description="Recent circulation movement grouped by day."
                endpoint="/api/library/book-issues/analytics/"
                rows={analytics?.daily_trends ?? []}
                loading={loading}
                columns={buildDynamicColumns(analytics?.daily_trends ?? [])}
              />
            ),
          },
          {
            key: "books",
            label: "Top Books",
            children: (
              <WorkspaceResourceCard
                title="Top Books"
                description="Most active titles in the current analytics window."
                endpoint="/api/library/book-issues/analytics/"
                rows={analytics?.top_books ?? []}
                loading={loading}
                columns={buildDynamicColumns(analytics?.top_books ?? [])}
              />
            ),
          },
          {
            key: "members",
            label: "Member Mix",
            children: (
              <WorkspaceResourceCard
                title="Member Mix"
                description="Breakdown of circulation by member type."
                endpoint="/api/library/book-issues/analytics/"
                rows={analytics?.member_type_breakdown ?? []}
                loading={loading}
                columns={buildDynamicColumns(analytics?.member_type_breakdown ?? [])}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
