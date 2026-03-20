import { Tabs } from "antd";
import AcademicArtifactsCenter from "./AcademicArtifactsCenter";
import CurriculumCenter from "./CurriculumCenter";
import GradingGpaCenter from "./GradingGpaCenter";

export default function AcademicsAdvancedCenter() {
  return (
    <Tabs
      defaultActiveKey="grading"
      items={[
        { key: "grading", label: "Grading + GPA", children: <GradingGpaCenter /> },
        { key: "curriculum", label: "Curriculum", children: <CurriculumCenter /> },
        { key: "artifacts", label: "Artifacts", children: <AcademicArtifactsCenter /> },
      ]}
    />
  );
}
