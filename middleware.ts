import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // 1. LE PASSE-DROIT POUR LE ROBOT (NOUVEAU NOM DE LA ROUTE)
  if (req.nextUrl.pathname.startsWith('/api/automate')) {
    return NextResponse.next();
  }

  // 2. LA PROTECTION GLOBALE POUR LE RESTE DU SITE (Le videur)
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // Décodage du nom d'utilisateur et mot de passe
    const [user, pwd] = atob(authValue).split(':');

    if (user === 'admin' && pwd === 'NterSecret2026!') {
      return NextResponse.next();
    }
  }

  // 3. SI LE MOT DE PASSE EST MAUVAIS OU ABSENT -> ON AFFICHE LA FENÊTRE DE CONNEXION
  return new NextResponse('Authentification requise', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="T-Prospect Secure Area"',
    },
  });
}

// On demande au middleware de surveiller toutes les pages SAUF les images et fichiers techniques
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/automate).*)'],
};