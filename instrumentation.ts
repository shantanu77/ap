export function register() {
  const secret = process.env.BOARD_REMINDER_SECRET || process.env.OPENAI_API_KEY;
  if (process.env.NEXT_RUNTIME !== "nodejs" || !secret) return;

  const root = globalThis as typeof globalThis & { __boardReminderTimer?: ReturnType<typeof setInterval> };
  if (root.__boardReminderTimer) return;

  const port = process.env.PORT || "3000";
  root.__boardReminderTimer = setInterval(() => {
    void fetch(`http://127.0.0.1:${port}/api/board/reminder`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    }).catch((error) => console.error("Study reminder scheduler could not reach the app:", error));
  }, 20_000);
  root.__boardReminderTimer.unref?.();
}
