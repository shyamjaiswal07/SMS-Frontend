export type StudentStatus = "APPLICANT" | "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";
export type AdmissionWorkflowState = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "WAITLISTED" | "CONVERTED";
export type StudentIdResetCycle = "NEVER" | "YEARLY";

export type StudentRow = {
  id: number;
  student_id?: string;
  admission_number?: string;
  first_name?: string;
  last_name?: string;
  status?: StudentStatus | string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  admitted_on?: string | null;
};

export type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export type StudentIdPolicy = {
  id: number;
  school: number;
  prefix: string;
  separator: string;
  include_year: boolean;
  reset_cycle: StudentIdResetCycle;
  sequence_padding: number;
  sequence_start: number;
  allow_manual_override: boolean;
  is_active: boolean;
  preview_next_student_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type StudentDrawerTabKey =
  | "transcript"
  | "attendance"
  | "fee"
  | "guardians"
  | "documents"
  | "enrollments"
  | "discipline"
  | "achievements";

