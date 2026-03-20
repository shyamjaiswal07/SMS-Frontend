import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PasswordRequirementList from "@/features/auth/PasswordRequirementList";
import { api } from "@/services/api";
import { parseApiError } from "@/utils/platform";

type RegisterValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<RegisterValues>();
  const password = Form.useWatch("password", form) ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cv-bg)] p-4">
      <Card className="w-full max-w-xl rounded-3xl border border-white/10 !bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <Typography.Title level={3} className="!mb-1 !text-white">
          Register
        </Typography.Title>
        <Typography.Paragraph className="!mb-6 !text-white/60">
          Create a new account. Strong password guidance is shown here to match reset and change-password experiences.
        </Typography.Paragraph>

        <Form<RegisterValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={async (values) => {
            setSubmitting(true);
            try {
              await api.register(values.username, values.email, values.password);
              message.success("Registered successfully");
              navigate("/login", { replace: true });
            } catch (error) {
              message.error(parseApiError(error, "Registration failed"));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="username" label={<span className="text-white/80">Username</span>} rules={[{ required: true }]}>
            <Input className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40" placeholder="Choose a username" />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span className="text-white/80">Email</span>}
            rules={[{ required: true }, { type: "email", message: "Enter a valid email" }]}
          >
            <Input className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40" placeholder="you@example.com" />
          </Form.Item>

          <Form.Item name="password" label={<span className="text-white/80">Password</span>} rules={[{ required: true }]}>
            <Input.Password
              className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
          </Form.Item>

          <PasswordRequirementList password={password} compact />

          <Form.Item
            name="confirmPassword"
            label={<span className="text-white/80">Confirm Password</span>}
            dependencies={["password"]}
            rules={[
              { required: true, message: "Confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
            className="!mt-4"
          >
            <Input.Password
              className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </Form.Item>

          <div className="flex items-center justify-between gap-3">
            <Button type="link" className="px-0" onClick={() => navigate("/login")}>
              <ArrowLeftOutlined /> Back to login
            </Button>
          </div>

          <Button htmlType="submit" type="primary" loading={submitting} className="w-full mt-2 !rounded-2xl !bg-[var(--cv-accent)] !border-0">
            Create account
          </Button>
        </Form>
      </Card>
    </div>
  );
}
