import { Card } from "antd";
import { stringifyWorkspaceValue, toTitleCase } from "./workspaceUtils";

type Props = {
  summary?: Record<string, unknown> | null;
};

export default function WorkspaceSummaryGrid({ summary }: Props) {
  const entries = Object.entries(summary ?? {});

  if (!entries.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {entries.map(([key, value]) => (
        <Card key={key} className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white/55 text-xs uppercase tracking-wider">{toTitleCase(key)}</div>
          <div className="text-white font-medium mt-2">{stringifyWorkspaceValue(value)}</div>
        </Card>
      ))}
    </div>
  );
}
