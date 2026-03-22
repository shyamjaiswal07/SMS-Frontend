import { ArrowLeftOutlined, LockOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/features/auth/authApi";
import PasswordRequirementList from "@/features/auth/PasswordRequirementList";
import { parseApiError } from "@/utils/platform";

type ResetValues = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ResetValues>();
  const password = Form.useWatch("newPassword", form) ?? "";

  const uid = useMemo(() => params.get("uid") ?? "", [params]);
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const hasResetContext = Boolean(uid && token);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cv-bg)] p-4">
      <Card className="w-full max-w-xl rounded-3xl border border-white/10 !bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <Typography.Title level={3} className="!mb-1 !text-white">
          Reset password
        </Typography.Title>
        <Typography.Paragraph className="!mb-6 !text-white/60">
          Set a new strong password. This reset token is single-use and old sessions become invalid after success.
        </Typography.Paragraph>

        {!hasResetContext ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              Reset link details are missing. Open this page from the email link or include `uid` and `token` in the URL.
            </div>
            <Button type="link" className="px-0" onClick={() => navigate("/forgot-password")}>
              <ArrowLeftOutlined /> Back to forgot password
            </Button>
          </div>
        ) : (
          <Form<ResetValues>
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={async (values) => {
              setSubmitting(true);
              try {
                await authApi.passwordReset.confirm({
                  uid,
                  token,
                  new_password: values.newPassword,
                });
                message.success("Password reset successful. Please sign in with your new password.");
                navigate("/login", { replace: true });
              } catch (error) {
                message.error(parseApiError(error, "Unable to reset password"));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Form.Item
              name="newPassword"
              label={<span className="text-white/80">New Password</span>}
              rules={[{ required: true, message: "Enter a new password" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-white/40" />}
                autoComplete="new-password"
                placeholder="Create a strong password"
                className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
              />
            </Form.Item>

            <PasswordRequirementList password={password} />

            <Form.Item
              name="confirmPassword"
              label={<span className="text-white/80">Confirm Password</span>}
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Confirm your new password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
              className="!mt-4"
            >
              <Input.Password
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
              />
            </Form.Item>

            <div className="flex items-center justify-between gap-3">
              <Button type="link" className="px-0" onClick={() => navigate("/login")}>
                <ArrowLeftOutlined /> Back to login
              </Button>
              <Button
                htmlType="submit"
                type="primary"
                loading={submitting}
                className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
              >
                Reset Password
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}
