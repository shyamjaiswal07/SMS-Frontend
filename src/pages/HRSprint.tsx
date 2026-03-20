import { Tabs } from "antd";
import HRCore from "@/pages/HR";
import HRAdvancedCenter from "@/features/hr/HRAdvancedCenter";

export default function HRSprintPage() {
  return (
    <Tabs
      defaultActiveKey="core"
      items={[
        { key: "core", label: "Core HR", children: <HRCore /> },
        { key: "advanced", label: "Attendance, Performance, Payroll", children: <HRAdvancedCenter /> },
      ]}
    />
  );
}
