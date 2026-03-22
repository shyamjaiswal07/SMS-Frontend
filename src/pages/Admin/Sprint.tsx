import { Tabs } from "antd";
import AdminCore from "@/pages/Admin";
import AutomationCenter from "@/features/operations/AutomationCenter";
import ComplianceCenter from "@/features/operations/ComplianceCenter";
import IntegrationsCenter from "@/features/operations/IntegrationsCenter";
import ReportingCenter from "@/features/operations/ReportingCenter";
import SecurityCenter from "@/features/operations/SecurityCenter";

export default function AdminSprintPage() {
  return (
    <Tabs
      defaultActiveKey="core"
      items={[
        { key: "core", label: "Core Admin", children: <AdminCore /> },
        { key: "security", label: "Auth & Security", children: <SecurityCenter /> },
        { key: "automation", label: "Automation", children: <AutomationCenter /> },
        { key: "reporting", label: "Reporting", children: <ReportingCenter /> },
        { key: "integrations", label: "Integrations", children: <IntegrationsCenter /> },
        { key: "compliance", label: "Compliance", children: <ComplianceCenter /> },
      ]}
    />
  );
}
