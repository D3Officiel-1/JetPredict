
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-betting-strategy.ts';
import '@/ai/flows/predict-crash-point.ts';
import '@/ai/flows/save-strategies.ts';

// In development, we use polling.
if (process.env.NODE_ENV !== 'production') {
    const { bot } = await import('@/lib/telegram-bot');
    if (!bot.isPolling()) {
        console.log("Starting Telegram bot polling for development...");
        bot.startPolling();
    }
}