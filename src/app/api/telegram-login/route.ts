
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Cette route API gère la redirection depuis le bot Telegram vers la page de connexion.
 * Elle capture le `chatId` de Telegram et le transmet en tant que paramètre d'URL
 * à la page de connexion du site.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId');

  const redirectUrl = new URL('/login', req.url);

  if (chatId) {
    redirectUrl.searchParams.append('chatId', chatId);
  }

  // Redirige vers la page de connexion avec le chatId
  return NextResponse.redirect(redirectUrl);
}