import { Tabs } from "antd";
import FinanceAdvancedCenter from "@/features/finance/FinanceAdvancedCenter";
import FinanceCore from "./index";

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
