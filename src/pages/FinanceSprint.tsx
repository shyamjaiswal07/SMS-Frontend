import { Tabs } from "antd";
import FinanceCore from "@/pages/Finance";
import FinanceAdvancedCenter from "@/features/finance/FinanceAdvancedCenter";

export default function FinanceSprintPage() {
  return (
    <Tabs
      defaultActiveKey="core"
      items={[
        { key: "core", label: "Core Finance", children: <FinanceCore /> },
        { key: "advanced", label: "Statements, Budget, Print", children: <FinanceAdvancedCenter /> },
      ]}
    />
  );
}
