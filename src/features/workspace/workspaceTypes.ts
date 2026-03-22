import type { ReactNode } from "react";

export type WorkspaceOption = {
  label: string;
  value: string | number | boolean;
};

export type WorkspaceFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "datetime"
  | "time"
  | "json"
  | "select"
  | "switch";

export type WorkspaceFieldConfig = {
  name: string;
  label: string;
  type: WorkspaceFieldType;
  required?: boolean;
  options?: WorkspaceOption[];
  optionsKey?: string;
  placeholder?: string;
  colSpan?: number;
};

export type WorkspaceStat = {
  key: string;
  label: string;
  value: string | number;
  icon?: ReactNode;
};
