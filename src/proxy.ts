import { NextRequest, NextResponse } from "next/server";

// Chequeo liviano: si no hay cookie de sesión, va al login.
// La validación real de la sesión y el rol se hace en los layouts y actions.
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("barra_session");

  if (!hasSession && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && pathname === "/login") {
    // Sesión de un usuario eliminado/desactivado: se borra la cookie y se
    // muestra el login.
    if (request.nextUrl.searchParams.get("salir")) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete("barra_session");
      return res;
    }
    return NextResponse.redirect(new URL("/estadisticas", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)",
  ],
};
