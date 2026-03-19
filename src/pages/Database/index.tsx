import {
  Badge,
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type AdmissionStatus = "APPLICANT" | "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";

type AdmissionApplicationRow = {
  id: number;
  application_no?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  applying_for_year?: number | string;
  applying_for_grade?: number | string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  status?: AdmissionStatus | string;
  notes?: string;
};

type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export default function Admissions() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdmissionApplicationRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<"ALL" | AdmissionStatus>("ALL");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<AdmissionApplicationRow | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const tenant = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("tenant") || "null") as { role?: string } | null;
    } catch {
      return null;
    }
  }, []);

  const canWrite = tenant?.role === "SUPER_ADMIN" || tenant?.role === "SCHOOL_ADMIN";

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.students.admissions.list({
        search: search || undefined,
        page,
        page_size: pageSize,
      });

      const paginated = data as Paginated<AdmissionApplicationRow>;
      const list = Array.isArray((paginated as any)?.results)
        ? (paginated as any).results
        : Array.isArray((data as any)?.results)
          ? (data as any).results
          : Array.isArray(data)
            ? (data as any)
            : [];

      setRows(list);
      setTotal(typeof paginated?.count === "number" ? paginated.count : list.length);
    } catch (e: any) {
      message.error(e?.response?.data?.detail ?? "Failed to load admission applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return rows;
    return rows.filter((r) => String(r.status ?? "") === statusFilter);
  }, [rows, statusFilter]);

  const openDrawer = (row: AdmissionApplicationRow) => {
    setSelected(row);
    setDrawerOpen(true);
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

  const columns: ColumnsType<AdmissionApplicationRow> = [
    {
      title: "App No",
      dataIndex: "application_no",
      key: "application_no",
      render: (v) => (
        <div className="flex items-center gap-2">
          <Badge color="orange" className="!bg-[var(--cv-accent)]" />
          <span>{v ?? "—"}</span>
        </div>
      ),
    },
    {
      title: "Student",
      key: "student",
      render: (_, r) => `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "—",
    },
    {
      title: "DOB",
      dataIndex: "date_of_birth",
      key: "date_of_birth",
      render: (v) => (v ? String(v) : "—"),
    },
    {
      title: "Parent",
      key: "parent",
      render: (_, r) => r.parent_name ?? r.parent_phone ?? "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => <Tag color={statusTagColor(String(v ?? ""))}>{String(v ?? "—")}</Tag>,
    },
  ];

  const updateStatus = async (nextStatus: AdmissionStatus) => {
    if (!selected) return;
    if (!canWrite) {
      message.warning("You don't have permission to update admission status.");
      return;
    }
    setDrawerLoading(true);
    try {
      await api.students.admissions.updateStatus(selected.id, nextStatus);
      message.success("Status updated");
      setDrawerOpen(false);
      void load();
    } catch (e: any) {
      message.error(e?.response?.data?.detail ?? "Failed to update status");
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Admissions
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Admission applications management (tenant-aware).
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
            placeholder="Search by application no, student name..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (!e.target.value) {
                setSearch("");
                setPage(1);
              }
            }}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            className="min-w-[320px]"
          />
        </div>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <Table<AdmissionApplicationRow>
          rowKey="id"
          loading={loading}
          dataSource={filteredRows}
          columns={columns}
          onRow={(record) => ({
            onClick: () => openDrawer(record),
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

      <Drawer
        title={
          selected ? (
            <div className="flex items-center justify-between gap-3 w-full">
              <div>
                <div className="text-white font-semibold">{selected.application_no ?? selected.id}</div>
                <div className="text-white/60 text-sm">
                  {(selected.first_name ?? "") + " " + (selected.last_name ?? "")}
                </div>
              </div>
              <Space>
                {canWrite ? (
                  <>
                    <Button
                      disabled={drawerLoading}
                      className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                      onClick={() => void updateStatus("ACTIVE")}
                    >
                      Approve
                    </Button>
                    <Button disabled={drawerLoading} onClick={() => void updateStatus("INACTIVE")}>
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button type="primary" disabled>
                    No write permission
                  </Button>
                )}
              </Space>
            </div>
          ) : null
        }
        width={720}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        destroyOnClose
      >
        {!selected ? null : drawerLoading ? (
          <div className="py-10 flex justify-center">
            <Spin />
          </div>
        ) : (
          <div className="space-y-4">
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: "app_no", label: "Application No", children: selected.application_no ?? "—" },
                { key: "dob", label: "Date of Birth", children: selected.date_of_birth ? String(selected.date_of_birth) : "—" },
                { key: "student_status", label: "Status", children: <Tag color={statusTagColor(String(selected.status ?? ""))}>{String(selected.status ?? "—")}</Tag> },
                { key: "parent", label: "Parent/Guardian", children: selected.parent_name ?? "—" },
                { key: "parent_phone", label: "Parent Phone", children: selected.parent_phone ?? "—" },
                { key: "parent_email", label: "Parent Email", children: selected.parent_email ?? "—" },
                { key: "notes", label: "Notes", children: selected.notes ?? "—" },
                { key: "year", label: "Applying For Year", children: selected.applying_for_year ? String(selected.applying_for_year) : "—" },
                { key: "grade", label: "Applying For Grade", children: selected.applying_for_grade ? String(selected.applying_for_grade) : "—" },
              ]}
            />

            <Card size="small" className="!bg-white/5 !border-white/10">
              <Typography.Text className="!text-white/80">AI Assist</Typography.Text>
              <div className="text-white/60 text-sm mt-2">
                Use AI to summarize the application and suggest next steps. (Integration coming soon.)
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="primary"
                  className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                  onClick={() => message.info("AI summary integration coming soon.")}
                >
                  Summarize
                </Button>
                <Button onClick={() => message.info("AI eligibility checks coming soon.")}>Check Eligibility</Button>
              </div>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}

