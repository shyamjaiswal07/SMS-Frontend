import { Tabs } from "antd";
import { useSearchParams } from "react-router-dom";
import HRAdvancedCenter from "@/features/hr/HRAdvancedCenter";
import HRCore from "./index";

export default function HRSprintPage() {
  const [params, setParams] = useSearchParams();
  const scope = params.get("scope") === "advanced" ? "advanced" : "core";
  const advancedTab = params.get("tab") || "workflow";

  return (
    <Tabs
      activeKey={scope}
      onChange={(key) => {
        const next = new URLSearchParams(params);
        next.set("scope", key);
        if (key !== "advanced") {
          next.delete("tab");
        } else if (!next.get("tab")) {
          next.set("tab", "workflow");
        }
        setParams(next, { replace: true });
      }}
      items={[
        { key: "core", label: "Core HR", children: <HRCore /> },
        {
          key: "advanced",
          label: "Attendance, Lifecycle, Payroll",
          children: (
            <HRAdvancedCenter
              activeTab={advancedTab}
              onTabChange={(key) => {
                const next = new URLSearchParams(params);
                next.set("scope", "advanced");
                next.set("tab", key);
                setParams(next, { replace: true });
              }}
            />
          ),
        },
      ]}
    />
  );
}
