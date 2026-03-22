export type AnalyticsModuleKey =
  | "academics"
  | "finance"
  | "hr"
  | "library"
  | "transport"
  | "communications";

export type AnalyticsDateRangeParams = {
  start_date?: string;
  end_date?: string;
};

export type AnalyticsMetricRecord = Record<string, unknown>;

export type AnalyticsPeriod = {
  start_date?: string;
  end_date?: string;
};

export type AnalyticsOverviewResponse = {
  period?: AnalyticsPeriod;
  academics?: AnalyticsMetricRecord;
  finance?: AnalyticsMetricRecord;
  hr?: AnalyticsMetricRecord;
  library?: AnalyticsMetricRecord;
  transport?: AnalyticsMetricRecord;
  communications?: AnalyticsMetricRecord;
};

export type AnalyticsModuleResponse = {
  module: AnalyticsModuleKey | string;
  period?: AnalyticsPeriod;
  kpis?: AnalyticsMetricRecord;
};
