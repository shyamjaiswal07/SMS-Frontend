import {
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  NotificationOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Input, Space, Switch, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { formatDateTime, parseApiError } from "@/utils/platform";
import { communicationsApi } from "./communicationsApi";

type Channel = "IN_APP" | "EMAIL" | "SMS" | "PUSH";
type PreferenceRow = {
  channel: Channel;
  is_enabled: boolean;
  muted_until?: string | null;
};

type Props = {
  unreadByChannel?: Array<{ channel: string; total: number }>;
};

const channelMeta: Record<
  Channel,
  { label: string; description: string; icon: JSX.Element }
> = {
  IN_APP: {
    label: "In-App",
    description: "Receive alerts inside the workspace notification center.",
    icon: <BellOutlined className="text-[var(--cv-accent)]" />,
  },
  EMAIL: {
    label: "Email",
    description: "Send notices and reminders to your registered inbox.",
    icon: <MailOutlined className="text-[var(--cv-accent)]" />,
  },
  SMS: {
    label: "SMS",
    description: "Get time-sensitive updates as text messages.",
    icon: <MessageOutlined className="text-[var(--cv-accent)]" />,
  },
  PUSH: {
    label: "Push",
    description: "Use device or browser push notifications when supported.",
    icon: <NotificationOutlined className="text-[var(--cv-accent)]" />,
  },
};

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function NotificationPreferencesPanel({ unreadByChannel = [] }: Props) {
  const [preferences, setPreferences] = useState<PreferenceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const unreadMap = useMemo(
    () => new Map(unreadByChannel.map((item) => [item.channel, item.total])),
    [unreadByChannel],
  );

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await communicationsApi.loadMyPreferences();
      setPreferences((response as { preferences?: PreferenceRow[] }).preferences ?? []);
    } catch (error) {
      message.error(parseApiError(error, "Unable to load notification preferences"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPreferences();
  }, []);

  const updatePreference = (channel: Channel, updater: (current: PreferenceRow) => PreferenceRow) => {
    setPreferences((current) => current.map((row) => (row.channel === channel ? updater(row) : row)));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await communicationsApi.updateMyPreferences({
        preferences: preferences.map((row) => ({
          channel: row.channel,
          is_enabled: row.is_enabled,
          muted_until: row.muted_until ?? null,
        })),
      });
      message.success("Notification preferences updated");
      await loadPreferences();
    } catch (error) {
      message.error(parseApiError(error, "Unable to save notification preferences"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Typography.Title level={4} className="!mb-1 !text-white">
              Notification Preferences
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-white/60">
              Choose which channels stay active and temporarily mute noisy ones without losing your saved defaults.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => void loadPreferences()} loading={loading}>
              Refresh
            </Button>
            <Button
              type="primary"
              className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              onClick={() => void savePreferences()}
              loading={saving}
            >
              Save Preferences
            </Button>
          </Space>
        </div>
      </Card>

      {preferences.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {preferences.map((row) => {
            const meta = channelMeta[row.channel];
            const unread = unreadMap.get(row.channel) ?? 0;
            const isMuted = Boolean(row.muted_until && new Date(row.muted_until).getTime() > Date.now());

            return (
              <Card key={row.channel} className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-white font-medium">
                      {meta.icon}
                      {meta.label}
                    </div>
                    <div className="text-white/55 text-sm mt-2">{meta.description}</div>
                  </div>
                  <Tag color={unread ? "blue" : "default"}>{unread} unread</Tag>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <div className="text-white/75 font-medium">Channel Enabled</div>
                    <div className="text-white/45 text-xs mt-1">
                      {row.is_enabled ? "Notifications can be delivered" : "Delivery blocked"}
                    </div>
                  </div>
                  <Switch
                    checked={row.is_enabled}
                    onChange={(checked) =>
                      updatePreference(row.channel, (current) => ({
                        ...current,
                        is_enabled: checked,
                      }))
                    }
                  />
                </div>

                <div className="mt-4">
                  <div className="text-white/70 text-sm mb-2">Mute Until</div>
                  <Input
                    type="datetime-local"
                    value={toDatetimeLocal(row.muted_until)}
                    onChange={(event) =>
                      updatePreference(row.channel, (current) => ({
                        ...current,
                        muted_until: fromDatetimeLocal(event.target.value),
                      }))
                    }
                  />
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <Tag color={!row.is_enabled ? "default" : isMuted ? "orange" : "green"}>
                      {!row.is_enabled ? "Disabled" : isMuted ? "Muted" : "Active"}
                    </Tag>
                    <Button
                      size="small"
                      onClick={() =>
                        updatePreference(row.channel, (current) => ({
                          ...current,
                          muted_until: null,
                        }))
                      }
                    >
                      Clear mute
                    </Button>
                  </div>
                  <div className="text-white/45 text-xs mt-3">
                    {row.muted_until ? `Current mute window ends ${formatDateTime(row.muted_until)}` : "No mute window set."}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <Empty description={<span className="text-white/45">No preference channels returned yet.</span>} />
        </Card>
      )}
    </div>
  );
}
