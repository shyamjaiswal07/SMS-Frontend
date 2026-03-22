import {
  BellOutlined,
  BookOutlined,
  CarOutlined,
  DollarOutlined,
  ReadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import type { AnalyticsModuleKey, AnalyticsOverviewResponse } from "./analyticsTypes";

export type AnalyticsModuleConfig = {
  key: AnalyticsModuleKey;
  title: string;
  icon: ReactNode;
  route: string;
};

export const analyticsModuleConfigs: AnalyticsModuleConfig[] = [
  { key: "academics", title: "Academics", icon: <BookOutlined />, route: "/academics" },
  { key: "finance", title: "Finance", icon: <DollarOutlined />, route: "/finance" },
  { key: "hr", title: "HR", icon: <TeamOutlined />, route: "/hr" },
  { key: "library", title: "Library", icon: <ReadOutlined />, route: "/library" },
  { key: "transport", title: "Transport", icon: <CarOutlined />, route: "/transport" },
  { key: "communications", title: "Communications", icon: <BellOutlined />, route: "/communications" },
];

export function roleVisibleAnalyticsModules(role?: string): AnalyticsModuleKey[] {
  switch (role) {
    case "TEACHER":
      return ["academics", "communications"];
    case "ACCOUNTANT":
      return ["finance", "communications"];
    case "HR_MANAGER":
      return ["hr", "communications"];
    case "LIBRARIAN":
      return ["library", "communications"];
    case "TRANSPORT_COORDINATOR":
      return ["transport", "communications"];
    case "STUDENT":
    case "PARENT":
      return ["academics", "communications"];
    default:
      return ["academics", "finance", "hr", "library", "transport", "communications"];
  }
}

export function moduleMetrics(overview: AnalyticsOverviewResponse, moduleKey: AnalyticsModuleKey) {
  return (overview[moduleKey] ?? {}) as Record<string, unknown>;
}
