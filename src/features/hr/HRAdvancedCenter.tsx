import { Tabs } from "antd";
import HRLifecycleCenter from "./HRLifecycleCenter";
import PayrollDocumentCenter from "./PayrollDocumentCenter";
import HRWorkflowCenter from "./HRWorkflowCenter";

export default function HRAdvancedCenter() {
  return (
    <Tabs
      defaultActiveKey="workflow"
      items={[
        { key: "workflow", label: "Workflow + Attendance", children: <HRWorkflowCenter /> },
        { key: "lifecycle", label: "Lifecycle", children: <HRLifecycleCenter /> },
        { key: "payroll", label: "Payroll + Tax Docs", children: <PayrollDocumentCenter /> },
      ]}
    />
  );
}
