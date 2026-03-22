export type PortalStudentSummary = {
  id: number;
  student_id: string;
  name: string;
};

export type PortalNotice = {
  id: number;
  title: string;
  body: string;
  publish_at?: string | null;
  expire_at?: string | null;
  is_pinned?: boolean;
};

export type PortalDashboardData = {
  student: PortalStudentSummary;
  children?: PortalStudentSummary[];
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    percentage: number;
  };
  fees: {
    invoiced: number | string;
    outstanding: number | string;
    paid: number | string;
    invoice_count: number;
    next_due_date?: string | null;
    overdue_count: number;
  };
  notices: PortalNotice[];
  documents: {
    count: number;
    recent: PortalDocument[];
  };
};

export type PortalDocument = {
  id: number;
  source: "STUDENT_DOCUMENT" | "ACADEMIC_ARTIFACT";
  title: string;
  document_type?: string;
  artifact_type?: string;
  document_number?: string;
  issued_on?: string | null;
  expires_on?: string | null;
  verification_code?: string;
  is_revoked?: boolean;
  file_asset_id?: number | null;
  download_url?: string;
};

export type PortalDocumentsData = {
  student: PortalStudentSummary;
  children?: PortalStudentSummary[];
  count: number;
  documents: PortalDocument[];
};

export type PortalInvoice = {
  id: number;
  student: number;
  academic_year: number;
  term?: number | null;
  invoice_no: string;
  issue_date?: string;
  due_date?: string;
  status?: string;
  total_amount?: number | string;
  due_amount?: number | string;
};
