import { Tabs } from "antd";
import PortalDashboardCenter from "@/features/portal/PortalDashboardCenter";
import StudentDocumentCenter from "@/features/students/StudentDocumentCenter";
import StudentsCore from "./index";

function getRole(): string | undefined {
  try {
    return (JSON.parse(sessionStorage.getItem("tenant") || "null")?.role as string | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

export default function StudentsSprintPage() {
  const role = getRole();
  const isPortalUser = role === "PARENT" || role === "STUDENT";

  return (
    <Tabs
      defaultActiveKey={isPortalUser ? "portal" : "records"}
      items={
        isPortalUser
          ? [
              { key: "portal", label: role === "PARENT" ? "Family Portal" : "My Portal", children: <PortalDashboardCenter /> },
              { key: "records", label: role === "PARENT" ? "Linked Records" : "My Record", children: <StudentsCore /> },
            ]
          : [
              { key: "records", label: "Student Records", children: <StudentsCore /> },
              { key: "documents", label: "Document Uploads", children: <StudentDocumentCenter /> },
            ]
      }
    />
  );
}
