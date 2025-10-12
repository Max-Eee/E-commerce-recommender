import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware to set cache ID cookie.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  let cacheIdCookie = request.cookies.get("_medusa_cache_id")

  // Set cache ID if not already set
  if (!cacheIdCookie) {
    let cacheId = crypto.randomUUID()
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
