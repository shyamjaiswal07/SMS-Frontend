import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import WorkspacePageHeader from "@/features/workspace/WorkspacePageHeader";
import { currentTenant } from "@/utils/platform";
import { analyticsModuleConfigs, moduleMetrics, roleVisibleAnalyticsModules } from "./analyticsConfig";
import AnalyticsDetailModal from "./AnalyticsDetailModal";
import AnalyticsFilters from "./AnalyticsFilters";
import { useGetAnalyticsModuleQuery, useGetAnalyticsOverviewQuery } from "./analyticsApiSlice";
import AnalyticsModuleGrid from "./AnalyticsModuleGrid";
import type { AnalyticsDateRangeParams, AnalyticsModuleKey } from "./analyticsTypes";

function isAnalyticsModuleKey(value: string | null): value is AnalyticsModuleKey {
  return analyticsModuleConfigs.some((item) => item.key === value);
}

function analyticsQueryParams(startDate: string, endDate: string): AnalyticsDateRangeParams | undefined {
  if (!startDate && !endDate) return undefined;
  return {
    ...(startDate ? { start_date: startDate } : {}),
    ...(endDate ? { end_date: endDate } : {}),
  };
}

export default function AnalyticsWorkspace() {
  const navigate = useNavigate();
  const tenant = currentTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedStartDate = searchParams.get("start_date") ?? "";
  const appliedEndDate = searchParams.get("end_date") ?? "";
  const activeModule = isAnalyticsModuleKey(searchParams.get("module")) ? (searchParams.get("module") as AnalyticsModuleKey) : null;
  const [draftStartDate, setDraftStartDate] = useState(appliedStartDate);
  const [draftEndDate, setDraftEndDate] = useState(appliedEndDate);

  useEffect(() => {
    setDraftStartDate(appliedStartDate);
  }, [appliedStartDate]);

  useEffect(() => {
    setDraftEndDate(appliedEndDate);
  }, [appliedEndDate]);

  const visibleModules = useMemo(() => {
    const visibleKeys = new Set(roleVisibleAnalyticsModules(tenant?.role));
    return analyticsModuleConfigs.filter((item) => visibleKeys.has(item.key));
  }, [tenant?.role]);

  const params = useMemo(() => analyticsQueryParams(appliedStartDate, appliedEndDate), [appliedEndDate, appliedStartDate]);
  const overviewQuery = useGetAnalyticsOverviewQuery(params);
  const moduleDetailQuery = useGetAnalyticsModuleQuery(
    activeModule ? { moduleKey: activeModule, params } : skipToken,
  );

  const metricsByModule = useMemo(
    () =>
      Object.fromEntries(visibleModules.map((item) => [item.key, moduleMetrics(overviewQuery.data ?? {}, item.key)])) as Record<
        string,
        Record<string, unknown>
      >,
    [overviewQuery.data, visibleModules],
  );

  const periodLabel = `${overviewQuery.data?.period?.start_date || appliedStartDate || "-"} to ${
    overviewQuery.data?.period?.end_date || appliedEndDate || "-"
  }`;
  const loading = overviewQuery.isFetching || moduleDetailQuery.isFetching;

  const applyFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    if (draftStartDate) nextParams.set("start_date", draftStartDate);
    else nextParams.delete("start_date");
    if (draftEndDate) nextParams.set("end_date", draftEndDate);
    else nextParams.delete("end_date");
    setSearchParams(nextParams, { replace: true });
  };

  const resetFilters = () => {
    setDraftStartDate("");
    setDraftEndDate("");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("start_date");
    nextParams.delete("end_date");
    setSearchParams(nextParams, { replace: true });
  };

  const openModuleDetail = (moduleKey: AnalyticsModuleKey) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("module", moduleKey);
    setSearchParams(nextParams, { replace: true });
  };

  const closeModuleDetail = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("module");
    setSearchParams(nextParams, { replace: true });
  };

  const refresh = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      activeModule ? moduleDetailQuery.refetch() : Promise.resolve(),
    ]);
  };

  return (
    <div className="space-y-4">
      <WorkspacePageHeader
        title="Analytics Workspace"
        description="Sprint 13 unified analytics with role-aware module cards, date filtering, and cached drill-downs."
        loading={loading}
        onRefresh={() => {
          void refresh();
        }}
      />

      <AnalyticsFilters
        startDate={draftStartDate}
        endDate={draftEndDate}
        loading={overviewQuery.isFetching}
        onStartDateChange={setDraftStartDate}
        onEndDateChange={setDraftEndDate}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      <AnalyticsModuleGrid
        modules={visibleModules}
        periodLabel={periodLabel}
        metricsByModule={metricsByModule}
        onOpenRoute={(route) => navigate(route)}
        onOpenDetail={openModuleDetail}
      />

      <AnalyticsDetailModal
        open={!!activeModule}
        loading={moduleDetailQuery.isFetching}
        detail={moduleDetailQuery.data}
        title={activeModule ? `${String(activeModule).toUpperCase()} Analytics` : "Module Analytics"}
        onClose={closeModuleDetail}
      />
    </div>
  );
}
