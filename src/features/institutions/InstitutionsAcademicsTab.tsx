import { buildColumns } from "@/features/workspace/workspaceUtils";
import WorkspaceResourceCard from "@/features/workspace/WorkspaceResourceCard";
import type { WorkspaceOption } from "@/features/workspace/workspaceTypes";
import type { InstitutionsResourceKey } from "./institutionsApi";
import type { AcademicYearRow, DepartmentRow, GradeLevelRow, SubjectRow, TermRow } from "./institutionsTypes";

type Props = {
  loading: boolean;
  academicYears: AcademicYearRow[];
  terms: TermRow[];
  departments: DepartmentRow[];
  gradeLevels: GradeLevelRow[];
  subjects: SubjectRow[];
  academicYearMap: Map<number, string>;
  departmentMap: Map<number, string>;
  academicYearOptions: WorkspaceOption[];
  departmentOptions: WorkspaceOption[];
  onCreate: (resource: InstitutionsResourceKey, payload: Record<string, unknown>) => Promise<void>;
};

export default function InstitutionsAcademicsTab({
  loading,
  academicYears,
  terms,
  departments,
  gradeLevels,
  subjects,
  academicYearMap,
  departmentMap,
  academicYearOptions,
  departmentOptions,
  onCreate,
}: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <WorkspaceResourceCard
        title="Academic Years"
        description="Keep academic windows and current-year state visible for scheduling and admissions."
        endpoint="/api/institutions/academic-years/"
        rows={academicYears}
        loading={loading}
        columns={buildColumns<AcademicYearRow>([
          { key: "name", label: "Name" },
          { key: "start_date", label: "Start Date", kind: "date" },
          { key: "end_date", label: "End Date", kind: "date" },
          { key: "is_current", label: "Current", kind: "boolean" },
        ])}
        createButtonLabel="New Year"
        createInitialValues={{ is_current: false }}
        createFields={[
          { name: "name", label: "Name", type: "text", required: true },
          { name: "start_date", label: "Start Date", type: "date", required: true },
          { name: "end_date", label: "End Date", type: "date", required: true },
          { name: "is_current", label: "Current Year", type: "switch" },
        ]}
        onCreate={(payload) => onCreate("academicYears", payload)}
      />

      <WorkspaceResourceCard
        title="Terms"
        description="Sequence terms against academic years so downstream modules can share the same calendar structure."
        endpoint="/api/institutions/terms/"
        rows={terms}
        loading={loading}
        columns={buildColumns<TermRow>([
          { key: "academic_year", label: "Academic Year", map: academicYearMap },
          { key: "name", label: "Name" },
          { key: "sequence", label: "Sequence" },
          { key: "start_date", label: "Start Date", kind: "date" },
          { key: "end_date", label: "End Date", kind: "date" },
        ])}
        createButtonLabel="New Term"
        createInitialValues={{ sequence: 1 }}
        createFields={[
          { name: "academic_year", label: "Academic Year", type: "select", required: true, options: academicYearOptions },
          { name: "name", label: "Term Name", type: "text", required: true },
          { name: "sequence", label: "Sequence", type: "number", required: true },
          { name: "start_date", label: "Start Date", type: "date", required: true },
          { name: "end_date", label: "End Date", type: "date", required: true },
        ]}
        onCreate={(payload) => onCreate("terms", payload)}
      />

      <WorkspaceResourceCard
        title="Departments"
        description="Centralize subject and staffing-aligned department definitions for the institution."
        endpoint="/api/institutions/departments/"
        rows={departments}
        loading={loading}
        columns={buildColumns<DepartmentRow>([
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "description", label: "Description" },
        ])}
        createButtonLabel="New Department"
        createFields={[
          { name: "name", label: "Department Name", type: "text", required: true },
          { name: "code", label: "Department Code", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", colSpan: 24 },
        ]}
        onCreate={(payload) => onCreate("departments", payload)}
      />

      <WorkspaceResourceCard
        title="Grade Levels"
        description="Maintain grade-level masters used by admissions, sections, and fee structures."
        endpoint="/api/institutions/grade-levels/"
        rows={gradeLevels}
        loading={loading}
        columns={buildColumns<GradeLevelRow>([
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "sort_order", label: "Sort Order" },
        ])}
        createButtonLabel="New Grade"
        createInitialValues={{ sort_order: 1 }}
        createFields={[
          { name: "name", label: "Grade Name", type: "text", required: true },
          { name: "code", label: "Grade Code", type: "text", required: true },
          { name: "sort_order", label: "Sort Order", type: "number", required: true },
        ]}
        onCreate={(payload) => onCreate("gradeLevels", payload)}
      />

      <WorkspaceResourceCard
        title="Subjects"
        description="Keep subject masters reusable across curriculum, timetable, and assessment flows."
        endpoint="/api/institutions/subjects/"
        rows={subjects}
        loading={loading}
        columns={buildColumns<SubjectRow>([
          { key: "department", label: "Department", map: departmentMap },
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "credit_hours", label: "Credit Hours" },
        ])}
        createButtonLabel="New Subject"
        createInitialValues={{ credit_hours: 1 }}
        createFields={[
          { name: "department", label: "Department", type: "select", options: departmentOptions },
          { name: "name", label: "Subject Name", type: "text", required: true },
          { name: "code", label: "Subject Code", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", colSpan: 24 },
          { name: "credit_hours", label: "Credit Hours", type: "number", required: true },
        ]}
        onCreate={(payload) => onCreate("subjects", payload)}
      />
    </div>
  );
}
