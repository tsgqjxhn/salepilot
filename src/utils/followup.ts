export type FollowupChannel = "call" | "wechat" | "email" | "sms" | "meeting" | "visit" | "other";

export const FOLLOWUP_CHANNEL_OPTIONS: Array<{ value: FollowupChannel; label: string }> = [
  { value: "call", label: "Phone" },
  { value: "wechat", label: "WeChat" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "meeting", label: "Meeting" },
  { value: "visit", label: "On-site Visit" },
  { value: "other", label: "Other" },
];

export const FOLLOWUP_CHANNEL_LABELS: Record<FollowupChannel, string> = {
  call: "Phone",
  wechat: "WeChat",
  email: "Email",
  sms: "SMS",
  meeting: "Meeting",
  visit: "On-site Visit",
  other: "Other",
};
