import { ReloadOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  onRefresh?: () => void;
};

export default function WorkspacePageHeader({ title, description, loading = false, onRefresh }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <Typography.Title level={3} className="!mb-0 text-white">
          {title}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 !text-white/60">
          {description}
        </Typography.Paragraph>
      </div>
      {onRefresh ? (
        <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
          Refresh
        </Button>
      ) : null}
    </div>
  );
}
