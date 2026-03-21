import { Tabs } from "antd";
import HRLifecycleCenter from "./HRLifecycleCenter";
import PayrollDocumentCenter from "./PayrollDocumentCenter";
import HRWorkflowCenter from "./HRWorkflowCenter";

type Props = {
  activeTab?: string;
  onTabChange?: (key: string) => void;
};

export default function HRAdvancedCenter({ activeTab = "workflow", onTabChange }: Props) {
  return (
    <Tabs
      activeKey={activeTab}
      onChange={onTabChange}
      items={[
        { key: "workflow", label: "Workflow + Attendance", children: <HRWorkflowCenter /> },
        { key: "lifecycle", label: "Lifecycle", children: <HRLifecycleCenter /> },
        { key: "payroll", label: "Payroll + Tax Docs", children: <PayrollDocumentCenter /> },
      ]}
    />
  );
}
