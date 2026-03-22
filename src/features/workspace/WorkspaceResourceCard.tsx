import { PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Form, Modal, Row, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { parseApiError } from "@/utils/platform";
import { cleanPayload, renderWorkspaceField } from "./workspaceUtils";
import type { WorkspaceFieldConfig, WorkspaceOption } from "./workspaceTypes";

type Props<T extends { id?: string | number }> = {
  title: string;
  description: string;
  endpoint: string;
  rows: T[];
  loading?: boolean;
  columns: ColumnsType<T>;
  optionMap?: Record<string, WorkspaceOption[]>;
  createTitle?: string;
  createButtonLabel?: string;
  createFields?: WorkspaceFieldConfig[];
  createInitialValues?: Record<string, unknown>;
  createSuccessMessage?: string;
  createFailureMessage?: string;
  canCreate?: boolean;
  onCreate?: (payload: Record<string, unknown>) => Promise<void>;
  transformCreateValues?: (payload: Record<string, unknown>) => Record<string, unknown>;
};

export default function WorkspaceResourceCard<T extends { id?: string | number }>({
  title,
  description,
  endpoint,
  rows,
  loading = false,
  columns,
  optionMap = {},
  createTitle,
  createButtonLabel = "Create",
  createFields,
  createInitialValues,
  createSuccessMessage,
  createFailureMessage,
  canCreate = true,
  onCreate,
  transformCreateValues,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<Record<string, unknown>>();

  const modalTitle = createTitle ?? `Create ${title}`;
  const supportsCreate = !!createFields?.length && !!onCreate && canCreate;
  const hasData = rows.length > 0;

  const initialValues = useMemo(() => createInitialValues ?? {}, [createInitialValues]);

  return (
    <>
      <Card className="!bg-[var(--cv-card)] !border-white/10 !rounded-3xl h-full">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <Typography.Title level={4} className="!mb-1 !text-white">
              {title}
            </Typography.Title>
            <Typography.Paragraph className="!mb-1 !text-white/60">
              {description}
            </Typography.Paragraph>
            <div className="text-white/35 text-xs">{endpoint}</div>
          </div>
          {supportsCreate ? (
            <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              {createButtonLabel}
            </Button>
          ) : null}
        </div>

        {hasData ? (
          <Table<T>
            rowKey={(row) => String(row.id ?? JSON.stringify(row))}
            loading={loading}
            dataSource={rows}
            columns={columns}
            pagination={{ pageSize: 6 }}
            scroll={{ x: true }}
          />
        ) : loading ? (
          <Table<T>
            rowKey={(row) => String(row.id ?? JSON.stringify(row))}
            loading
            dataSource={[]}
            columns={columns}
            pagination={false}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 py-8">
            <Empty description={<span className="text-white/50">No records yet</span>} />
          </div>
        )}
      </Card>

      {supportsCreate ? (
        <Modal
          title={modalTitle}
          open={open}
          onCancel={() => setOpen(false)}
          confirmLoading={submitting}
          onOk={() => {
            void form.validateFields().then(async (values) => {
              if (!onCreate) return;
              setSubmitting(true);
              try {
                const cleaned = cleanPayload(values);
                const payload = transformCreateValues ? transformCreateValues(cleaned) : cleaned;
                await onCreate(payload);
                message.success(createSuccessMessage ?? `${title} created`);
                form.resetFields();
                form.setFieldsValue(initialValues as any);
                setOpen(false);
              } catch (error) {
                const detail =
                  error instanceof SyntaxError
                    ? "Please enter valid JSON for the JSON fields."
                    : parseApiError(error, createFailureMessage ?? `Unable to create ${title.toLowerCase()}`);
                message.error(detail);
              } finally {
                setSubmitting(false);
              }
            });
          }}
          width={760}
        >
          <Form<Record<string, unknown>> form={form} layout="vertical" requiredMark={false} initialValues={initialValues}>
            <Row gutter={12}>
              {createFields?.map((field) => (
                <Col span={field.colSpan ?? (field.type === "textarea" || field.type === "json" ? 24 : 12)} key={field.name}>
                  <Form.Item
                    name={field.name}
                    label={field.label}
                    rules={field.required ? [{ required: true, message: `${field.label} is required` }] : undefined}
                    valuePropName={field.type === "switch" ? "checked" : "value"}
                  >
                    {renderWorkspaceField(field, field.optionsKey ? (optionMap[field.optionsKey] ?? []) : [])}
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Form>
        </Modal>
      ) : null}
    </>
  );
}
