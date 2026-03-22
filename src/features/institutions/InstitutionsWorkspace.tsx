import { BankOutlined, ClusterOutlined, DeploymentUnitOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import { useMemo } from "react";
import { useGetAdminUsersQuery } from "@/features/admin/adminApiSlice";
import WorkspacePageHeader from "@/features/workspace/WorkspacePageHeader";
import WorkspaceStatsGrid from "@/features/workspace/WorkspaceStatsGrid";
import useWorkspaceTab from "@/features/workspace/useWorkspaceTab";
import { buildOptions } from "@/features/workspace/workspaceUtils";
import { institutionsApi, type InstitutionsResourceKey } from "./institutionsApi";
import InstitutionsAcademicsTab from "./InstitutionsAcademicsTab";
import InstitutionsFacilitiesTab from "./InstitutionsFacilitiesTab";
import InstitutionsTenancyTab from "./InstitutionsTenancyTab";
import type { SchoolRow, SubscriptionPlanRow } from "./institutionsTypes";
import { useInstitutionsWorkspace } from "./useInstitutionsWorkspace";
import { rowsOf } from "@/utils/platform";

function schoolLabel(row: SchoolRow) {
  return `${row.code ?? row.id} - ${row.name ?? "School"}`.trim();
}

function planLabel(row: SubscriptionPlanRow) {
  return `${row.code ?? row.id} - ${row.name ?? "Plan"}`.trim();
}

export default function InstitutionsWorkspace() {
  const { activeTab, setActiveTab } = useWorkspaceTab("tenancy");
  const {
    schools,
    tenantDomains,
    subscriptionPlans,
    tenantSubscriptions,
    academicYears,
    terms,
    departments,
    gradeLevels,
    sections,
    subjects,
    rooms,
    loading,
    refetchAll,
  } = useInstitutionsWorkspace();
  const usersQuery = useGetAdminUsersQuery({ page: 1, page_size: 200 });
  const users = rowsOf(usersQuery.data);

  const schoolMap = useMemo(() => new Map(schools.map((row) => [row.id, schoolLabel(row)])), [schools]);
  const planMap = useMemo(() => new Map(subscriptionPlans.map((row) => [row.id, planLabel(row)])), [subscriptionPlans]);
  const academicYearMap = useMemo(
    () => new Map(academicYears.map((row) => [row.id, row.name ?? `Academic Year #${row.id}`])),
    [academicYears],
  );
  const departmentMap = useMemo(
    () => new Map(departments.map((row) => [row.id, row.name ?? `Department #${row.id}`])),
    [departments],
  );
  const gradeLevelMap = useMemo(
    () => new Map(gradeLevels.map((row) => [row.id, row.name ?? `Grade #${row.id}`])),
    [gradeLevels],
  );
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

  const schoolOptions = useMemo(() => buildOptions(schools, schoolLabel), [schools]);
  const planOptions = useMemo(() => buildOptions(subscriptionPlans, planLabel), [subscriptionPlans]);
  const academicYearOptions = useMemo(
    () => buildOptions(academicYears, (row) => row.name ?? `Academic Year #${row.id}`),
    [academicYears],
  );
  const departmentOptions = useMemo(
    () => buildOptions(departments, (row) => row.name ?? `Department #${row.id}`),
    [departments],
  );
  const gradeLevelOptions = useMemo(
    () => buildOptions(gradeLevels, (row) => row.name ?? `Grade #${row.id}`),
    [gradeLevels],
  );
  const userOptions = useMemo(
    () =>
      buildOptions(
        users,
        (row) =>
          `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email || row.username || `User #${row.id}`,
      ),
    [users],
  );

  const stats = useMemo(
    () => [
      { key: "schools", label: "Schools", value: schools.length, icon: <BankOutlined className="text-[var(--cv-accent)]" /> },
      {
        key: "domains",
        label: "Domains",
        value: tenantDomains.length,
        icon: <DeploymentUnitOutlined className="text-[var(--cv-accent)]" />,
      },
      {
        key: "academics",
        label: "Academic Records",
        value: academicYears.length + terms.length + departments.length + gradeLevels.length + subjects.length,
        icon: <ClusterOutlined className="text-[var(--cv-accent)]" />,
      },
    ],
    [academicYears.length, departments.length, gradeLevels.length, schools.length, subjects.length, tenantDomains.length, terms.length],
  );

  const handleCreate = async (resource: InstitutionsResourceKey, payload: Record<string, unknown>) => {
    await institutionsApi.createRecord(resource, payload);
    await refetchAll();
  };

  return (
    <div className="space-y-4">
      <WorkspacePageHeader
        title="Institutions Workspace"
        description="Dedicated Sprint 12 tenancy, academic setup, and facility management without relying on the generic ERP console."
        loading={loading || usersQuery.isFetching}
        onRefresh={() => {
          void Promise.all([refetchAll(), usersQuery.refetch()]);
        }}
      />

      <WorkspaceStatsGrid stats={stats} />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "tenancy",
            label: "Tenancy",
            children: (
              <InstitutionsTenancyTab
                loading={loading}
                schools={schools}
                tenantDomains={tenantDomains}
                subscriptionPlans={subscriptionPlans}
                tenantSubscriptions={tenantSubscriptions}
                schoolMap={schoolMap}
                planMap={planMap}
                schoolOptions={schoolOptions}
                planOptions={planOptions}
                onCreate={handleCreate}
              />
            ),
          },
          {
            key: "academics",
            label: "Academic Setup",
            children: (
              <InstitutionsAcademicsTab
                loading={loading}
                academicYears={academicYears}
                terms={terms}
                departments={departments}
                gradeLevels={gradeLevels}
                subjects={subjects}
                academicYearMap={academicYearMap}
                departmentMap={departmentMap}
                academicYearOptions={academicYearOptions}
                departmentOptions={departmentOptions}
                onCreate={handleCreate}
              />
            ),
          },
          {
            key: "facilities",
            label: "Facilities",
            children: (
              <InstitutionsFacilitiesTab
                loading={loading}
                sections={sections}
                rooms={rooms}
                gradeLevelMap={gradeLevelMap}
                userMap={userMap}
                gradeLevelOptions={gradeLevelOptions}
                userOptions={userOptions}
                onCreate={handleCreate}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
