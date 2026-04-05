import { NextResponse } from "next/server";

/**
 * TELEGRAM SEND MESSAGE API
 * POST { chatId, message }
 */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const chatId = String(body?.chatId ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!chatId) {
      return NextResponse.json(
        { ok: false, error: "Missing chatId" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Missing message" },
        { status: 400 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing TELEGRAM_BOT_TOKEN in .env.local" },
        { status: 500 }
      );
    }

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML", // 🔥 allows formatting
        }),
      }
    );

    const data = await telegramRes.json().catch(() => null);

    if (!telegramRes.ok || !data?.ok) {
      console.error("❌ Telegram send failed:", data);

      return NextResponse.json(
        {
          ok: false,
          error: data?.description || "Telegram send failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Telegram sent successfully",
      result: data.result ?? null,
    });

  } catch (error: any) {
    console.error("🔥 Telegram API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unexpected server error",
      },
      { status: 500 }
    );
  }
}