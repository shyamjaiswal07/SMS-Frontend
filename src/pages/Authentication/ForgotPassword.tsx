import { Button, Card, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";

type Values = {
  email: string;
};

export default function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cv-bg)] p-4">
      <Card className="w-full max-w-md rounded-3xl border border-white/10 !bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <Typography.Title level={3} className="!mb-1 !text-white">
          Forgot password
        </Typography.Title>
        <Typography.Paragraph className="!mb-6 !text-white/60">
          This feature is not enabled yet. Enter your email and we’ll guide you to login.
        </Typography.Paragraph>

        <Form<Values>
          layout="vertical"
          onFinish={async ({ email }) => {
            try {
              if (email) {
                message.success("Email received. Password reset will be available soon.");
              }
              navigate("/login");
            } catch (e: any) {
              message.error(e?.response?.data?.detail ?? "Request failed");
            }
          }}
        >
          <Form.Item
            name="email"
            label={<span className="text-white/80">Email</span>}
            rules={[{ required: true }, { type: "email", message: "Enter a valid email" }]}
          >
            <Input placeholder="you@example.com" className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40" />
          </Form.Item>

          <div className="flex items-center justify-between gap-3">
            <Button type="link" className="px-0" onClick={() => navigate("/login")}>
              Back to login
            </Button>
          </div>

          <Button htmlType="submit" type="primary" className="w-full mt-2 !rounded-2xl !bg-[var(--cv-accent)] hover:!bg-[#fb7d2b]">
            Continue
          </Button>
        </Form>
      </Card>
    </div>
  );
}

