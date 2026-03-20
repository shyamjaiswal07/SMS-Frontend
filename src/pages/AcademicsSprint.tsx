import { Tabs } from "antd";
import AcademicsCore from "@/pages/Academics";
import AcademicsAdvancedCenter from "@/features/academics/AcademicsAdvancedCenter";

export default function AcademicsSprintPage() {
  return (
    <Tabs
      defaultActiveKey="core"
      items={[
        { key: "core", label: "Core Academics", children: <AcademicsCore /> },
        { key: "advanced", label: "Grading, Curriculum, Artifacts", children: <AcademicsAdvancedCenter /> },
      ]}
    />
  );
}
