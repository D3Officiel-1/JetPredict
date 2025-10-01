import { NextResponse } from 'next/server';

export async function GET() {
  // remplace par ton vrai @username de bot
  const botUsername = 'Jet_Predict_Bot';  

  // On renvoie un petit HTML que tu pourras intégrer en <iframe>
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin:0;
            font-family: sans-serif;
            display:flex;
            justify-content:center;
            align-items:center;
            height:100vh;
            background:transparent;
          }
          .tg-btn {
            padding: 12px 24px;
            background:#0088cc;
            color:#fff;
            text-decoration:none;
            border-radius:8px;
            font-size:16px;
            transition:background .2s;
          }
          .tg-btn:hover { background:#0072aa; }
        </style>
      </head>
      <body>
        <a class="tg-btn" href="https://t.me/${botUsername}" target="_blank" rel="noopener noreferrer">
          👉 Ouvrir le bot
        </a>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}