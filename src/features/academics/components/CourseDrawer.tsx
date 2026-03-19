import { Badge, Button, Card, Descriptions, Drawer, Spin, Table, Tag, Tabs, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { ClassScheduleRow, CoursePrerequisiteRow, CourseRow } from "../academicsTypes";
import { academicsApi } from "../academicsApi";

type Props = {
  open: boolean;
  onClose: () => void;
  course: CourseRow | null;
  coursesById?: Record<number, CourseRow>;
};

const dayOfWeekLabel = (d?: number) => {
  const map: Record<number, string> = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
  };
  return d ? map[d] ?? String(d) : "—";
};

export default function CourseDrawer({ open, onClose, course, coursesById }: Props) {
  const [activeTab, setActiveTab] = useState<"prereq" | "schedule">("prereq");
  const [loading, setLoading] = useState({ prereq: false, schedule: false });

  const [prerequisites, setPrerequisites] = useState<CoursePrerequisiteRow[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleRow[]>([]);

  const courseId = useMemo(() => course?.id, [course]);

  useEffect(() => {
    if (!open || !courseId) return;
    setActiveTab("prereq");
    setPrerequisites([]);
    setSchedules([]);

    void loadPrereqs();
  }, [open, courseId]);

  const loadPrereqs = async () => {
    if (!courseId) return;
    if (loading.prereq) return;

    setLoading((p) => ({ ...p, prereq: true }));
    try {
      const data = await academicsApi.coursePrerequisites.list({
        search: course?.title ?? course?.code,
        page_size: 50,
      });

      const list = Array.isArray((data as any)?.results) ? (data as any).results : Array.isArray(data) ? (data as any) : [];
      const filtered = list.filter((x: any) => Number(x.course) === Number(courseId));
      setPrerequisites(filtered);
    } catch (e: any) {
      message.error(e?.response?.data?.detail ?? "Failed to load prerequisites");
    } finally {
      setLoading((p) => ({ ...p, prereq: false }));
    }
  };

  const loadSchedules = async () => {
    if (!courseId) return;
    if (loading.schedule) return;

    setLoading((p) => ({ ...p, schedule: true }));
    try {
      const data = await academicsApi.classSchedules.list({
        search: course?.title ?? course?.code,
        page_size: 50,
      });

      const list = Array.isArray((data as any)?.results) ? (data as any).results : Array.isArray(data) ? (data as any) : [];
      const filtered = list.filter((x: any) => Number(x.course) === Number(courseId));
      setSchedules(filtered);
    } catch (e: any) {
      message.error(e?.response?.data?.detail ?? "Failed to load schedules");
    } finally {
      setLoading((p) => ({ ...p, schedule: false }));
    }
  };

  return (
    <Drawer
      title={
        course ? (
          <div className="flex items-start justify-between gap-4 w-full">
            <div>
              <div className="text-white font-semibold">{course.title ?? "Course"}</div>
              <div className="text-white/60 text-sm">
                {course.code ? `${course.code}` : `#${course.id}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="primary"
                className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
                onClick={() => message.info("AI course insights coming soon.")}
              >
                Ask AI
              </Button>
            </div>
          </div>
        ) : null
      }
      width={860}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ body: { paddingBottom: 16 } }}
    >
      {!course ? null : (
        <div className="space-y-4">
          <Descriptions
            size="small"
            column={1}
            items={[
              { key: "code", label: "Code", children: course.code ?? "—" },
              { key: "program", label: "Program ID", children: course.program ?? "—" },
              { key: "subject", label: "Subject ID", children: course.subject ?? "—" },
              { key: "credits", label: "Credit Hours", children: course.credit_hours ?? "—" },
              { key: "elective", label: "Elective", children: course.is_elective ? "Yes" : "No" },
            ]}
          />

          <Tabs
            activeKey={activeTab}
            onChange={(k) => {
              const next = k as typeof activeTab;
              setActiveTab(next);
              if (next === "prereq") void loadPrereqs();
              if (next === "schedule") void loadSchedules();
            }}
            items={[
              {
                key: "prereq",
                label: "Prerequisites",
                children: (
                  loading.prereq ? (
                    <div className="py-10 flex justify-center">
                      <Spin />
                    </div>
                  ) : prerequisites.length ? (
                    <Table
                      size="small"
                      rowKey="id"
                      pagination={false}
                      dataSource={prerequisites}
                      columns={[
                        {
                          title: "Course",
                          render: (_, r) => (
                            <div className="flex items-center gap-2">
                              <Badge className="!bg-[var(--cv-accent)]" color="orange" />
                              <span>{coursesById?.[Number(r.course)]?.title ?? r.course ?? "—"}</span>
                            </div>
                          ),
                        },
                        {
                          title: "Prerequisite",
                          render: (_, r) => (
                            <Tag color="orange">
                              {coursesById?.[Number(r.prerequisite)]?.title ?? r.prerequisite ?? "—"}
                            </Tag>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <div className="text-white/60">No prerequisites found</div>
                  )
                ),
              },
              {
                key: "schedule",
                label: "Class Schedules",
                children: (
                  loading.schedule ? (
                    <div className="py-10 flex justify-center">
                      <Spin />
                    </div>
                  ) : schedules.length ? (
                    <Table
                      size="small"
                      rowKey="id"
                      pagination={false}
                      dataSource={schedules}
                      columns={[
                        { title: "Day", dataIndex: "day_of_week", key: "day_of_week", render: (v) => dayOfWeekLabel(v) },
                        { title: "Start", dataIndex: "start_time", key: "start_time", render: (v) => (v ? String(v) : "—") },
                        { title: "End", dataIndex: "end_time", key: "end_time", render: (v) => (v ? String(v) : "—") },
                        { title: "Section", dataIndex: "section", key: "section", render: (v) => v ?? "—" },
                        { title: "Teacher", dataIndex: "teacher", key: "teacher", render: (v) => v ?? "—" },
                        { title: "Room", dataIndex: "room", key: "room", render: (v) => v ?? "—" },
                        { title: "Term", dataIndex: "term", key: "term", render: (v) => v ?? "—" },
                      ]}
                    />
                  ) : (
                    <div className="text-white/60">No schedules found</div>
                  )
                ),
              },
            ]}
          />

          <Card size="small" className="!bg-white/5 !border-white/10">
            <Typography.Text className="!text-white/70">AI Assist</Typography.Text>
            <div className="text-white/60 text-sm mt-2">
              You can ask AI to explain course flow and prerequisite impact. (Integration coming soon.)
            </div>
          </Card>
        </div>
      )}
    </Drawer>
  );
}

