import { Card, Input, Select, Space, Spin, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useGetAssessmentsQuery, useGetAssessmentResultsQuery } from "../academicsApiSlice";
import type { AssessmentResultRow, AssessmentRow } from "../academicsTypes";
import { rowsOf } from "@/utils/platform";

type TabProps = {
  defaultSearch?: string;
};

const feedbackTagColor = (s?: string) => {
  if (!s) return "default";
  const t = s.toLowerCase();
  if (t.includes("excellent") || t.includes("good")) return "success";
  if (t.includes("average") || t.includes("needs")) return "processing";
  if (t.includes("poor") || t.includes("bad")) return "error";
  return "default";
};

export default function AssessmentResultsTab({ defaultSearch }: TabProps) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [searchInput, setSearchInput] = useState(defaultSearch ?? "");
  const [search, setSearch] = useState(defaultSearch ?? "");

  const [assessmentId, setAssessmentId] = useState<number | "ALL">("ALL");

  const { data: assessmentsData, isFetching: assessmentsLoading } = useGetAssessmentsQuery({ page: 1, page_size: 200 });
  const assessments = (rowsOf(assessmentsData) as AssessmentRow[]) || [];

  const selectedAssessment = assessments.find((a) => a.id === assessmentId);
  const query =
    assessmentId !== "ALL" && selectedAssessment?.title
      ? selectedAssessment.title
      : search || undefined;

  const { data: resultsData, isFetching: loading } = useGetAssessmentResultsQuery({
    search: query,
    page,
    page_size: pageSize,
  });

  const rows = rowsOf(resultsData) as AssessmentResultRow[];
  const total = typeof resultsData?.count === "number" ? resultsData.count : rows.length;

  useEffect(() => {
    setPage(1);
  }, [search, assessmentId]);

  const columns: ColumnsType<AssessmentResultRow> = useMemo(
    () => [
      {
        title: "Assessment",
        key: "assessment",
        render: (_, r) => <span className="text-white/80">{r.assessment ?? "—"}</span>,
      },
      {
        title: "Enrollment",
        key: "enrollment",
        render: (_, r) => <span className="text-white/80">{r.enrollment ?? "—"}</span>,
      },
      {
        title: "Marks",
        dataIndex: "marks_obtained",
        key: "marks_obtained",
        render: (v) => <span className="text-white/90">{v ?? "—"}</span>,
      },
      {
        title: "Graded By",
        dataIndex: "graded_by",
        key: "graded_by",
        render: (v) => <span className="text-white/70">{v ?? "—"}</span>,
      },
      {
        title: "Graded At",
        dataIndex: "graded_at",
        key: "graded_at",
        render: (v) => <span className="text-white/70">{v ? String(v) : "—"}</span>,
      },
      {
        title: "Feedback",
        dataIndex: "feedback",
        key: "feedback",
        render: (v) =>
          v ? (
            <Tag color={feedbackTagColor(String(v))}>{String(v).slice(0, 28)}{String(v).length > 28 ? "…" : ""}</Tag>
          ) : (
            "—"
          ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 items-center flex-wrap">
          <Select
            className="min-w-[220px]"
            value={assessmentId}
            onChange={(v) => setAssessmentId(v as any)}
            loading={assessmentsLoading}
            options={[
              { label: "All assessments", value: "ALL" as const },
              ...assessments.map((a) => ({ label: a.title ?? `Assessment #${a.id}`, value: a.id })),
            ]}
          />
          <Input.Search
            allowClear
            placeholder="Search by student id or assessment title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(val) => setSearch(val)}
            className="min-w-[360px]"
          />
        </div>
        <div className="text-xs text-white/50">{loading ? "Loading..." : `Showing ${rows.length} rows`}</div>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Spin />
          </div>
        ) : (
          <Table<AssessmentResultRow>
            rowKey="id"
            dataSource={rows}
            columns={columns}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: false,
              onChange: (nextPage) => setPage(nextPage),
            }}
          />
        )}
      </Card>

      <Space className="text-xs text-white/50">
        Tip: backend search filters by assessment title and student id. Use the select to narrow results.
      </Space>
    </div>
  );
}

