import {
  Button,
  Card,
  Checkbox,
  Divider,
  Form,
  Input,
  Segmented,
  Typography,
  message,
} from "antd";
import {
  ArrowRightOutlined,
  BulbOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";

type LoginValues = {
  schoolCode: string;
  email: string;
  password: string;
  role: "Admin" | "Teacher" | "Staff";
  remember: boolean;
};

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--cv-bg)] relative overflow-hidden">
      {/* background glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[var(--cv-accent)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#1d4ed8]/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Hero */}
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
                      <div className="text-white/90 font-semibold tracking-wide text-lg leading-tight">
                        Cognivoult
                      </div>
                      <div className="text-xs text-white/55">
                        School OS + AI
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
                    <SafetyOutlined className="text-white/70" />
                    Secure workspace
                  </div>
                </div>

                <Typography.Title
                  level={2}
                  className="!mb-2 !mt-8 !text-white leading-tight"
                >
                  Run your school on
                  <br />
                  <span className="text-[var(--cv-accent)]">
                    one smart dashboard
                  </span>
                </Typography.Title>
                <Typography.Paragraph className="!mb-0 !text-white/70 max-w-xl">
                  Attendance, fees, academics, staff, transport, and reports —
                  plus an AI assistant for quick answers, summaries, and
                  automation.
                </Typography.Paragraph>

                <div className="mt-8 grid sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition">
                    <div className="flex items-center gap-2 text-white/90 font-medium">
                      <BulbOutlined className="text-[var(--cv-accent)]" />
                      AI Assistant
                    </div>
                    <div className="text-white/60 text-sm mt-1">
                      Ask:{" "}
                      <span className="text-white/75">
                        “Who’s absent today?”
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition">
                    <div className="flex items-center gap-2 text-white/90 font-medium">
                      <ThunderboltOutlined className="text-[var(--cv-accent)]" />
                      Instant Reports
                    </div>
                    <div className="text-white/60 text-sm mt-1">
                      Weekly insights in seconds.
                    </div>
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
                    onClick={() =>
                      message.info(
                        "After login you can chat with AI about attendance, fees, and reports.",
                      )
                    }
                  >
                    See AI examples
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="w-full rounded-3xl border border-white/10 !bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="px-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Typography.Title level={3} className="!mb-1 !text-white">
                    Welcome back
                  </Typography.Title>
                  <Typography.Paragraph className="!mb-0 !text-white/60">
                    Sign in to manage your school with AI assistance.
                  </Typography.Paragraph>
                </div>
                {/* <div className="hidden sm:block text-xs text-white/55">
                  Tip: school code like <span className="text-white/80">GREENVALLEY</span>
                </div> */}
              </div>
            </div>

            <Form<LoginValues>
              layout="vertical"
              requiredMark={false}
              className="mt-6"
              initialValues={{ schoolCode: "", role: "Admin", remember: true }}
              onFinish={async (values) => {
                try {
                  const data = await api.login(
                    values.email,
                    values.password,
                    values.schoolCode,
                  );

                  if (data?.access)
                    sessionStorage.setItem("accessToken", data.access);
                  if (data?.refresh)
                    sessionStorage.setItem("refreshToken", data.refresh);
                  if (data?.tenant)
                    sessionStorage.setItem(
                      "tenant",
                      JSON.stringify(data.tenant),
                    );
                  // Prefer backend-selected tenant code, fallback to user-entered schoolCode.
                  if (data?.tenant?.code) {
                    sessionStorage.setItem("tenantCode", data.tenant.code);
                  } else if (values.schoolCode) {
                    sessionStorage.setItem("tenantCode", values.schoolCode);
                  }

                  message.success("Welcome back");
                  navigate("/dashboard", { replace: true });
                } catch (e: any) {
                  message.error(e?.response?.data?.detail ?? "Login failed");
                }
              }}
            >
              {/* <Form.Item name="role" label={<span className="text-white/80">Sign in as</span>}>
              <Segmented
                options={["Admin", "Teacher", "Staff"]}
                className="w-full"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  padding: 4,
                }}
              />
            </Form.Item> */}

              {/* <Form.Item
              name="schoolCode"
              label={<span className="text-white/80">School code</span>}
              rules={[{ required: true, message: "Enter your school code" }]}
            >
              <Input
                placeholder="e.g. GREENVALLEY"
                className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/40"
              />
            </Form.Item> */}

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

              <div className="flex items-center justify-between gap-3">
                <Form.Item
                  name="remember"
                  valuePropName="checked"
                  className="!mb-0"
                >
                  <Checkbox className="!text-white/70">Remember me</Checkbox>
                </Form.Item>
                <Button
                  type="link"
                  className="px-0"
                  onClick={() => navigate("/forgot-password")}
                >
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
                <div>
                  By continuing you agree to your school’s acceptable use
                  policy.
                </div>
                <Button
                  type="link"
                  className="px-0 text-[var(--cv-accent)]"
                  onClick={() =>
                    message.info("AI features are enabled after login.")
                  }
                >
                  What can AI do?
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
