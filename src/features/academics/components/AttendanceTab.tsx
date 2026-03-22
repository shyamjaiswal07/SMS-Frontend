import { Card, Drawer, Input, Space, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { useGetAttendanceSessionsQuery, useGetAttendanceRecordsQuery } from "../academicsApiSlice";
import type { AttendanceRecordRow, AttendanceSessionRow } from "../academicsTypes";
import { rowsOf } from "@/utils/platform";

const statusTagColor = (s?: string) => {
  switch (s) {
    case "PRESENT":
      return "success";
    case "ABSENT":
      return "error";
    case "LATE":
      return "warning";
    case "LEAVE":
      return "default";
    default:
      return "default";
  }
};

const studentIdFromRecord = (r: any) => {
  if (typeof r.student === "number") return r.student;
  return r.student?.student_id ?? r.student?.id ?? "—";
};

const scheduleLabelFromSession = (s: AttendanceSessionRow) => {
  // Serializer might return only ids, so this is defensive.
  const schedule = s.schedule as any;
  if (typeof schedule === "number") return `Schedule #${schedule}`;
  if (typeof schedule === "string") return schedule;
  const courseTitle = schedule?.course?.title ?? schedule?.course__title ?? schedule?.course_title;
  const sectionName = schedule?.section?.name ?? schedule?.section__name ?? schedule?.section_name;
  if (courseTitle && sectionName) return `${courseTitle} · ${sectionName}`;
  if (courseTitle) return String(courseTitle);
  if (sectionName) return String(sectionName);
  return schedule?.id ?? s.id;
};

export default function AttendanceTab() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AttendanceSessionRow | null>(null);

  const { data: sessionsData, isFetching: loading } = useGetAttendanceSessionsQuery({
    search: search || undefined,
    page,
    page_size: pageSize,
  });

  const sessions = rowsOf(sessionsData) as AttendanceSessionRow[];
  const total = typeof sessionsData?.count === "number" ? sessionsData.count : sessions.length;

  const { data: recordsData, isFetching: drawerLoading } = useGetAttendanceRecordsQuery(
    { search: selectedSession ? String(scheduleLabelFromSession(selectedSession)) : undefined, page: 1, page_size: 200 },
    { skip: !selectedSession || !drawerOpen },
  );

  const records = useMemo(() => {
    if (!selectedSession || !recordsData) return [];
    const list = rowsOf(recordsData) as AttendanceRecordRow[];
    return list.filter((r: any) => Number(r.session) === Number(selectedSession.id));
  }, [recordsData, selectedSession]);

  const openSession = (s: AttendanceSessionRow) => {
    setSelectedSession(s);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<AttendanceSessionRow> = useMemo(
    () => [
      {
        title: "Date",
        key: "attendance_date",
        render: (_, r) => r.attendance_date ?? "—",
      },
      {
        title: "Period",
        key: "period_number",
        render: (_, r) => r.period_number ?? "—",
      },
      {
        title: "Course / Section",
        key: "schedule",
        render: (_, r) => String(scheduleLabelFromSession(r)),
      },
      {
        title: "Taken By",
        key: "taken_by",
        render: (_, r) => r.taken_by ?? "—",
      },
    ],
    []
  );

  const recordColumns: ColumnsType<AttendanceRecordRow> = [
    {
      title: "Student",
      key: "student",
      render: (_, r: any) => studentIdFromRecord(r),
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) => <Tag color={statusTagColor(r.status)}>{r.status ?? "—"}</Tag>,
    },
    {
      title: "Remark",
      key: "remark",
      render: (_, r) => r.remark ?? "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Title level={4} className="!mb-0 text-white">
            Attendance Sessions
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Select a session to view students attendance.
          </Typography.Paragraph>
        </div>

        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search by course/section..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            className="min-w-[320px]"
          />
        </Space>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <Table<AttendanceSessionRow>
          rowKey="id"
          loading={loading}
          dataSource={sessions}
          columns={columns}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            onChange: (nextPage) => setPage(nextPage),
          }}
          onRow={(record) => ({
            onClick: () => openSession(record),
            className: "cursor-pointer",
          })}
        />
      </Card>

      <Drawer
        title={
          selectedSession ? (
            <div>
              <div className="text-white font-semibold">{selectedSession.attendance_date ?? "Session"}</div>
              <div className="text-white/60 text-sm">{String(scheduleLabelFromSession(selectedSession))}</div>
            </div>
          ) : null
        }
        width={760}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        {drawerLoading ? (
          <div className="py-10 flex justify-center">
            <Spin />
          </div>
        ) : records.length ? (
          <Table<AttendanceRecordRow> rowKey="id" dataSource={records} columns={recordColumns} pagination={false} />
        ) : (
          <div className="text-white/60">No records found for this session.</div>
        )}
      </Drawer>
    </div>
  );
}

