/* FICHIER: middleware.ts */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // 1. On récupère les infos de connexion envoyées par le navigateur
  const basicAuth = req.headers.get('authorization');

  // 2. Si l'utilisateur a envoyé des infos
  if (basicAuth) {
    // Le format est "Basic xxxxx", on enlève "Basic "
    const authValue = basicAuth.split(' ')[1];
    // On décode le "user:password" qui est en base64
    const [user, pwd] = atob(authValue).split(':');

    // 3. On vérifie si c'est le bon login et mot de passe (depuis le fichier .env.local)
    if (user === process.env.ADMIN_USER && pwd === process.env.ADMIN_PASSWORD) {
      // C'est bon ! On laisse passer
      return NextResponse.next();
    }
  }

  // 4. Si pas connecté ou mauvais mot de passe, on bloque et on demande l'authentification
  return new NextResponse('Authentification requise', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Espace Admin Sécurisé"',
    },
  });
}

// On applique cette sécurité partout (sauf les fichiers statiques comme les images)
export const config = {
  matcher: '/:path*',
};
