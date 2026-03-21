import { Tabs } from "antd";
import AcademicArtifactsCenter from "./AcademicArtifactsCenter";
import AcademicWorkflowCenter from "./AcademicWorkflowCenter";
import AttendanceRiskCenter from "./AttendanceRiskCenter";
import CurriculumCenter from "./CurriculumCenter";
import GradingGpaCenter from "./GradingGpaCenter";

export default function AcademicsAdvancedCenter() {
  return (
    <Tabs
      defaultActiveKey="grading"
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
