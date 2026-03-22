import { BookOutlined, ProfileOutlined, TeamOutlined, WalletOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import { useMemo } from "react";
import { useGetAdminUsersQuery } from "@/features/admin/adminApiSlice";
import { useGetStaffProfilesQuery } from "@/features/hr/hrApiSlice";
import { useGetStudentsQuery } from "@/features/students/studentsApiSlice";
import WorkspacePageHeader from "@/features/workspace/WorkspacePageHeader";
import WorkspaceStatsGrid from "@/features/workspace/WorkspaceStatsGrid";
import useWorkspaceTab from "@/features/workspace/useWorkspaceTab";
import { buildOptions } from "@/features/workspace/workspaceUtils";
import { libraryApi, type LibraryResourceKey } from "./libraryApi";
import LibraryCatalogTab from "./LibraryCatalogTab";
import LibraryCirculationTab from "./LibraryCirculationTab";
import LibraryReportsPanel from "./LibraryReportsPanel";
import type { BookCategoryRow, BookRow, LibraryMemberRow } from "./libraryTypes";
import { useLibraryWorkspace } from "./useLibraryWorkspace";
import { rowsOf } from "@/utils/platform";

function categoryLabel(row: BookCategoryRow) {
  return `${row.code ?? row.id} - ${row.name ?? "Category"}`.trim();
}

function bookLabel(row: BookRow) {
  return row.title ?? `Book #${row.id}`;
}

function memberLabel(row: LibraryMemberRow) {
  return `${row.member_code ?? row.id} - ${row.member_type ?? "MEMBER"}`.trim();
}

export default function LibraryWorkspace() {
  const { activeTab, setActiveTab } = useWorkspaceTab("catalog");
  const { categories, books, members, issues, reservations, loading, refetchAll } = useLibraryWorkspace();
  const usersQuery = useGetAdminUsersQuery({ page: 1, page_size: 200 });
  const studentsQuery = useGetStudentsQuery({ page: 1, page_size: 200 });
  const staffQuery = useGetStaffProfilesQuery({ page: 1, page_size: 200 });
  const users = rowsOf(usersQuery.data);
  const students = rowsOf(studentsQuery.data);
  const staff = rowsOf(staffQuery.data);

  const categoryMap = useMemo(() => new Map(categories.map((row) => [row.id, categoryLabel(row)])), [categories]);
  const bookMap = useMemo(() => new Map(books.map((row) => [row.id, bookLabel(row)])), [books]);
  const userMap = useMemo(
    () =>
      new Map(
        users.map((row) => [
          row.id,
          `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email || row.username || `User #${row.id}`,
        ]),
      ),
    [users],
  );
  const studentMap = useMemo(
    () =>
      new Map(
        students.map((row) => [
          row.id,
          `${row.student_id ?? row.id} - ${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
        ]),
      ),
    [students],
  );
  const staffMap = useMemo(
    () =>
      new Map(
        staff.map((row) => [
          row.id,
          `${row.employee_code ?? row.id} - ${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
        ]),
      ),
    [staff],
  );
  const memberMap = useMemo(() => new Map(members.map((row) => [row.id, memberLabel(row)])), [members]);

  const categoryOptions = useMemo(() => buildOptions(categories, categoryLabel), [categories]);
  const bookOptions = useMemo(() => buildOptions(books, bookLabel), [books]);
  const memberOptions = useMemo(() => buildOptions(members, memberLabel), [members]);
  const userOptions = useMemo(
    () =>
      buildOptions(
        users,
        (row) =>
          `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email || row.username || `User #${row.id}`,
      ),
    [users],
  );
  const studentOptions = useMemo(
    () =>
      buildOptions(
        students,
        (row) => `${row.student_id ?? row.id} - ${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
      ),
    [students],
  );
  const staffOptions = useMemo(
    () =>
      buildOptions(
        staff,
        (row) => `${row.employee_code ?? row.id} - ${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
      ),
    [staff],
  );

  const stats = useMemo(
    () => [
      { key: "books", label: "Books", value: books.length, icon: <BookOutlined className="text-[var(--cv-accent)]" /> },
      { key: "members", label: "Members", value: members.length, icon: <TeamOutlined className="text-[var(--cv-accent)]" /> },
      {
        key: "open_issues",
        label: "Open Issues",
        value: issues.filter((row) => row.status !== "RETURNED").length,
        icon: <ProfileOutlined className="text-[var(--cv-accent)]" />,
      },
      {
        key: "reservations",
        label: "Reservations",
        value: reservations.length,
        icon: <WalletOutlined className="text-[var(--cv-accent)]" />,
      },
    ],
    [books.length, issues, members.length, reservations.length],
  );

  const handleCreate = async (resource: LibraryResourceKey, payload: Record<string, unknown>) => {
    await libraryApi.createRecord(resource, payload);
    await refetchAll();
  };

  return (
    <div className="space-y-4">
      <WorkspacePageHeader
        title="Library Workspace"
        description="Sprint 12 catalog, circulation, and reporting flows organized into focused tabs instead of the generic ERP page."
        loading={loading || usersQuery.isFetching || studentsQuery.isFetching || staffQuery.isFetching}
        onRefresh={() => {
          void Promise.all([refetchAll(), usersQuery.refetch(), studentsQuery.refetch(), staffQuery.refetch()]);
        }}
      />

      <WorkspaceStatsGrid stats={stats} />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "catalog",
            label: "Catalog",
            children: (
              <LibraryCatalogTab
                loading={loading}
                categories={categories}
                books={books}
                categoryMap={categoryMap}
                categoryOptions={categoryOptions}
                onCreate={handleCreate}
              />
            ),
          },
          {
            key: "circulation",
            label: "Circulation",
            children: (
              <LibraryCirculationTab
                loading={loading}
                members={members}
                issues={issues}
                reservations={reservations}
                userMap={userMap}
                studentMap={studentMap}
                staffMap={staffMap}
                bookMap={bookMap}
                memberMap={memberMap}
                userOptions={userOptions}
                studentOptions={studentOptions}
                staffOptions={staffOptions}
                bookOptions={bookOptions}
                memberOptions={memberOptions}
                onCreate={handleCreate}
              />
            ),
          },
          {
            key: "reports",
            label: "Reports",
            children: <LibraryReportsPanel />,
          },
        ]}
      />
    </div>
  );
}
