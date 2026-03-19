import { Card, Input, Select, Space, Spin, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { academicsApi } from "../academicsApi";
import type { AssessmentResultRow, AssessmentRow, Paginated } from "../academicsTypes";

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
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AssessmentResultRow[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState(defaultSearch ?? "");
  const [search, setSearch] = useState(defaultSearch ?? "");

  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [assessmentId, setAssessmentId] = useState<number | "ALL">("ALL");
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  const loadAssessments = async () => {
    setAssessmentsLoading(true);
    try {
      const data = await academicsApi.assessments.list({ page: 1, page_size: 200 });
      const list = ((data as any)?.results ?? []) as AssessmentRow[];
      setAssessments(list);
    } catch (e: any) {
      message.error(e?.response?.data?.detail ?? "Failed to load assessments");
    } finally {
      setAssessmentsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // The backend searches by:
        // - assessment__title
        // - enrollment__student__student_id
        // so if you select an assessment, we use its title to search.
        const selectedAssessment = assessments.find((a) => a.id === assessmentId);
        const query =
          assessmentId !== "ALL" && selectedAssessment?.title
            ? selectedAssessment.title
            : search || undefined;

        const data = await academicsApi.assessmentResults.list({
          search: query,
          page,
          page_size: pageSize,
        });
        if (!mounted) return;

        const paginated = data as Paginated<AssessmentResultRow>;
        const list =
          Array.isArray((data as any)?.results) ? (data as any).results : Array.isArray(data) ? (data as any) : [];
        setRows(list);
        setTotal(typeof paginated?.count === "number" ? paginated.count : list.length);
      } catch (e: any) {
        message.error(e?.response?.data?.detail ?? "Failed to load assessment results");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, pageSize, search, assessmentId, assessments]);

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

