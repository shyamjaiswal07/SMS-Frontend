import { PlayCircleOutlined, SettingOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, InputNumber, Row, Space, Statistic, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { operationsApi } from "@/features/operations/operationsApi";
import { currentTenant, parseApiError, rowsOf } from "@/utils/platform";

type WorkerHealth = {
  status?: string;
  task_always_eager?: boolean;
  workers_online?: number;
  workers?: string[];
  unresolved_failures?: number;
};

type ReadinessWarning = {
  key: string;
  title: string;
  detail: string;
  actionLabel: string;
  actionPath: string;
};

type AutomationSettingsForm = {
  payment_reminder_days_before: number;
  attendance_alert_threshold_pct: number;
  attendance_alert_min_records: number;
  attendance_alert_window_days: number;
  transport_notify_before_days: number;
  library_late_fee_per_day: number;
  library_late_fee_grace_days: number;
  library_late_fee_max_amount: number;
};

const defaultValues: AutomationSettingsForm = {
  payment_reminder_days_before: 3,
  attendance_alert_threshold_pct: 75,
  attendance_alert_min_records: 5,
  attendance_alert_window_days: 30,
  transport_notify_before_days: 1,
  library_late_fee_per_day: 5,
  library_late_fee_grace_days: 0,
  library_late_fee_max_amount: 100,
};

export default function AutomationCenter() {
  const navigate = useNavigate();
  const tenant = currentTenant();
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [readinessCounts, setReadinessCounts] = useState({
    academicYears: 0,
    terms: 0,
    feeCategories: 0,
    feeStructures: 0,
    notificationTemplates: 0,
  });
  const [loading, setLoading] = useState(false);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [form] = Form.useForm<AutomationSettingsForm>();

  const loadAll = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const {
        healthData,
        schoolData,
        academicYearData,
        termData,
        feeCategoryData,
        feeStructureData,
        notificationTemplateData,
      } = await operationsApi.automation.load(tenant.id);

      setHealth(healthData as WorkerHealth);
      setReadinessCounts({
        academicYears: rowsOf(academicYearData).length,
        terms: rowsOf(termData).length,
        feeCategories: rowsOf(feeCategoryData).length,
        feeStructures: rowsOf(feeStructureData).length,
        notificationTemplates: rowsOf(notificationTemplateData).length,
      });
      const settings = ((schoolData as { settings_json?: Record<string, number> }).settings_json) ?? {};
      form.setFieldsValue({
        payment_reminder_days_before: Number(settings.payment_reminder_days_before ?? defaultValues.payment_reminder_days_before),
        attendance_alert_threshold_pct: Number(settings.attendance_alert_threshold_pct ?? defaultValues.attendance_alert_threshold_pct),
        attendance_alert_min_records: Number(settings.attendance_alert_min_records ?? defaultValues.attendance_alert_min_records),
        attendance_alert_window_days: Number(settings.attendance_alert_window_days ?? defaultValues.attendance_alert_window_days),
        transport_notify_before_days: Number(settings.transport_notify_before_days ?? defaultValues.transport_notify_before_days),
        library_late_fee_per_day: Number(settings.library_late_fee_per_day ?? defaultValues.library_late_fee_per_day),
        library_late_fee_grace_days: Number(settings.library_late_fee_grace_days ?? defaultValues.library_late_fee_grace_days),
        library_late_fee_max_amount: Number(settings.library_late_fee_max_amount ?? defaultValues.library_late_fee_max_amount),
      });
    } catch (error) {
      message.error(parseApiError(error, "Failed to load automation settings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const readinessWarnings = useMemo<ReadinessWarning[]>(() => {
    const warnings: ReadinessWarning[] = [];

    if (readinessCounts.academicYears === 0) {
      warnings.push({
        key: "academic-years",
        title: "Academic year setup is missing",
        detail: "Create at least one academic year so fee automation, admissions, and portal timelines have a calendar anchor.",
        actionLabel: "Open Academic Setup",
        actionPath: "/institutions?tab=academics",
      });
    }

    if (readinessCounts.academicYears > 0 && readinessCounts.terms === 0) {
      warnings.push({
        key: "terms",
        title: "Terms are not configured",
        detail: "Your academic year exists, but no terms are available for fee cycles, scheduling, or report generation.",
        actionLabel: "Configure Terms",
        actionPath: "/institutions?tab=academics",
      });
    }

    if (readinessCounts.feeCategories === 0) {
      warnings.push({
        key: "fee-categories",
        title: "Fee categories are missing",
        detail: "Add billing heads before finance teams can structure recurring and term-based charges.",
        actionLabel: "Open Finance Setup",
        actionPath: "/finance",
      });
    }

    if (readinessCounts.feeStructures === 0) {
      warnings.push({
        key: "fee-structures",
        title: "Fee structures are not ready",
        detail: "Automated invoice generation cannot run until each grade has a fee structure for the active year.",
        actionLabel: "Review Finance Workspace",
        actionPath: "/finance",
      });
    }

    if (readinessCounts.notificationTemplates === 0) {
      warnings.push({
        key: "notification-templates",
        title: "Notification templates are empty",
        detail: "Alerts can still send, but reusable fee and attendance templates are not configured yet.",
        actionLabel: "Open Communications",
        actionPath: "/communications?tab=notifications",
      });
    }

    return warnings;
  }, [readinessCounts]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Typography.Title level={4} className="!mb-0 !text-white">
            Automation Center
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-white/60">
            Sprint 2 admin controls for worker health, reminder thresholds, and manual job triggers.
          </Typography.Paragraph>
        </div>
        <Button onClick={() => void loadAll()} loading={loading}>
          Refresh
        </Button>
      </div>

      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Typography.Title level={5} className="!mb-1 !text-white">
              Sprint 14 Readiness Warnings
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-white/60">
              Actionable frontend alerts for the backend automation features that depend on tenant configuration.
            </Typography.Paragraph>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            Academic years: <span className="text-white/85">{readinessCounts.academicYears}</span>
            <br />
            Fee structures: <span className="text-white/85">{readinessCounts.feeStructures}</span>
          </div>
        </div>

        {readinessWarnings.length ? (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {readinessWarnings.map((warning) => (
              <div key={warning.key} className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
                <div className="text-white font-medium">{warning.title}</div>
                <div className="mt-2 text-sm text-white/70">{warning.detail}</div>
                <Button className="!mt-4 !rounded-2xl" onClick={() => navigate(warning.actionPath)}>
                  {warning.actionLabel}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-white/80">
            Core automation prerequisites look healthy for this tenant. You can keep tuning thresholds or run jobs manually below.
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Worker Status</span>} value={health?.status?.toUpperCase() ?? "UNKNOWN"} valueStyle={{ color: "#e5e7eb", fontSize: 28 }} prefix={<ThunderboltOutlined className="text-[var(--cv-accent)]" />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Workers Online</span>} value={health?.workers_online ?? 0} valueStyle={{ color: "#e5e7eb" }} prefix={<PlayCircleOutlined className="text-[var(--cv-accent)]" />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
            <Statistic title={<span className="text-white/60">Unresolved Failures</span>} value={health?.unresolved_failures ?? 0} valueStyle={{ color: "#e5e7eb" }} prefix={<SettingOutlined className="text-[var(--cv-accent)]" />} />
          </Card>
        </Col>
      </Row>

      <div className="grid gap-4 xl:grid-cols-[1fr,0.9fr]">
        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-1">Tenant Automation Settings</div>
          <div className="text-white/55 text-sm mb-4">Values are persisted into `School.settings_json` for the active tenant.</div>

          <Form<AutomationSettingsForm>
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={async (values) => {
              if (!tenant?.id) return;
              try {
                await operationsApi.automation.updateSettings(tenant.id, values);
                message.success("Automation settings updated");
                await loadAll();
              } catch (error) {
                message.error(parseApiError(error, "Failed to save automation settings"));
              }
            }}
          >
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item name="payment_reminder_days_before" label="Payment Reminder Days" rules={[{ required: true }]}>
                  <InputNumber className="!w-full" min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="attendance_alert_threshold_pct" label="Attendance Threshold %" rules={[{ required: true }]}>
                  <InputNumber className="!w-full" min={1} max={100} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item name="attendance_alert_min_records" label="Min Attendance Records" rules={[{ required: true }]}>
                  <InputNumber className="!w-full" min={1} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="attendance_alert_window_days" label="Attendance Window Days" rules={[{ required: true }]}>
                  <InputNumber className="!w-full" min={1} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="transport_notify_before_days" label="Transport Notify Before Days" rules={[{ required: true }]}>
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item name="library_late_fee_per_day" label="Library Late Fee / Day" rules={[{ required: true }]}>
                  <InputNumber className="!w-full" min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="library_late_fee_grace_days" label="Library Grace Days" rules={[{ required: true }]}>
                  <InputNumber className="!w-full" min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="library_late_fee_max_amount" label="Library Max Late Fee" rules={[{ required: true }]}>
                  <InputNumber className="!w-full" min={0} />
                </Form.Item>
              </Col>
            </Row>

            <Button htmlType="submit" type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0">
              Save Settings
            </Button>
          </Form>
        </Card>

        <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl">
          <div className="text-white font-medium mb-1">Manual Automation Runs</div>
          <div className="text-white/55 text-sm mb-4">Use these controls to validate payment reminders, attendance alerts, transport notifications, bulk campaigns, and library late fees immediately.</div>

          <Space direction="vertical" className="!w-full">
            {[
              { label: "Run Payment Reminders", taskType: "PAYMENT_REMINDERS" },
              { label: "Run Attendance Alerts", taskType: "ATTENDANCE_ALERTS" },
              { label: "Run Transport Notifications", taskType: "TRANSPORT_NOTIFICATIONS" },
              { label: "Run Bulk Campaigns", taskType: "BULK_CAMPAIGNS" },
              { label: "Run Library Late Fees", taskType: "LIBRARY_LATE_FEES" },
            ].map((item) => (
              <Button
                key={item.taskType}
                className="!rounded-2xl !h-11 !text-left"
                block
                loading={runningTask === item.taskType}
                onClick={async () => {
                  setRunningTask(item.taskType);
                  try {
                    const response = await operationsApi.automation.runTask(item.taskType);
                    message.success(`Queued ${item.taskType} (${(response as { task_id?: string }).task_id})`);
                  } catch (error) {
                    message.error(parseApiError(error, `Unable to queue ${item.taskType}`));
                  } finally {
                    setRunningTask(null);
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Space>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            Worker mode: <span className="text-white/80">{health?.task_always_eager ? "eager/local" : "queue-backed"}</span>
            <br />
            Visible workers: <span className="text-white/80">{health?.workers?.join(", ") || "-"}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
