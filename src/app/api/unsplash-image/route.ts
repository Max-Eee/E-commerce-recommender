import { NextRequest, NextResponse } from "next/server"

// In-memory store for rate limiting (use Redis in production)
const ipRequestCount = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = 10000 // Temporarily disabled - set very high
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  if (realIp) {
    return realIp.trim()
  }
  
  return "unknown"
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = ipRequestCount.get(ip)

  // Clean up old records periodically
  if (ipRequestCount.size > 10000) {
    const keysToDelete: string[] = []
    ipRequestCount.forEach((value, key) => {
      if (now > value.resetTime) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => ipRequestCount.delete(key))
  }

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    ipRequestCount.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT - record.count }
}

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request)
  const { allowed, remaining } = checkRateLimit(clientIp)

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 50 images per 24 hours." },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": ipRequestCount.get(clientIp)?.resetTime.toString() || "",
        }
      }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    )
  }

  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

  if (!accessKey || accessKey === "your_unsplash_access_key_here") {
    console.error("Unsplash API key not configured")
    // Fallback to Unsplash Source (no auth required)
    const fallbackUrl = `https://source.unsplash.com/400x400/?${encodeURIComponent(query)}`
    return NextResponse.json({ 
      url: fallbackUrl,
      fallback: true 
    }, {
      headers: {
        "X-RateLimit-Limit": RATE_LIMIT.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
      }
    })
  }

  try {
    // Search for photos using Unsplash API
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const photo = data.results[0]
      return NextResponse.json({
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        downloadLocation: photo.links.download_location,
      }, {
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
        }
      })
    } else {
      // No results found, use fallback
      const fallbackUrl = `https://source.unsplash.com/400x400/?${encodeURIComponent(query)}`
      return NextResponse.json({ 
        url: fallbackUrl,
        fallback: true 
      }, {
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
        }
      })
    }
  } catch (error) {
    console.error("Error fetching from Unsplash:", error)
    // Fallback to Unsplash Source
    const fallbackUrl = `https://source.unsplash.com/400x400/?${encodeURIComponent(query)}`
    return NextResponse.json({ 
      url: fallbackUrl,
      fallback: true,
      error: "Failed to fetch from Unsplash API"
    }, {
      status: 200,
      headers: {
        "X-RateLimit-Limit": RATE_LIMIT.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
      }
    })
  }
}
