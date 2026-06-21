// Middleware placeholder — auth protection will be enabled in Phase 1
// when the database is connected and Auth.js is fully configured.
export default function middleware() {
  // Allow all requests through for now
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sign-in|p/).*)"],
};
