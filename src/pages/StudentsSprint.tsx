import { Tabs } from "antd";
import StudentsCore from "@/pages/Students";
import StudentDocumentCenter from "@/features/students/StudentDocumentCenter";

export default function StudentsSprintPage() {
  return (
    <Tabs
      defaultActiveKey="records"
      items={[
        { key: "records", label: "Student Records", children: <StudentsCore /> },
        { key: "documents", label: "Document Uploads", children: <StudentDocumentCenter /> },
      ]}
    />
  );
}
