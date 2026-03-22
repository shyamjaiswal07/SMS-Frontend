import { buildColumns } from "@/features/workspace/workspaceUtils";
import WorkspaceResourceCard from "@/features/workspace/WorkspaceResourceCard";
import type { WorkspaceOption } from "@/features/workspace/workspaceTypes";
import type { InstitutionsResourceKey } from "./institutionsApi";
import type { RoomRow, SectionRow } from "./institutionsTypes";

type Props = {
  loading: boolean;
  sections: SectionRow[];
  rooms: RoomRow[];
  gradeLevelMap: Map<number, string>;
  userMap: Map<number, string>;
  gradeLevelOptions: WorkspaceOption[];
  userOptions: WorkspaceOption[];
  onCreate: (resource: InstitutionsResourceKey, payload: Record<string, unknown>) => Promise<void>;
};

export default function InstitutionsFacilitiesTab({
  loading,
  sections,
  rooms,
  gradeLevelMap,
  userMap,
  gradeLevelOptions,
  userOptions,
  onCreate,
}: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <WorkspaceResourceCard
        title="Sections"
        description="Split grade levels into manageable cohorts and optionally map class teachers."
        endpoint="/api/institutions/sections/"
        rows={sections}
        loading={loading}
        columns={buildColumns<SectionRow>([
          { key: "grade_level", label: "Grade Level", map: gradeLevelMap },
          { key: "name", label: "Section" },
          { key: "capacity", label: "Capacity" },
          { key: "class_teacher", label: "Class Teacher", map: userMap },
        ])}
        createButtonLabel="New Section"
        createInitialValues={{ capacity: 40 }}
        createFields={[
          { name: "grade_level", label: "Grade Level", type: "select", required: true, options: gradeLevelOptions },
          { name: "name", label: "Section Name", type: "text", required: true },
          { name: "capacity", label: "Capacity", type: "number", required: true },
          { name: "class_teacher", label: "Class Teacher", type: "select", options: userOptions },
        ]}
        onCreate={(payload) => onCreate("sections", payload)}
      />

      <WorkspaceResourceCard
        title="Rooms"
        description="Register classrooms and shared spaces with capacity details for timetable planning."
        endpoint="/api/institutions/rooms/"
        rows={rooms}
        loading={loading}
        columns={buildColumns<RoomRow>([
          { key: "name", label: "Name" },
          { key: "building", label: "Building" },
          { key: "floor", label: "Floor" },
          { key: "capacity", label: "Capacity" },
        ])}
        createButtonLabel="New Room"
        createInitialValues={{ capacity: 30 }}
        createFields={[
          { name: "name", label: "Room Name", type: "text", required: true },
          { name: "building", label: "Building", type: "text" },
          { name: "floor", label: "Floor", type: "text" },
          { name: "capacity", label: "Capacity", type: "number", required: true },
        ]}
        onCreate={(payload) => onCreate("rooms", payload)}
      />
    </div>
  );
}
