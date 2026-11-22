import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGmailSmtpEmail } from "@/lib/email";
import { getParentNotificationConfig } from "@/lib/parentConfig";
import { buildDailyInsights, defaultInsightsStart } from "@/lib/sessionInsights";
import { parseDate } from "@/lib/utils";
import type { DailyContent } from "@/types";
import { format } from "date-fns";
import { getAuthenticatedKid } from "@/lib/kidAuth";

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
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { date: dateStr } = await params;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      reason?: string;
      notify?: boolean;
      force?: boolean;
    };
    const date = parseDate(dateStr);
    if (dateStr >= format(new Date(), "yyyy-MM-dd")) {
      return NextResponse.json(
        { error: "Current or future sessions cannot be marked missed until the day has passed." },
        { status: 409 }
      );
    }

    const plan = await prisma.dailyPlan.upsert({
      where: { kidId_date: { kidId: kid.id, date } },
      create: {
        kidId: kid.id,
        date,
        content: missedPlanContent(dateStr) as object,
      },
      update: {},
    });

    const existingSession = await prisma.session.findUnique({
      where: { dailyPlanId: plan.id },
      include: { phases: true },
    });
    const completedPhaseCount = existingSession?.phases.filter((phase) => phase.completed).length ?? 0;
    if (!body.force && existingSession && (existingSession.status === "COMPLETE" || completedPhaseCount >= 6)) {
      return NextResponse.json(
        { error: "Completed sessions cannot be marked missed without force=true." },
        { status: 409 }
      );
    }

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
        if (config.senderEmail && config.senderPassword && kid.email) {
        const sessions = await prisma.session.findMany({
          where: { date: { gte: defaultInsightsStart() }, dailyPlan: { is: { kidId: kid.id } } },
          include: { phases: true, dailyPlan: true },
          orderBy: { date: "asc" },
        });
        const insights = buildDailyInsights(sessions, defaultInsightsStart());
        const recentAbsences = insights.slice(-14).filter((day) => day.absent).length;
        escalated = kid.id === "legacy-aashvath" && recentAbsences >= config.escalateAfterAbsences && config.escalationEmails.length > 0;

        try {
          await sendGmailSmtpEmail({
            from: config.senderEmail,
            password: config.senderPassword,
            to: [kid.email],
            cc: escalated ? config.escalationEmails : undefined,
            subject: `${kid.name}: skipped study session for ${dateStr}`,
            text: [
              `This is a study session reminder for ${kid.name}.`,
              "",
              `Date: ${dateStr}`,
              `Status: Skipped class / absent`,
              `Reason noted: ${body.reason || "No reason provided"}`,
              `Absences in the last 14 tracked days: ${recentAbsences}`,
              "",
              `${kid.name} should complete the missed work and protect the next planned study session.`,
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
