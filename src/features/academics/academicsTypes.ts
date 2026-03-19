export type ProgramRow = {
  id: number;
  code?: string;
  name?: string;
  description?: string;
};

export type CourseRow = {
  id: number;
  code?: string;
  title?: string;
  description?: string;
  credit_hours?: string | number;
  is_elective?: boolean;
  program?: number | null;
  subject?: number | null;
};

export type CoursePrerequisiteRow = {
  id: number;
  course?: number;
  prerequisite?: number;
};

export type ClassScheduleRow = {
  id: number;
  course?: number;
  section?: number;
  teacher?: number | null;
  room?: number | null;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  term?: number;
  academic_year?: number;
};

export type CourseEnrollmentRow = {
  id: number;
  student?: number;
  course?: number;
  academic_year?: number;
  term?: number;
  status?: string;
  final_score?: string | number | null;
  grade_letter?: string;
  grade_points?: string | number | null;
};

export type AssessmentRow = {
  id: number;
  course?: number;
  term?: number;
  assessment_type?: number;
  title?: string;
  max_marks?: string | number;
  due_date?: string | null;
  weight?: string | number;
};

export type AssessmentResultRow = {
  id: number;
  assessment?: number;
  enrollment?: number;
  marks_obtained?: string | number;
  graded_by?: number | null;
  graded_at?: string | null;
  feedback?: string;
};

export type AttendanceSessionRow = {
  id: number;
  schedule?: any;
  attendance_date?: string;
  period_number?: number;
  taken_by?: number | null;
  taken_by_email?: string;
};

export type AttendanceRecordRow = {
  id: number;
  session?: number;
  student?: any;
  status?: string;
  remark?: string;
  created_at?: string;
};

export type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

