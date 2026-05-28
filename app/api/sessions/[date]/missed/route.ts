import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGmailSmtpEmail } from "@/lib/email";
import { getParentNotificationConfig, hasEmailConfig } from "@/lib/parentConfig";
import { buildDailyInsights, defaultInsightsStart } from "@/lib/sessionInsights";
import { parseDate } from "@/lib/utils";
import type { DailyContent } from "@/types";

function missedPlanContent(dateStr: string): DailyContent {
  return {
    date: dateStr,
    science_hook: "Session skipped; no learning content was used.",
    reading: {
      title: "Skipped Session",
      topic: "Attendance",
      passage: "This session was marked as skipped.",
      comprehension_questions: [
        "Why was the session missed?",
        "What work should be caught up?",
        "How can tomorrow's session be protected?",
      ],
    },
    language: {
      type: "review",
      lesson_title: "Skipped Session",
      content: "No language lesson was completed.",
      practice_task: "Catch up on the missed lesson.",
      remember_tip: "Attendance matters because missed practice compounds quickly.",
    },
    writing: {
      type: "copy",
      prompt: "I will attend my session.\nI will complete my work.\nI will not skip practice.",
      lines_required: 3,
      success_criteria: ["All 3 lines are attempted", "Letters are legible", "No skipped words"],
    },
    ethics_reflection:
      "Skipping a planned class breaks trust and makes tomorrow harder. The right repair is to acknowledge it, complete the missed work, and attend the next session on time.",
    next_day_tip: "Keep the next session time clear and start on time.",
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date: dateStr } = await params;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      reason?: string;
      notify?: boolean;
    };
    const date = parseDate(dateStr);
    const plan = await prisma.dailyPlan.upsert({
      where: { date },
      create: {
        date,
        content: missedPlanContent(dateStr) as object,
      },
      update: {},
    });

    const session = await prisma.session.upsert({
      where: { dailyPlanId: plan.id },
      create: {
        date,
        dailyPlanId: plan.id,
        status: "MISSED",
        notes: body.reason || "Class skipped / session not attended.",
      },
      update: {
        status: "MISSED",
        completedAt: null,
        notes: body.reason || "Class skipped / session not attended.",
      },
      include: { phases: true, dailyPlan: true },
    });

    let emailSent = false;
    let escalated = false;
    let emailError: string | null = null;

    if (body.notify !== false) {
      const config = getParentNotificationConfig();
      if (hasEmailConfig(config)) {
        const sessions = await prisma.session.findMany({
          where: { date: { gte: defaultInsightsStart() } },
          include: { phases: true, dailyPlan: true },
          orderBy: { date: "asc" },
        });
        const insights = buildDailyInsights(sessions, defaultInsightsStart());
        const recentAbsences = insights.slice(-14).filter((day) => day.absent).length;
        escalated =
          recentAbsences >= config.escalateAfterAbsences && config.escalationEmails.length > 0;

        try {
          await sendGmailSmtpEmail({
            from: config.senderEmail,
            password: config.senderPassword,
            to: config.parentEmails,
            cc: escalated ? config.escalationEmails : undefined,
            subject: `${config.studentName}: skipped class warning for ${dateStr}`,
            text: [
              `This is an attendance warning for ${config.studentName}.`,
              "",
              `Date: ${dateStr}`,
              `Status: Skipped class / absent`,
              `Reason noted: ${body.reason || "No reason provided"}`,
              `Absences in the last 14 tracked days: ${recentAbsences}`,
              "",
              `${config.studentName} needs to be told clearly that skipping the scheduled learning session is not acceptable. The missed work should be completed, and another skipped session will be escalated according to the parent configuration.`,
            ].join("\n"),
            timeoutMs: 12_000,
          });
          emailSent = true;
        } catch (error) {
          emailError = error instanceof Error ? error.message : "Failed to send warning email";
        }
      } else {
        emailError = "Parent email configuration is incomplete";
      }
    }

    return NextResponse.json({ session, emailSent, escalated, emailError });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to mark session missed" }, { status: 500 });
  }
}
