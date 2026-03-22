import { Input, InputNumber, Select, Switch, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import { formatDate, formatDateTime } from "@/utils/platform";
import type { WorkspaceFieldConfig, WorkspaceOption } from "./workspaceTypes";

type ColumnSpec<T> = {
  key: keyof T & string;
  label?: string;
  map?: Map<string | number, string>;
  kind?: "date" | "datetime" | "boolean" | "tag";
  tagColors?: Record<string, string>;
  trueLabel?: string;
  falseLabel?: string;
  render?: (value: unknown, row: T) => ReactNode;
};

export function toTitleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function renderWorkspaceField(field: WorkspaceFieldConfig, options: WorkspaceOption[]) {
  if (field.type === "textarea" || field.type === "json") {
    return <Input.TextArea rows={4} placeholder={field.placeholder} />;
  }
  if (field.type === "number") {
    return <InputNumber className="!w-full" placeholder={field.placeholder} />;
  }
  if (field.type === "date") {
    return <Input type="date" placeholder={field.placeholder} />;
  }
  if (field.type === "datetime") {
    return <Input type="datetime-local" placeholder={field.placeholder} />;
  }
  if (field.type === "time") {
    return <Input type="time" placeholder={field.placeholder} />;
  }
  if (field.type === "switch") {
    return <Switch />;
  }
  if (field.type === "select") {
    return <Select showSearch optionFilterProp="label" options={field.options ?? options} placeholder={field.placeholder} />;
  }
  return <Input placeholder={field.placeholder} />;
}

export function cleanPayload<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ) as Record<string, unknown>;
}

export function buildOptions<T extends { id: string | number }>(rows: T[], getLabel: (row: T) => string): WorkspaceOption[] {
  return rows.map((row) => ({ value: row.id, label: getLabel(row) }));
}

export function stringifyWorkspaceValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function buildColumns<T extends Record<string, unknown>>(specs: Array<ColumnSpec<T>>): ColumnsType<T> {
  return specs.map((spec) => ({
    title: spec.label ?? toTitleCase(spec.key),
    dataIndex: spec.key,
    key: spec.key,
    render: (value: unknown, row: T) => {
      if (spec.render) return spec.render(value, row);
      if (spec.map && (typeof value === "number" || typeof value === "string")) {
        return <span className="text-white/80">{spec.map.get(value) ?? `#${value}`}</span>;
      }
      if (spec.kind === "date") {
        return <span className="text-white/60">{formatDate(value as string | null | undefined)}</span>;
      }
      if (spec.kind === "datetime") {
        return <span className="text-white/60">{formatDateTime(value as string | null | undefined)}</span>;
      }
      if (spec.kind === "boolean") {
        return (
          <Tag color={value ? "success" : "default"}>
            {value ? spec.trueLabel ?? "Yes" : spec.falseLabel ?? "No"}
          </Tag>
        );
      }
      if (spec.kind === "tag") {
        const stringValue = String(value ?? "-");
        return <Tag color={spec.tagColors?.[stringValue] ?? "blue"}>{stringValue}</Tag>;
      }
      return <span className="text-white/80">{stringifyWorkspaceValue(value)}</span>;
    },
  }));
}

export function buildDynamicColumns(rows: Array<Record<string, unknown>>): ColumnsType<Record<string, unknown>> {
  const sample = rows[0];
  if (!sample) {
    return [{ title: "Data", key: "empty", render: () => <span className="text-white/50">No data</span> }];
  }

  return Object.keys(sample).map((key) => ({
    title: toTitleCase(key),
    dataIndex: key,
    key,
    render: (value: unknown) => <span className="text-white/75">{stringifyWorkspaceValue(value)}</span>,
  }));
}
