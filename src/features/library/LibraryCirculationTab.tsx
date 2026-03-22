import { buildColumns } from "@/features/workspace/workspaceUtils";
import WorkspaceResourceCard from "@/features/workspace/WorkspaceResourceCard";
import type { WorkspaceOption } from "@/features/workspace/workspaceTypes";
import type { LibraryResourceKey } from "./libraryApi";
import type { BookIssueRow, BookReservationRow, LibraryMemberRow } from "./libraryTypes";

type Props = {
  loading: boolean;
  members: LibraryMemberRow[];
  issues: BookIssueRow[];
  reservations: BookReservationRow[];
  userMap: Map<number, string>;
  studentMap: Map<number, string>;
  staffMap: Map<number, string>;
  bookMap: Map<number, string>;
  memberMap: Map<number, string>;
  userOptions: WorkspaceOption[];
  studentOptions: WorkspaceOption[];
  staffOptions: WorkspaceOption[];
  bookOptions: WorkspaceOption[];
  memberOptions: WorkspaceOption[];
  onCreate: (resource: LibraryResourceKey, payload: Record<string, unknown>) => Promise<void>;
};

export default function LibraryCirculationTab({
  loading,
  members,
  issues,
  reservations,
  userMap,
  studentMap,
  staffMap,
  bookMap,
  memberMap,
  userOptions,
  studentOptions,
  staffOptions,
  bookOptions,
  memberOptions,
  onCreate,
}: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <WorkspaceResourceCard
        title="Library Members"
        description="Link catalog access to users, students, or staff without mixing it into the operations page."
        endpoint="/api/library/library-members/"
        rows={members}
        loading={loading}
        columns={buildColumns<LibraryMemberRow>([
          { key: "member_code", label: "Member Code" },
          { key: "member_type", label: "Member Type", kind: "tag" },
          {
            key: "student",
            label: "Linked Record",
            render: (_, row) => {
              if (row.student) return <span className="text-white/80">{studentMap.get(row.student) ?? `Student #${row.student}`}</span>;
              if (row.staff) return <span className="text-white/80">{staffMap.get(row.staff) ?? `Staff #${row.staff}`}</span>;
              if (row.user) return <span className="text-white/80">{userMap.get(row.user) ?? `User #${row.user}`}</span>;
              return <span className="text-white/55">-</span>;
            },
          },
        ])}
        createButtonLabel="New Member"
        createInitialValues={{ member_type: "STUDENT" }}
        createFields={[
          { name: "member_code", label: "Member Code", type: "text", required: true },
          {
            name: "member_type",
            label: "Member Type",
            type: "select",
            required: true,
            options: [
              { label: "Student", value: "STUDENT" },
              { label: "Staff", value: "STAFF" },
              { label: "User", value: "USER" },
            ],
          },
          { name: "user", label: "Linked User", type: "select", options: userOptions },
          { name: "student", label: "Linked Student", type: "select", options: studentOptions },
          { name: "staff", label: "Linked Staff", type: "select", options: staffOptions },
        ]}
        onCreate={(payload) => onCreate("libraryMembers", payload)}
      />

      <WorkspaceResourceCard
        title="Book Issues"
        description="Track issued, returned, overdue, and lost items from one circulation desk view."
        endpoint="/api/library/book-issues/"
        rows={issues}
        loading={loading}
        columns={buildColumns<BookIssueRow>([
          { key: "book", label: "Book", map: bookMap },
          { key: "member", label: "Member", map: memberMap },
          { key: "issue_date", label: "Issued On", kind: "date" },
          { key: "due_date", label: "Due Date", kind: "date" },
          { key: "return_date", label: "Returned On", kind: "date" },
          {
            key: "status",
            label: "Status",
            kind: "tag",
            tagColors: { ISSUED: "blue", RETURNED: "success", OVERDUE: "orange", LOST: "red" },
          },
          { key: "late_fee", label: "Late Fee" },
        ])}
        createButtonLabel="Issue Book"
        createInitialValues={{ status: "ISSUED", late_fee: 0 }}
        createFields={[
          { name: "book", label: "Book", type: "select", required: true, options: bookOptions },
          { name: "member", label: "Member", type: "select", required: true, options: memberOptions },
          { name: "issue_date", label: "Issue Date", type: "date", required: true },
          { name: "due_date", label: "Due Date", type: "date", required: true },
          { name: "return_date", label: "Return Date", type: "date" },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: [
              { label: "Issued", value: "ISSUED" },
              { label: "Returned", value: "RETURNED" },
              { label: "Overdue", value: "OVERDUE" },
              { label: "Lost", value: "LOST" },
            ],
          },
          { name: "late_fee", label: "Late Fee", type: "number" },
        ]}
        onCreate={(payload) => onCreate("bookIssues", payload)}
      />

      <WorkspaceResourceCard
        title="Reservations"
        description="Handle holds and expiries in a separate lane from issue and return workflows."
        endpoint="/api/library/book-reservations/"
        rows={reservations}
        loading={loading}
        columns={buildColumns<BookReservationRow>([
          { key: "book", label: "Book", map: bookMap },
          { key: "member", label: "Member", map: memberMap },
          { key: "reserved_on", label: "Reserved On", kind: "date" },
          { key: "expires_on", label: "Expires On", kind: "date" },
          {
            key: "status",
            label: "Status",
            kind: "tag",
            tagColors: { ACTIVE: "blue", FULFILLED: "success", CANCELLED: "default", EXPIRED: "orange" },
          },
        ])}
        createButtonLabel="New Reservation"
        createInitialValues={{ status: "ACTIVE" }}
        createFields={[
          { name: "book", label: "Book", type: "select", required: true, options: bookOptions },
          { name: "member", label: "Member", type: "select", required: true, options: memberOptions },
          { name: "reserved_on", label: "Reserved On", type: "date", required: true },
          { name: "expires_on", label: "Expires On", type: "date", required: true },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Fulfilled", value: "FULFILLED" },
              { label: "Cancelled", value: "CANCELLED" },
              { label: "Expired", value: "EXPIRED" },
            ],
          },
        ]}
        onCreate={(payload) => onCreate("bookReservations", payload)}
      />
    </div>
  );
}
