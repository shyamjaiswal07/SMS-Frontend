import { ArrowRightOutlined, BulbOutlined, LockOutlined, SafetyOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Divider, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { parseApiError } from "@/utils/platform";

type LoginValues = {
  schoolCode?: string;
  email: string;
  password: string;
  twoFactorCode?: string;
  remember: boolean;
};

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--cv-bg)] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[var(--cv-accent)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#1d4ed8]/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-3xl border border-white/10 overflow-hidden bg-[var(--cv-card)] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="p-8 sm:p-10 bg-gradient-to-br from-[#081a2f] via-[var(--cv-bg)] to-[#0f172a] relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(29,78,216,0.18),transparent_55%)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 grid place-items-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--cv-accent)]" />
                    </div>
                    <div>
                      <div className="text-white/90 font-semibold tracking-wide text-lg leading-tight">Cognivoult</div>
                      <div className="text-xs text-white/55">School OS + AI</div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
                    <SafetyOutlined className="text-white/70" />
                    Secure workspace
                  </div>
                </div>

                <Typography.Title level={2} className="!mb-2 !mt-8 !text-white leading-tight">
                  Run your school on
                  <br />
                  <span className="text-[var(--cv-accent)]">one smart dashboard</span>
                </Typography.Title>
                <Typography.Paragraph className="!mb-0 !text-white/70 max-w-xl">
                  Attendance, fees, academics, staff, transport, and reports, plus stronger tenant-aware security and
                  identity controls.
                </Typography.Paragraph>

                <div className="mt-8 grid sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition">
                    <div className="flex items-center gap-2 text-white/90 font-medium">
                      <BulbOutlined className="text-[var(--cv-accent)]" />
                      Security-Aware UX
                    </div>
                    <div className="text-white/60 text-sm mt-1">Tenant code, audit-ready login, password reset, and optional 2FA.</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition">
                    <div className="flex items-center gap-2 text-white/90 font-medium">
                      <ThunderboltOutlined className="text-[var(--cv-accent)]" />
                      Instant Reports
                    </div>
                    <div className="text-white/60 text-sm mt-1">Operational dashboards and exports in a few clicks.</div>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <Button
                    type="default"
                    className="!h-11 !px-5 !rounded-2xl !border-white/15 !bg-white/5 !text-white hover:!bg-white/10"
                    onClick={() => navigate("/register")}
                  >
                    Create school account <ArrowRightOutlined />
                  </Button>
                  <Button
                    type="link"
                    className="!h-11 !px-2 !text-white/70 hover:!text-white"
                    onClick={() => message.info("Use school code when you belong to more than one tenant or need to override the default tenant context.")}
                  >
                    Tenant login help
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Card className="w-full rounded-3xl border border-white/10 !bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="px-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Typography.Title level={3} className="!mb-1 !text-white">
                    Welcome back
                  </Typography.Title>
                  <Typography.Paragraph className="!mb-0 !text-white/60">
                    Sign in with tenant context and optional second-factor code if your account requires it.
                  </Typography.Paragraph>
                </div>
                <div className="hidden sm:block text-xs text-white/55">
                  Tip: tenant code like <span className="text-white/80">ALPHA</span>
                </div>
              </div>
            </div>

            <Form<LoginValues>
              layout="vertical"
              requiredMark={false}
              className="mt-6"
              initialValues={{ schoolCode: "", remember: true, twoFactorCode: "" }}
              onFinish={async (values) => {
                try {
                  const data = await api.login(values.email, values.password, values.schoolCode, values.twoFactorCode);

                  if (data?.access) sessionStorage.setItem("accessToken", data.access);
                  if (data?.refresh) sessionStorage.setItem("refreshToken", data.refresh);
                  if (data?.tenant) sessionStorage.setItem("tenant", JSON.stringify(data.tenant));
                  if (data?.tenant?.code) {
                    sessionStorage.setItem("tenantCode", data.tenant.code);
                  } else if (values.schoolCode) {
                    sessionStorage.setItem("tenantCode", values.schoolCode);
                  }

                  message.success("Welcome back");
                  navigate("/dashboard", { replace: true });
                } catch (error) {
                  message.error(parseApiError(error, "Login failed"));
                }
              }}
            >
              <Form.Item name="schoolCode" label={<span className="text-white/80">School Code</span>}>
                <Input
                  placeholder="Optional, e.g. ALPHA"
                  autoComplete="organization"
                  className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="text-white/80">Email</span>}
                rules={[
                  { required: true, message: "Enter your email" },
                  { type: "email", message: "Enter a valid email" },
                ]}
              >
                <Input
                  placeholder="you@school.com"
                  autoComplete="username"
                  className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="text-white/80">Password</span>}
                rules={[{ required: true, message: "Enter your password" }]}
              >
                <Input.Password
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
                />
              </Form.Item>

              <Form.Item name="twoFactorCode" label={<span className="text-white/80">2FA Code</span>}>
                <Input
                  prefix={<LockOutlined className="text-white/40" />}
                  placeholder="Only required if 2FA is enabled"
                  autoComplete="one-time-code"
                  className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
                />
              </Form.Item>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                If your account is enrolled in 2FA, the backend requires `two_factor_code` during login. You can manage
                enrollment after sign-in.
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Form.Item name="remember" valuePropName="checked" className="!mb-0">
                  <Checkbox className="!text-white/70">Remember me</Checkbox>
                </Form.Item>
                <Button type="link" className="px-0" onClick={() => navigate("/forgot-password")}>
                  Forgot password?
                </Button>
              </div>

              <Button
                htmlType="submit"
                type="primary"
                className="w-full mt-5 !h-11 !rounded-2xl !bg-[var(--cv-accent)] hover:!bg-[#fb7d2b]"
              >
                Continue <ArrowRightOutlined />
              </Button>

              <Divider className="!border-white/10 !my-6" />

              <div className="flex items-center justify-between gap-3 text-xs text-white/50">
                <div>Authentication attempts, refresh events, and 2FA challenges are recorded for audit visibility.</div>
                <Button type="link" className="px-0 text-[var(--cv-accent)]" onClick={() => navigate("/forgot-password")}>
                  Reset access
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
