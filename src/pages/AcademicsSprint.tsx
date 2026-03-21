import { Tabs } from "antd";
import { useSearchParams } from "react-router-dom";
import AcademicsCore from "@/pages/Academics";
import AcademicsAdvancedCenter from "@/features/academics/AcademicsAdvancedCenter";

export default function AcademicsSprintPage() {
  const [params, setParams] = useSearchParams();
  const scope = params.get("scope") === "advanced" ? "advanced" : "core";
  const advancedTab = params.get("tab") || "grading";

  return (
    <Tabs
      activeKey={scope}
      onChange={(key) => {
        const next = new URLSearchParams(params);
        next.set("scope", key);
        if (key !== "advanced") {
          next.delete("tab");
        } else if (!next.get("tab")) {
          next.set("tab", "grading");
        }
        setParams(next, { replace: true });
      }}
      items={[
        { key: "core", label: "Core Academics", children: <AcademicsCore /> },
        {
          key: "advanced",
          label: "Workflows, Risk, Grading, Artifacts",
          children: (
            <AcademicsAdvancedCenter
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
