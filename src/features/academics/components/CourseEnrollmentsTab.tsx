import { Badge, Card, Input, Select, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useGetCourseEnrollmentsQuery } from "../academicsApiSlice";
import type { CourseEnrollmentRow, CourseRow } from "../academicsTypes";
import { rowsOf } from "@/utils/platform";

const statusTagColor = (s?: string) => {
  switch (s) {
    case "ENROLLED":
      return "success";
    case "COMPLETED":
      return "processing";
    case "DROPPED":
      return "default";
    default:
      return "default";
  }
};

type Props = {
  coursesById: Record<number, CourseRow>;
};

export default function CourseEnrollmentsTab({ coursesById }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | string>("ALL");

  const { data: enrollmentsData, isFetching: loading } = useGetCourseEnrollmentsQuery({
    search: search || undefined,
    page,
    page_size: pageSize,
  });

  const rows = rowsOf(enrollmentsData) as CourseEnrollmentRow[];
  const total = typeof enrollmentsData?.count === "number" ? enrollmentsData.count : rows.length;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const columns: ColumnsType<CourseEnrollmentRow> = [
    {
      title: "Student",
      key: "student",
      render: (_, r) => r.student ?? "—",
    },
    {
      title: "Course",
      key: "course",
      render: (_, r) => {
        const cid = r.course as number | undefined;
        return cid && coursesById[cid]?.title ? coursesById[cid].title : cid ?? "—";
      },
    },
    {
      title: "Academic Year",
      dataIndex: "academic_year",
      key: "academic_year",
      render: (v) => v ?? "—",
    },
    {
      title: "Term",
      dataIndex: "term",
      key: "term",
      render: (v) => v ?? "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => <Tag color={statusTagColor(String(v ?? ""))}>{String(v ?? "—")}</Tag>,
    },
    {
      title: "Final Score",
      dataIndex: "final_score",
      key: "final_score",
      render: (v) => (v === null || v === undefined ? "—" : String(v)),
    },
    {
      title: "Grade",
      key: "grade",
      render: (_, r) => r.grade_letter ?? "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            className="min-w-[180px]"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as any)}
            options={[
              { label: "All statuses", value: "ALL" },
              { label: "Enrolled", value: "ENROLLED" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Dropped", value: "DROPPED" },
            ]}
          />
          <Input.Search
            allowClear
            placeholder="Search by student id / course title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(val) => setSearch(val)}
            className="min-w-[320px]"
          />
        </div>

        <div className="text-xs text-white/50">
          Showing {filtered.length} records (page {page})
        </div>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <Table<CourseEnrollmentRow>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          columns={columns}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            onChange: (nextPage) => setPage(nextPage),
          }}
        />
      </Card>
    </div>
  );
}

