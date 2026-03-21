import { Form, Input, Modal } from "antd";

export type RejectFormValues = { reason: string };

interface RejectApplicationModalProps {
  open: boolean;
  onCancel: () => void;
  onReject: (values: RejectFormValues) => Promise<void>;
  loading: boolean;
}

export function RejectApplicationModal({ open, onCancel, onReject, loading }: RejectApplicationModalProps) {
  const [form] = Form.useForm<RejectFormValues>();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onReject(values);
      form.resetFields();
    } catch {
      // Form validation failed
    }
  };

  return (
    <Modal
      title="Reject Application"
      open={open}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
      confirmLoading={loading}
    >
      <Form<RejectFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="reason"
          label="Reason"
          rules={[
            { required: true, message: "Rejection reason is required." },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Why is this application being rejected?"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
