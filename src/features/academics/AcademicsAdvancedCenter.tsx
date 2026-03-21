import { Tabs } from "antd";
import AcademicArtifactsCenter from "./AcademicArtifactsCenter";
import AcademicWorkflowCenter from "./AcademicWorkflowCenter";
import AttendanceRiskCenter from "./AttendanceRiskCenter";
import CurriculumCenter from "./CurriculumCenter";
import GradingGpaCenter from "./GradingGpaCenter";

type Props = {
  activeTab?: string;
  onTabChange?: (key: string) => void;
};

export default function AcademicsAdvancedCenter({ activeTab = "grading", onTabChange }: Props) {
  return (
    <Tabs
      activeKey={activeTab}
      onChange={onTabChange}
      items={[
        { key: "grading", label: "Grading + GPA", children: <GradingGpaCenter /> },
        { key: "curriculum", label: "Curriculum", children: <CurriculumCenter /> },
        { key: "workflow", label: "Calendar + Assignments", children: <AcademicWorkflowCenter /> },
        { key: "attendance-risk", label: "Attendance Risk", children: <AttendanceRiskCenter /> },
        { key: "artifacts", label: "Artifacts", children: <AcademicArtifactsCenter /> },
      ]}
    />
  );
}
