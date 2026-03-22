import { Tabs } from "antd";
import StudentDocumentCenter from "@/features/students/StudentDocumentCenter";
import StudentsCore from "./index";

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
