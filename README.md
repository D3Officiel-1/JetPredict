# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running the Development Server

This project uses Next.js for the web application and Genkit for AI features. The Telegram bot also runs in a separate process in development.

To run the full development environment, you will need two separate terminal windows.

### Terminal 1: Run the Next.js App

```bash
npm run dev
```

This will start the main web application on [http://localhost:9002](http://localhost:9002).

### Terminal 2: Run Genkit and the Telegram Bot

```bash
npm run genkit:watch
```

This command starts the Genkit development server and also initializes the Telegram bot in polling mode. The `--watch` flag ensures that your Genkit flows and the bot code are automatically reloaded when you make changes.

### Environment Variables

Make sure you have a `.env` file in the root of your project with your `TELEGRAM_BOT_TOKEN`:

```
TELEGRAM_BOT_TOKEN=your_token_here
```
