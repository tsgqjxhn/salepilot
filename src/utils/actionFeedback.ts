import { ElNotification } from "element-plus";
import { getRequestErrorMessage } from "@/utils/requestError";

type FeedbackKind = "success" | "error" | "warning" | "info";

interface ActionFeedbackOptions {
  title?: string;
  duration?: number;
}

const FEEDBACK_TITLES: Record<FeedbackKind, string> = {
  success: "Action completed",
  error: "Action failed",
  warning: "Check this action",
  info: "Action update",
};

const FEEDBACK_DURATIONS: Record<FeedbackKind, number> = {
  success: 2600,
  error: 3600,
  warning: 3200,
  info: 2600,
};

function notify(kind: FeedbackKind, message: string, options: ActionFeedbackOptions = {}) {
  ElNotification({
    title: options.title || FEEDBACK_TITLES[kind],
    message,
    type: kind,
    duration: options.duration ?? FEEDBACK_DURATIONS[kind],
    position: "top-right",
    customClass: `app-feedback-notification app-feedback-notification--${kind}`,
  });
}

export function notifyActionSuccess(message: string, options: ActionFeedbackOptions = {}) {
  notify("success", message, options);
}

export function notifyActionInfo(message: string, options: ActionFeedbackOptions = {}) {
  notify("info", message, options);
}

export function notifyActionWarning(message: string, options: ActionFeedbackOptions = {}) {
  notify("warning", message, options);
}

export function notifyActionError(
  error: unknown,
  fallback: string,
  options: ActionFeedbackOptions = {},
) {
  notify("error", getRequestErrorMessage(error, fallback), options);
}
