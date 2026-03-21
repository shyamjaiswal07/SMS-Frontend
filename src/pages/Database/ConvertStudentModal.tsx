import { Form, Input, Modal } from "antd";

export type ConvertFormValues = { student_id?: string; admission_number?: string };

interface ConvertStudentModalProps {
  open: boolean;
  onCancel: () => void;
  onConvert: (values: ConvertFormValues) => Promise<void>;
  loading: boolean;
}

export function ConvertStudentModal({ open, onCancel, onConvert, loading }: ConvertStudentModalProps) {
  const [form] = Form.useForm<ConvertFormValues>();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onConvert(values);
      form.resetFields();
    } catch {
      // Form validation failed
    }
  };

  return (
    <Modal
      title="Convert To Student"
      open={open}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
      confirmLoading={loading}
    >
      <div className="mb-4 text-white/60 text-sm">
        Leave both fields blank to use the tenant’s auto-generated student and
        admission numbers.
      </div>
      <Form<ConvertFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item name="student_id" label="Student ID Override">
          <Input placeholder="Optional manual student ID" />
        </Form.Item>
        <Form.Item name="admission_number" label="Admission Number Override">
          <Input placeholder="Optional admission number" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
