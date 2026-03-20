import { CheckCircleOutlined, ExclamationCircleOutlined, SafetyOutlined } from "@ant-design/icons";
import { Progress, Typography } from "antd";

const requirements = [
  { label: "At least 10 characters", test: (value: string) => value.length >= 10 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
  { label: "One special character", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export function passwordStrengthScore(password: string) {
  return requirements.filter((item) => item.test(password)).length;
}

export function passwordStrengthLabel(password: string) {
  const score = passwordStrengthScore(password);
  if (score >= 5) return "Strong";
  if (score >= 3) return "Good";
  if (score >= 1) return "Weak";
  return "Not started";
}

type Props = {
  password: string;
  compact?: boolean;
};

export default function PasswordRequirementList({ password, compact = false }: Props) {
  const score = passwordStrengthScore(password);
  const percent = Math.round((score / requirements.length) * 100);
  const label = passwordStrengthLabel(password);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white/80">
          <SafetyOutlined className="text-[var(--cv-accent)]" />
          <span className="font-medium">Password policy</span>
        </div>
        <span className="text-xs text-white/50">{label}</span>
      </div>

      <Progress
        percent={percent}
        showInfo={false}
        strokeColor="#f97316"
        trailColor="rgba(255,255,255,0.1)"
        className="!mt-3 !mb-3"
      />

      <div className={compact ? "grid sm:grid-cols-2 gap-2" : "space-y-2"}>
        {requirements.map((item) => {
          const passed = item.test(password);
          return (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {passed ? (
                <CheckCircleOutlined className="text-emerald-400" />
              ) : (
                <ExclamationCircleOutlined className="text-white/35" />
              )}
              <Typography.Text className={passed ? "!text-emerald-300" : "!text-white/60"}>
                {item.label}
              </Typography.Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
