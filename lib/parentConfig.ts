export interface ParentNotificationConfig {
  studentName: string;
  senderEmail: string;
  senderPassword: string;
  parentEmails: string[];
  escalationEmails: string[];
  warnAfterAbsences: number;
  escalateAfterAbsences: number;
}

function splitEmails(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function intFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getParentNotificationConfig(): ParentNotificationConfig {
  const senderEmail = process.env.EMAIL ?? process.env.SMTP_USER ?? "";
  const senderPassword = process.env.PASSWORD ?? process.env.SMTP_PASSWORD ?? "";
  const parentEmails = splitEmails(process.env.PARENT_EMAILS);
  const escalationEmails = splitEmails(process.env.ESCALATION_EMAILS);

  return {
    studentName: process.env.NEXT_PUBLIC_STUDENT_NAME || "Aashvath",
    senderEmail,
    senderPassword,
    parentEmails: parentEmails.length > 0 ? parentEmails : senderEmail ? [senderEmail] : [],
    escalationEmails,
    warnAfterAbsences: intFromEnv(process.env.WARN_AFTER_ABSENCES, 1),
    escalateAfterAbsences: intFromEnv(process.env.ESCALATE_AFTER_ABSENCES, 2),
  };
}

export function hasEmailConfig(config = getParentNotificationConfig()): boolean {
  return Boolean(config.senderEmail && config.senderPassword && config.parentEmails.length > 0);
}
