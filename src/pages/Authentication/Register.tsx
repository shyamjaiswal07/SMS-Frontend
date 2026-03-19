import { Button, Card, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";

type RegisterValues = {
  username: string;
  email: string;
  password: string;
};

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <Typography.Title level={3} className="!mb-1">
          Register
        </Typography.Title>
        <Typography.Paragraph className="!mb-6 text-slate-600">
          Create a new account.
        </Typography.Paragraph>

        <Form<RegisterValues>
          layout="vertical"
          onFinish={async (values) => {
            try {
              await api.register(values.username, values.email, values.password);
              message.success("Registered successfully");
              navigate("/login", { replace: true });
            } catch (e: any) {
              message.error(e?.response?.data?.detail ?? "Registration failed");
            }
          }}
        >
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Choose a username" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true }, { type: "email", message: "Enter a valid email" }]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="Create a password" />
          </Form.Item>

          <div className="flex items-center justify-between gap-3">
            <Button type="link" className="px-0" onClick={() => navigate("/login")}>
              Back to login
            </Button>
          </div>

          <Button htmlType="submit" type="primary" className="w-full mt-2">
            Create account
          </Button>
        </Form>
      </Card>
    </div>
  );
}

