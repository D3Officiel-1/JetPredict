
import { bot } from '@/lib/telegram-bot';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // processUpdate will trigger the 'message', 'callback_query', etc. events in telegram-bot.ts
    bot.processUpdate(body);
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling Telegram update:', error);
    // Ensure a valid response is always sent, even on error
    return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
  }
}

