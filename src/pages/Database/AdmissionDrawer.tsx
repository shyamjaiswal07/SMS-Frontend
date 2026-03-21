import { Button, Card, Descriptions, Drawer, Empty, Space, Spin, Steps, Tag } from "antd";
import type { ReactNode } from "react";
import type { AdmissionApplicationRow, AdmissionWorkflowTransitionRow } from "./utils";
import { formatDateTime, getWorkflowStepIndex, statusTagColor, workflowSteps, workflowTagColor } from "./utils";

interface AdmissionDrawerProps {
  open: boolean;
  onClose: () => void;
  selected: AdmissionApplicationRow | null;
  loading: boolean;
  workflowHistory: AdmissionWorkflowTransitionRow[];
  canWrite: boolean;
  actionButtons: ReactNode;
}

export function AdmissionDrawer({ open, onClose, selected, loading, workflowHistory, canWrite, actionButtons }: AdmissionDrawerProps) {
  return (
    <Drawer
      title={
        selected ? (
          <div className="flex items-center justify-between gap-3 w-full flex-wrap">
            <div>
              <div className="text-white font-semibold">{selected.application_no ?? selected.id}</div>
              <div className="text-white/60 text-sm">
                {`${selected.first_name ?? ""} ${selected.last_name ?? ""}`.trim() || "Applicant"}
              </div>
            </div>
            <Space wrap>
              <Tag color={statusTagColor(selected.status)}>{selected.status ?? "-"}</Tag>
              <Tag color={workflowTagColor(selected.workflow_state)}>{selected.workflow_state ?? "-"}</Tag>
            </Space>
          </div>
        ) : null
      }
      width={820}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      {!selected ? null : loading ? (
        <div className="py-10 flex justify-center">
          <Spin />
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <div className="text-white font-medium mb-4">Workflow Timeline</div>
            <Steps
              current={getWorkflowStepIndex(selected.workflow_state)}
              status={selected.workflow_state === "REJECTED" ? "error" : "process"}
              responsive
              items={workflowSteps.map((step) => ({ title: step.replace(/_/g, " ") }))}
            />
            {selected.workflow_state === "WAITLISTED" ? (
              <div className="mt-3 text-sm text-orange-300">This application is currently waitlisted and can be moved back into review.</div>
            ) : null}
            {selected.rejection_reason ? (
              <div className="mt-3 text-sm text-red-300">Rejection reason: {selected.rejection_reason}</div>
            ) : null}
          </Card>

          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-white font-medium">Workflow Actions</div>
                <div className="text-white/55 text-sm">Role-guarded actions are enabled only for school admins and super admins.</div>
              </div>
              <Space wrap>
                {canWrite ? actionButtons : <Button disabled>No write permission</Button>}
              </Space>
            </div>
          </Card>

          <Descriptions
            column={1}
            size="small"
            styles={{ label: { color: "rgba(255,255,255,0.55)" }, content: { color: "#e5e7eb" } }}
            items={[
              { key: "dob", label: "Date of Birth", children: selected.date_of_birth ?? "-" },
              { key: "year", label: "Applying For Year", children: selected.applying_for_year ? String(selected.applying_for_year) : "-" },
              { key: "grade", label: "Applying For Grade", children: selected.applying_for_grade ? String(selected.applying_for_grade) : "-" },
              { key: "parent", label: "Parent / Guardian", children: selected.parent_name ?? "-" },
              { key: "phone", label: "Parent Phone", children: selected.parent_phone ?? "-" },
              { key: "email", label: "Parent Email", children: selected.parent_email ?? "-" },
              { key: "notes", label: "Notes", children: selected.notes ?? "-" },
              { key: "submitted", label: "Submitted At", children: formatDateTime(selected.submitted_at) },
              { key: "reviewed", label: "Reviewed At", children: formatDateTime(selected.reviewed_at) },
              { key: "approved", label: "Approved At", children: formatDateTime(selected.approved_at) },
              { key: "rejected", label: "Rejected At", children: formatDateTime(selected.rejected_at) },
              { key: "converted", label: "Converted At", children: formatDateTime(selected.converted_at) },
              { key: "converted_student", label: "Converted Student", children: selected.converted_student ? `Student #${selected.converted_student}` : "-" },
            ]}
          />

          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <div className="text-white font-medium mb-3">Workflow History</div>
            {workflowHistory.length ? (
              <div className="space-y-3">
                {workflowHistory.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-white font-medium">{item.action.replace(/_/g, " ")}</div>
                        <div className="text-white/50 text-xs mt-1">
                          {item.from_state ?? "START"} to {item.to_state}
                        </div>
                      </div>
                      <div className="text-white/45 text-xs">{formatDateTime(item.created_at)}</div>
                    </div>
                    <div className="mt-3 text-white/70 text-sm">{item.reason || "No note provided."}</div>
                    {item.performed_by ? <div className="mt-2 text-white/45 text-xs">Actor: User #{item.performed_by}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={<span className="text-white/50">No workflow events yet</span>} />
            )}
          </Card>
        </div>
      )}
    </Drawer>
  );
}
