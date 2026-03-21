import type { AdmissionWorkflowState, StudentStatus } from "@/features/students/studentTypes";

export type AdmissionApplicationRow = {
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
  status?: StudentStatus | string;
  workflow_state?: AdmissionWorkflowState;
  notes?: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string;
  converted_student?: number | null;
  converted_at?: string | null;
};

export type AdmissionWorkflowTransitionRow = {
  id: number;
  from_state?: AdmissionWorkflowState | null;
  to_state: AdmissionWorkflowState;
  action: string;
  reason?: string;
  performed_by?: number | null;
  metadata_json?: Record<string, unknown>;
  created_at?: string;
};

export const statusOptions: Array<{ label: string; value: "ALL" | StudentStatus }> = [
  { label: "All Statuses", value: "ALL" },
  { label: "Applicant", value: "APPLICANT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Graduated", value: "GRADUATED" },
  { label: "Transferred", value: "TRANSFERRED" },
];

export const workflowOptions: Array<{ label: string; value: "ALL" | AdmissionWorkflowState }> = [
  { label: "All Workflow States", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Waitlisted", value: "WAITLISTED" },
  { label: "Converted", value: "CONVERTED" },
];

export const workflowSteps: AdmissionWorkflowState[] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "CONVERTED"];

export const statusTagColor = (status?: string | null) => {
  switch (status) {
    case "ACTIVE": return "success";
    case "APPLICANT": return "processing";
    case "INACTIVE": return "default";
    case "GRADUATED": return "warning";
    case "TRANSFERRED": return "error";
    default: return "default";
  }
};

export const workflowTagColor = (workflowState?: AdmissionWorkflowState | string | null) => {
  switch (workflowState) {
    case "DRAFT": return "default";
    case "SUBMITTED": return "processing";
    case "UNDER_REVIEW": return "blue";
    case "APPROVED": return "green";
    case "REJECTED": return "red";
    case "WAITLISTED": return "orange";
    case "CONVERTED": return "gold";
    default: return "default";
  }
};

export const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "-");

export function getTenantRole(): string | undefined {
  try {
    return (JSON.parse(sessionStorage.getItem("tenant") || "null")?.role as string | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

export function getWorkflowStepIndex(workflowState?: AdmissionWorkflowState | string | null) {
  switch (workflowState) {
    case "REJECTED":
    case "WAITLISTED": return 2;
    default: return Math.max(workflowSteps.indexOf(workflowState as AdmissionWorkflowState ?? "DRAFT"), 0);
  }
}
