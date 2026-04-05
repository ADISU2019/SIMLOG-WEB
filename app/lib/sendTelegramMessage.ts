export async function sendTelegramMessage({
  chatId,
  message,
}: {
  chatId: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return { ok: false, error: "Missing TELEGRAM_BOT_TOKEN" };
    }

    if (!chatId) {
      return { ok: false, error: "Missing chatId" };
    }

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      console.error("Telegram error:", data);
      return { ok: false, error: data.description || "Telegram send failed" };
    }

    return { ok: true };
  } catch (err: unknown) {
    console.error("Telegram send error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}