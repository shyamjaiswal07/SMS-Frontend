import { Badge, Card, Input, Select, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { studentApi } from "@/features/students/studentApi";
import type { StudentRow, StudentStatus } from "@/features/students/studentTypes";
import StudentDrawer from "@/features/students/components/StudentDrawer";

type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

const statusTagColor = (s?: string) => {
  switch (s) {
    case "ACTIVE":
      return "success";
    case "APPLICANT":
      return "processing";
    case "INACTIVE":
      return "default";
    case "GRADUATED":
      return "warning";
    case "TRANSFERRED":
      return "error";
    default:
      return "default";
  }
};

export default function StudentsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StudentStatus>("ALL");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<StudentRow | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await studentApi.listStudents({
          search: search || undefined,
          page,
          page_size: pageSize,
        });
        if (!mounted) return;

        const paginated = data as Paginated<StudentRow>;
        const list = Array.isArray((data as any)?.results) ? (data as any).results : Array.isArray(data) ? (data as any) : [];

        setRows(list as StudentRow[]);
        setTotal(typeof paginated?.count === "number" ? paginated.count : list.length);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, pageSize, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const columns: ColumnsType<StudentRow> = [
    {
      title: "Student ID",
      dataIndex: "student_id",
      key: "student_id",
      render: (v, r) => (
        <div className="flex items-center gap-2">
          <Badge color="orange" className="!bg-[var(--cv-accent)]" />
          <span>{v ?? r.id}</span>
        </div>
      ),
    },
    {
      title: "Name",
      key: "name",
      render: (_, r) => `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "—",
    },
    {
      title: "Admission",
      dataIndex: "admission_number",
      key: "admission_number",
      render: (v) => v ?? "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => <Tag color={statusTagColor(String(v ?? ""))}>{String(v ?? "—")}</Tag>,
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, r) => (
        <div className="text-white/70">
          {r.email ? <div>{r.email}</div> : null}
          {r.phone_number ? <div>{r.phone_number}</div> : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Students
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Search and review transcript/attendance/fees — all tenant-aware.
          </Typography.Paragraph>
        </div>

        <div className="flex gap-3 items-center">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { label: "All", value: "ALL" },
              { label: "Applicant", value: "APPLICANT" },
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
              { label: "Graduated", value: "GRADUATED" },
              { label: "Transferred", value: "TRANSFERRED" },
            ]}
            className="min-w-[160px]"
          />
          <Input.Search
            allowClear
            placeholder="Search by student id, name..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (!e.target.value) setSearch("");
            }}
            onSearch={(val) => setSearch(val)}
            className="min-w-[280px]"
          />
        </div>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <Table<StudentRow>
          rowKey="id"
          loading={loading}
          dataSource={filteredRows}
          columns={columns}
          onRow={(record) => ({
            onClick: () => {
              setSelected(record);
              setDrawerOpen(true);
            },
            className: "cursor-pointer",
          })}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            onChange: (nextPage) => setPage(nextPage),
          }}
        />
      </Card>

      <StudentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} student={selected} />
    </div>
  );
}

