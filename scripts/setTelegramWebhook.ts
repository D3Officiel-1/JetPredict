
import { config } from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

// Load environment variables from .env file
config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not defined in your .env file.');
  process.exit(1);
}

if (!appUrl) {
  console.error('❌ NEXT_PUBLIC_APP_URL is not defined in your .env file.');
  process.exit(1);
}

const webhookUrl = `${appUrl}/api/telegram/webhook`;

const bot = new TelegramBot(token);

async function setWebhook() {
  try {
    console.log(`Setting webhook to: ${webhookUrl}`);
    await bot.setWebHook(webhookUrl);
    console.log('✅ Webhook set successfully!');

    const webhookInfo = await bot.getWebHookInfo();
    console.log('ℹ️  Current webhook info:');
    console.log(webhookInfo);

  } catch (error) {
    console.error('❌ Failed to set webhook:', error);
    process.exit(1);
  }
}

async function deleteWebhook() {
    try {
        console.log('Deleting existing webhook...');
        const result = await bot.deleteWebHook();
        if(result) {
            console.log('✅ Existing webhook deleted successfully.');
        } else {
            console.log('ℹ️ No webhook was set, nothing to delete.');
        }
    } catch (error) {
        console.error('❌ Failed to delete webhook:', error);
        process.exit(1);
    }
}

async function run() {
    await deleteWebhook();
    await setWebhook();
}

run();