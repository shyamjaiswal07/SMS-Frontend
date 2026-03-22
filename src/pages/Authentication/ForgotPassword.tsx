import { ArrowLeftOutlined, MailOutlined, SafetyOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/features/auth/authApi";
import { parseApiError } from "@/utils/platform";

type Values = {
  email: string;
  schoolCode?: string;
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cv-bg)] p-4">
      <Card className="w-full max-w-xl rounded-3xl border border-white/10 !bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <Typography.Title level={3} className="!mb-1 !text-white">
          Forgot password
        </Typography.Title>
        <Typography.Paragraph className="!mb-6 !text-white/60">
          Request a one-time reset link. The response stays generic for security, but successful resets invalidate older
          sessions.
        </Typography.Paragraph>

        {submitted ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <SafetyOutlined />
                Request received
              </div>
              <div className="mt-2 text-sm text-white/70">
                If an active account exists for that email, password reset instructions have been sent.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Use the reset link from the email. If you need to test manually, open the frontend reset route with
              `uid` and `token` query parameters.
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="link" className="px-0" onClick={() => setSubmitted(false)}>
                Submit another request
              </Button>
              <Button type="primary" className="!rounded-2xl !bg-[var(--cv-accent)] !border-0" onClick={() => navigate("/login")}>
                Back to login
              </Button>
            </div>
          </div>
        ) : (
          <Form<Values>
            layout="vertical"
            requiredMark={false}
            onFinish={async ({ email, schoolCode }) => {
              setSubmitting(true);
              try {
                await authApi.passwordReset.request({ email, tenant_code: schoolCode || "" });
                setSubmitted(true);
              } catch (error) {
                message.error(parseApiError(error, "Request failed"));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Form.Item name="schoolCode" label={<span className="text-white/80">School Code</span>}>
              <Input
                placeholder="Optional tenant override, e.g. ALPHA"
                className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span className="text-white/80">Email</span>}
              rules={[{ required: true }, { type: "email", message: "Enter a valid email" }]}
            >
              <Input
                prefix={<MailOutlined className="text-white/40" />}
                placeholder="you@example.com"
                className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
              />
            </Form.Item>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Tenant-aware reset UX: if you belong to multiple schools, include the school code so the email context is
              scoped correctly.
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Button type="link" className="px-0" onClick={() => navigate("/login")}>
                <ArrowLeftOutlined /> Back to login
              </Button>
              <Button
                htmlType="submit"
                type="primary"
                loading={submitting}
                className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              >
                Send reset link
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}
