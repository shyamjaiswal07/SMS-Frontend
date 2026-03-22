import { buildColumns } from "@/features/workspace/workspaceUtils";
import WorkspaceResourceCard from "@/features/workspace/WorkspaceResourceCard";
import type { WorkspaceOption } from "@/features/workspace/workspaceTypes";
import type { InstitutionsResourceKey } from "./institutionsApi";
import type { SchoolRow, SubscriptionPlanRow, TenantDomainRow, TenantSubscriptionRow } from "./institutionsTypes";

type Props = {
  loading: boolean;
  schools: SchoolRow[];
  tenantDomains: TenantDomainRow[];
  subscriptionPlans: SubscriptionPlanRow[];
  tenantSubscriptions: TenantSubscriptionRow[];
  schoolMap: Map<number, string>;
  planMap: Map<number, string>;
  schoolOptions: WorkspaceOption[];
  planOptions: WorkspaceOption[];
  onCreate: (resource: InstitutionsResourceKey, payload: Record<string, unknown>) => Promise<void>;
};

export default function InstitutionsTenancyTab({
  loading,
  schools,
  tenantDomains,
  subscriptionPlans,
  tenantSubscriptions,
  schoolMap,
  planMap,
  schoolOptions,
  planOptions,
  onCreate,
}: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <WorkspaceResourceCard
        title="Schools"
        description="Provision school tenants and keep their core profile metadata in one place."
        endpoint="/api/institutions/schools/"
        rows={schools}
        loading={loading}
        columns={buildColumns<SchoolRow>([
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "city", label: "City" },
          { key: "timezone", label: "Timezone" },
          { key: "currency", label: "Currency" },
        ])}
        createButtonLabel="New School"
        createInitialValues={{ timezone: "UTC", currency: "INR" }}
        createFields={[
          { name: "name", label: "School Name", type: "text", required: true },
          { name: "code", label: "School Code", type: "text", required: true },
          { name: "email", label: "Email", type: "text" },
          { name: "phone_number", label: "Phone", type: "text" },
          { name: "website", label: "Website", type: "text" },
          { name: "timezone", label: "Timezone", type: "text", required: true },
          { name: "currency", label: "Currency", type: "text", required: true },
          { name: "city", label: "City", type: "text" },
          { name: "state", label: "State", type: "text" },
          { name: "country", label: "Country", type: "text" },
        ]}
        onCreate={(payload) => onCreate("schools", payload)}
      />

      <WorkspaceResourceCard
        title="Tenant Domains"
        description="Manage primary and verified custom domains mapped to each school tenant."
        endpoint="/api/institutions/tenant-domains/"
        rows={tenantDomains}
        loading={loading}
        columns={buildColumns<TenantDomainRow>([
          { key: "school", label: "School", map: schoolMap },
          { key: "domain", label: "Domain" },
          { key: "is_primary", label: "Primary", kind: "boolean" },
          { key: "is_verified", label: "Verified", kind: "boolean" },
        ])}
        createButtonLabel="Add Domain"
        createInitialValues={{ is_primary: false, is_verified: false }}
        createFields={[
          { name: "school", label: "School", type: "select", required: true, options: schoolOptions },
          { name: "domain", label: "Domain", type: "text", required: true },
          { name: "is_primary", label: "Primary Domain", type: "switch" },
          { name: "is_verified", label: "Verified", type: "switch" },
        ]}
        onCreate={(payload) => onCreate("tenantDomains", payload)}
      />

      <WorkspaceResourceCard
        title="Subscription Plans"
        description="Track reusable SaaS plans, limits, and feature bundles at the global level."
        endpoint="/api/institutions/subscription-plans/"
        rows={subscriptionPlans}
        loading={loading}
        columns={buildColumns<SubscriptionPlanRow>([
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "monthly_price", label: "Monthly Price" },
          { key: "max_students", label: "Max Students" },
          { key: "max_staff", label: "Max Staff" },
        ])}
        createButtonLabel="Create Plan"
        createInitialValues={{ max_students: 500, max_staff: 100, monthly_price: 0, features: "{}" }}
        createFields={[
          { name: "name", label: "Plan Name", type: "text", required: true },
          { name: "code", label: "Plan Code", type: "text", required: true },
          { name: "monthly_price", label: "Monthly Price", type: "number", required: true },
          { name: "max_students", label: "Max Students", type: "number", required: true },
          { name: "max_staff", label: "Max Staff", type: "number", required: true },
          { name: "features", label: "Features JSON", type: "json", colSpan: 24 },
        ]}
        transformCreateValues={(payload) => ({
          ...payload,
          features:
            typeof payload.features === "string" && payload.features.trim()
              ? JSON.parse(payload.features)
              : {},
        })}
        onCreate={(payload) => onCreate("subscriptionPlans", payload)}
      />

      <WorkspaceResourceCard
        title="Tenant Subscriptions"
        description="Attach billing plans to schools and manage renewal state without leaving the tenancy view."
        endpoint="/api/institutions/tenant-subscriptions/"
        rows={tenantSubscriptions}
        loading={loading}
        columns={buildColumns<TenantSubscriptionRow>([
          { key: "school", label: "School", map: schoolMap },
          { key: "plan", label: "Plan", map: planMap },
          { key: "billing_cycle", label: "Billing Cycle", kind: "tag" },
          { key: "status", label: "Status", kind: "tag" },
          { key: "start_date", label: "Start Date", kind: "date" },
          { key: "end_date", label: "End Date", kind: "date" },
          { key: "auto_renew", label: "Auto Renew", kind: "boolean" },
        ])}
        createButtonLabel="Assign Plan"
        createInitialValues={{ billing_cycle: "MONTHLY", status: "ACTIVE", auto_renew: true }}
        createFields={[
          { name: "school", label: "School", type: "select", required: true, options: schoolOptions },
          { name: "plan", label: "Plan", type: "select", required: true, options: planOptions },
          { name: "billing_cycle", label: "Billing Cycle", type: "text", required: true },
          { name: "status", label: "Status", type: "text", required: true },
          { name: "start_date", label: "Start Date", type: "date", required: true },
          { name: "end_date", label: "End Date", type: "date" },
          { name: "auto_renew", label: "Auto Renew", type: "switch" },
        ]}
        onCreate={(payload) => onCreate("tenantSubscriptions", payload)}
      />
    </div>
  );
}
