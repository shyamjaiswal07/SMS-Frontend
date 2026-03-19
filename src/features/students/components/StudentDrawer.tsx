import { Card, Descriptions, Drawer, Spin, Table, Tag, Tabs, Typography, Button, Badge, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { StudentDrawerTabKey, StudentRow } from "../studentTypes";
import { studentApi } from "../studentApi";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  student: StudentRow | null;
};

const normalizeResults = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
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

export default function StudentDrawer({ open, onClose, student }: DrawerProps) {
  const [activeTab, setActiveTab] = useState<StudentDrawerTabKey>("transcript");

  const [drawerLoading, setDrawerLoading] = useState({
    transcript: false,
    attendance: false,
    fee: false,
    guardians: false,
    documents: false,
    enrollments: false,
    discipline: false,
    achievements: false,
  });

  const [transcript, setTranscript] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [feeSummary, setFeeSummary] = useState<any>(null);

  const [studentGuardians, setStudentGuardians] = useState<any[]>([]);
  const [studentDocuments, setStudentDocuments] = useState<any[]>([]);
  const [studentYearEnrollments, setStudentYearEnrollments] = useState<any[]>([]);
  const [disciplinaryRecords, setDisciplinaryRecords] = useState<any[]>([]);
  const [studentAchievements, setStudentAchievements] = useState<any[]>([]);

  const studentId = useMemo(() => student?.student_id ?? student?.id, [student]);

  useEffect(() => {
    if (!open || !student) return;

    setActiveTab("transcript");
    setTranscript(null);
    setAttendanceSummary(null);
    setFeeSummary(null);
    setStudentGuardians([]);
    setStudentDocuments([]);
    setStudentYearEnrollments([]);
    setDisciplinaryRecords([]);
    setStudentAchievements([]);

    setDrawerLoading({
      transcript: true,
      attendance: true,
      fee: true,
      guardians: false,
      documents: false,
      enrollments: false,
      discipline: false,
      achievements: false,
    });

    const pk = student.id;
    Promise.all([studentApi.transcript(pk), studentApi.attendanceSummary(pk), studentApi.feeSummary(pk)])
      .then(([t, a, f]) => {
        setTranscript(t);
        setAttendanceSummary(a);
        setFeeSummary(f);
      })
      .catch((e: any) => {
        message.error(e?.response?.data?.detail ?? "Failed to load student details");
      })
      .finally(() => {
        setDrawerLoading((p) => ({
          ...p,
          transcript: false,
          attendance: false,
          fee: false,
        }));
      });
  }, [open, student]);

  const ensureTabLoaded = async (tabKey: StudentDrawerTabKey) => {
    if (!open || !studentId) return;
    if (drawerLoading[tabKey as keyof typeof drawerLoading]) return;

    const search = String(studentId);

    try {
      setDrawerLoading((p) => ({ ...p, [tabKey]: true } as any));
      switch (tabKey) {
        case "guardians": {
          const data = await studentApi.studentGuardians({ search, page_size: 50 });
          setStudentGuardians(normalizeResults(data));
          break;
        }
        case "documents": {
          const data = await studentApi.studentDocuments({ search, page_size: 50 });
          setStudentDocuments(normalizeResults(data));
          break;
        }
        case "enrollments": {
          const data = await studentApi.studentYearEnrollments({ search, page_size: 50 });
          setStudentYearEnrollments(normalizeResults(data));
          break;
        }
        case "discipline": {
          const data = await studentApi.disciplinaryRecords({ search, page_size: 50 });
          setDisciplinaryRecords(normalizeResults(data));
          break;
        }
        case "achievements": {
          const data = await studentApi.studentAchievements({ search, page_size: 50 });
          setStudentAchievements(normalizeResults(data));
          break;
        }
        default:
          break;
      }
    } catch (e: any) {
      message.error(e?.response?.data?.detail ?? "Failed to load tab data");
    } finally {
      setDrawerLoading((p) => ({ ...p, [tabKey]: false } as any));
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between gap-3 w-full">
          <div>
            <div className="text-white font-semibold">{student ? student.student_id ?? student.id : ""}</div>
            <div className="text-white/60 text-sm">
              {student ? `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() : ""}
            </div>
          </div>
          <Button
            type="primary"
            className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
            onClick={() => message.info("AI insights will appear here (coming soon).")}
          >
            Ask AI
          </Button>
        </div>
      }
      width={740}
      onClose={onClose}
      open={open}
      destroyOnClose
      styles={{ body: { paddingBottom: 16 } }}
    >
      {!student ? null : (
        <div className="space-y-4">
          <Descriptions
            size="small"
            column={1}
            items={[
              { key: "Admission", label: "Admission", children: student.admission_number ?? "—" },
              { key: "DOB", label: "Date of Birth", children: student.date_of_birth ? String(student.date_of_birth) : "—" },
              { key: "Status", label: "Status", children: student.status ?? "—" },
            ]}
          />

          <Tabs
            activeKey={activeTab}
            onChange={(k) => {
              const next = k as StudentDrawerTabKey;
              setActiveTab(next);
              void ensureTabLoaded(next);
            }}
            items={[
              {
                key: "transcript",
                label: "Transcript",
                children:
                  drawerLoading.transcript ? (
                    <div className="py-10 flex justify-center">
                      <Spin />
                    </div>
                  ) : transcript ? (
                    <div className="space-y-3">
                      <div className="flex gap-3 flex-wrap">
                        <Card size="small" className="!bg-white/5 !border-white/10 !w-fit">
                          <Typography.Text className="!text-white/70">Total Courses</Typography.Text>
                          <div className="text-white text-lg font-semibold">{transcript?.summary?.total_courses ?? 0}</div>
                        </Card>
                        <Card size="small" className="!bg-white/5 !border-white/10 !w-fit">
                          <Typography.Text className="!text-white/70">Avg Score</Typography.Text>
                          <div className="text-white text-lg font-semibold">{transcript?.summary?.avg_score ?? "—"}</div>
                        </Card>
                        <Card size="small" className="!bg-white/5 !border-white/10 !w-fit">
                          <Typography.Text className="!text-white/70">Avg Grade Points</Typography.Text>
                          <div className="text-white text-lg font-semibold">
                            {transcript?.summary?.avg_grade_points ?? "—"}
                          </div>
                        </Card>
                      </div>
                      <Table
                        size="small"
                        rowKey={(r: any) => `${r.course ?? ""}-${r.academic_year ?? ""}-${r.term ?? ""}-${r.status ?? ""}`}
                        dataSource={transcript?.courses ?? []}
                        columns={[
                          { title: "Course", dataIndex: "course" },
                          { title: "Year", dataIndex: "academic_year" },
                          { title: "Term", dataIndex: "term" },
                          { title: "Status", dataIndex: "status" },
                          { title: "Score", dataIndex: "final_score" },
                          { title: "Grade", dataIndex: "grade_letter" },
                        ]}
                        pagination={false}
                      />
                    </div>
                  ) : (
                    <div className="text-white/60">No transcript data</div>
                  ),
              },
              {
                key: "attendance",
                label: "Attendance",
                children:
                  drawerLoading.attendance ? (
                    <div className="py-10 flex justify-center">
                      <Spin />
                    </div>
                  ) : attendanceSummary ? (
                    <div className="space-y-3">
                      <div className="flex gap-3 flex-wrap">
                        <Card size="small" className="!bg-white/5 !border-white/10 !w-fit">
                          <Typography.Text className="!text-white/70">Attendance %</Typography.Text>
                          <div className="text-white text-lg font-semibold">
                            {attendanceSummary?.attendance_percentage ?? 0}%
                          </div>
                        </Card>
                        <Card size="small" className="!bg-white/5 !border-white/10 !w-fit">
                          <Typography.Text className="!text-white/70">Total</Typography.Text>
                          <div className="text-white text-lg font-semibold">{attendanceSummary?.attendance?.total ?? 0}</div>
                        </Card>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Card size="small" className="!bg-white/5 !border-white/10">
                          <Typography.Text className="!text-white/70">Present</Typography.Text>
                          <div className="text-white text-lg font-semibold">{attendanceSummary?.attendance?.present ?? 0}</div>
                        </Card>
                        <Card size="small" className="!bg-white/5 !border-white/10">
                          <Typography.Text className="!text-white/70">Absent</Typography.Text>
                          <div className="text-white text-lg font-semibold">{attendanceSummary?.attendance?.absent ?? 0}</div>
                        </Card>
                        <Card size="small" className="!bg-white/5 !border-white/10">
                          <Typography.Text className="!text-white/70">Late</Typography.Text>
                          <div className="text-white text-lg font-semibold">{attendanceSummary?.attendance?.late ?? 0}</div>
                        </Card>
                        <Card size="small" className="!bg-white/5 !border-white/10">
                          <Typography.Text className="!text-white/70">Leave</Typography.Text>
                          <div className="text-white text-lg font-semibold">{attendanceSummary?.attendance?.leave ?? 0}</div>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/60">No attendance data</div>
                  ),
              },
              {
                key: "fee",
                label: "Fee Summary",
                children:
                  drawerLoading.fee ? (
                    <div className="py-10 flex justify-center">
                      <Spin />
                    </div>
                  ) : feeSummary ? (
                    <div className="space-y-3">
                      <div className="flex gap-3 flex-wrap">
                        <Card size="small" className="!bg-white/5 !border-white/10 !w-fit">
                          <Typography.Text className="!text-white/70">Invoiced</Typography.Text>
                          <div className="text-white text-lg font-semibold">
                            {feeSummary?.financial_summary?.invoiced ?? 0}
                          </div>
                        </Card>
                        <Card size="small" className="!bg-white/5 !border-white/10 !w-fit">
                          <Typography.Text className="!text-white/70">Outstanding</Typography.Text>
                          <div className="text-white text-lg font-semibold">
                            {feeSummary?.financial_summary?.outstanding ?? 0}
                          </div>
                        </Card>
                        <Card size="small" className="!bg-white/5 !border-white/10 !w-fit">
                          <Typography.Text className="!text-white/70">Paid</Typography.Text>
                          <div className="text-white text-lg font-semibold">
                            {feeSummary?.financial_summary?.paid ?? 0}
                          </div>
                        </Card>
                      </div>
                      <Card size="small" className="!bg-white/5 !border-white/10">
                        <Typography.Text className="!text-white/70">Invoices</Typography.Text>
                        <div className="text-white text-lg font-semibold">
                          {feeSummary?.financial_summary?.invoice_count ?? 0}
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-white/60">No fee data</div>
                  ),
              },
              {
                key: "guardians",
                label: "Guardians",
                children: drawerLoading.guardians ? (
                  <div className="py-10 flex justify-center">
                    <Spin />
                  </div>
                ) : studentGuardians.length ? (
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={studentGuardians}
                    columns={[
                      { title: "Guardian", dataIndex: "guardian", key: "guardian", render: (v) => v ?? "—" },
                      { title: "Primary", dataIndex: "is_primary", key: "is_primary", render: (v) => (v ? "Yes" : "No") },
                      { title: "Can Pickup", dataIndex: "can_pickup", key: "can_pickup", render: (v) => (v ? "Yes" : "No") },
                    ]}
                  />
                ) : (
                  <div className="text-white/60">No guardians found</div>
                ),
              },
              {
                key: "documents",
                label: "Documents",
                children: drawerLoading.documents ? (
                  <div className="py-10 flex justify-center">
                    <Spin />
                  </div>
                ) : studentDocuments.length ? (
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={studentDocuments}
                    columns={[
                      { title: "Type", dataIndex: "document_type", key: "document_type", render: (v) => v ?? "—" },
                      { title: "Doc No", dataIndex: "document_number", key: "document_number", render: (v) => v ?? "—" },
                      {
                        title: "File",
                        dataIndex: "file_url",
                        key: "file_url",
                        render: (v) =>
                          v ? (
                            <a className="text-[var(--cv-accent)]" href={String(v)} target="_blank" rel="noreferrer">
                              Open
                            </a>
                          ) : (
                            "—"
                          ),
                      },
                    ]}
                  />
                ) : (
                  <div className="text-white/60">No documents found</div>
                ),
              },
              {
                key: "enrollments",
                label: "Enrollments",
                children: drawerLoading.enrollments ? (
                  <div className="py-10 flex justify-center">
                    <Spin />
                  </div>
                ) : studentYearEnrollments.length ? (
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={studentYearEnrollments}
                    columns={[
                      { title: "Academic Year", dataIndex: "academic_year", key: "academic_year", render: (v) => v ?? "—" },
                      { title: "Grade", dataIndex: "grade_level", key: "grade_level", render: (v) => v ?? "—" },
                      { title: "Section", dataIndex: "section", key: "section", render: (v) => (v ? String(v) : "—") },
                      { title: "Roll No", dataIndex: "roll_number", key: "roll_number", render: (v) => v ?? "—" },
                      {
                        title: "Status",
                        dataIndex: "enrollment_status",
                        key: "enrollment_status",
                        render: (v) => <Tag color={statusTagColor(String(v ?? ""))}>{String(v ?? "—")}</Tag>,
                      },
                    ]}
                  />
                ) : (
                  <div className="text-white/60">No enrollments found</div>
                ),
              },
              {
                key: "discipline",
                label: "Discipline",
                children: drawerLoading.discipline ? (
                  <div className="py-10 flex justify-center">
                    <Spin />
                  </div>
                ) : disciplinaryRecords.length ? (
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={disciplinaryRecords}
                    columns={[
                      { title: "Date", dataIndex: "incident_date", key: "incident_date", render: (v) => (v ? String(v) : "—") },
                      { title: "Severity", dataIndex: "severity", key: "severity", render: (v) => v ?? "—" },
                      { title: "Description", dataIndex: "description", key: "description", render: (v) => (v ? String(v) : "—") },
                      { title: "Resolved", dataIndex: "resolved", key: "resolved", render: (v) => (v ? "Yes" : "No") },
                    ]}
                  />
                ) : (
                  <div className="text-white/60">No disciplinary records found</div>
                ),
              },
              {
                key: "achievements",
                label: "Achievements",
                children: drawerLoading.achievements ? (
                  <div className="py-10 flex justify-center">
                    <Spin />
                  </div>
                ) : studentAchievements.length ? (
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={studentAchievements}
                    columns={[
                      { title: "Date", dataIndex: "achieved_on", key: "achieved_on", render: (v) => (v ? String(v) : "—") },
                      { title: "Title", dataIndex: "title", key: "title", render: (v) => v ?? "—" },
                      { title: "Category", dataIndex: "category", key: "category", render: (v) => v ?? "—" },
                      { title: "Description", dataIndex: "description", key: "description", render: (v) => (v ? String(v) : "—") },
                    ]}
                  />
                ) : (
                  <div className="text-white/60">No achievements found</div>
                ),
              },
            ]}
          />

          <div className="text-white/50 text-xs">
            Tip: Use the tabs to load transcript, attendance, fee, guardians, documents, enrollments, discipline, and achievements.
          </div>
        </div>
      )}
    </Drawer>
  );
}

