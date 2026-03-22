import { Badge, Button, Card, Input, Select, Space, Table, Tag, Tabs, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useGetCoursesQuery } from "@/features/academics/academicsApiSlice";
import type { CourseRow } from "@/features/academics/academicsTypes";
import { rowsOf } from "@/utils/platform";
import CourseDrawer from "@/features/academics/components/CourseDrawer";
import CourseEnrollmentsTab from "@/features/academics/components/CourseEnrollmentsTab";
import AssessmentResultsTab from "@/features/academics/components/AssessmentResultsTab";
import AttendanceTab from "@/features/academics/components/AttendanceTab";
import { BookOutlined } from "@ant-design/icons";

export default function AcademicsCoursesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [tabKey, setTabKey] = useState<"courses" | "enrollments" | "assessments" | "attendance">("courses");


  const { data: coursesData, isFetching: loading } = useGetCoursesQuery({
    search: search || undefined,
    page,
    page_size: pageSize,
  });

  const courses = rowsOf(coursesData) as CourseRow[];
  const total = typeof coursesData?.count === "number" ? coursesData.count : courses.length;

  const coursesById = useMemo(() => {
    const map: Record<number, CourseRow> = {};
    for (const c of courses) map[c.id] = c;
    return map;
  }, [courses]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const columns: ColumnsType<CourseRow> = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (v, r) => (
        <div className="flex items-center gap-2">
          <Badge color="orange" className="!bg-[var(--cv-accent)]" />
          <span>{v ?? r.id}</span>
        </div>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (v) => <span className="text-white/90">{v ?? "—"}</span>,
    },
    {
      title: "Program",
      dataIndex: "program",
      key: "program",
      render: (v) => <span className="text-white/70">{v ?? "—"}</span>,
    },
    {
      title: "Credits",
      dataIndex: "credit_hours",
      key: "credit_hours",
      render: (v) => <span className="text-white/70">{v ?? "—"}</span>,
    },
    {
      title: "Elective",
      dataIndex: "is_elective",
      key: "is_elective",
      render: (v) => <Tag color={v ? "orange" : "default"}>{v ? "Yes" : "No"}</Tag>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Typography.Title level={3} className="!mb-0 text-white">
            Academics <span className="text-[var(--cv-accent)]">Workspace</span>
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Course catalog, prerequisites, schedules, and enrollments (tenant-aware).
          </Typography.Paragraph>
        </div>

        <Space>
          <Button
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0 hidden md:inline-flex"
            onClick={() => {
              // decorative
            }}
          >
            <BookOutlined className="mr-2" />
            Academics AI
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={tabKey}
        onChange={(k) => setTabKey(k as any)}
        items={[
          {
            key: "courses",
            label: "Courses",
            children: (
              <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                  <div className="flex gap-3 items-center flex-wrap">
                    <Select
                      className="min-w-[180px]"
                      placeholder="Filter (optional)"
                      options={[
                        { label: "All courses", value: "all" },
                        { label: "Elective only", value: "elective" },
                      ]}
                      onChange={() => {
                        // optional filter (kept minimal for now)
                      }}
                    />
                    <Input.Search
                      allowClear
                      placeholder="Search by title/code..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onSearch={(val) => {
                        setSearch(val);
                      }}
                      className="min-w-[320px]"
                    />
                  </div>
                </div>

                <Table<CourseRow>
                  rowKey="id"
                  loading={loading}
                  dataSource={courses}
                  columns={columns}
                  onRow={(record) => ({
                    onClick: () => {
                      setSelectedCourse(record);
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
            ),
          },
          {
            key: "enrollments",
            label: "Course Enrollments",
            children: <CourseEnrollmentsTab coursesById={coursesById} />,
          },
          {
            key: "assessments",
            label: "Assessment Results",
            children: <AssessmentResultsTab />,
          },
          {
            key: "attendance",
            label: "Attendance Management",
            children: <AttendanceTab />,
          },
        ]}
      />

      <CourseDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        course={selectedCourse}
        coursesById={coursesById}
      />
    </div>
  );
}

