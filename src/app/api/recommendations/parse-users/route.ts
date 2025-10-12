import { NextRequest, NextResponse } from 'next/server'
import { parseWithFallback } from '../../../../lib/gemini-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productsInput, userBehaviorInput } = body

    console.log('\n🔍 DETECTING USERS FROM NATURAL LANGUAGE (After AI Parsing)')
    console.log('='.repeat(80))

    // Step 1: Parse products (needed for context)
    console.log('📦 Parsing products for context...')
    const products = await parseWithFallback(productsInput, 'products')
    console.log(`✅ Parsed ${products.length} products`)

    // Step 2: Parse user behavior with product context
    console.log('\n👥 Parsing user behavior to detect users...')
    const inputWithContext = `${userBehaviorInput}

AVAILABLE PRODUCT IDs TO USE: ${products.map((p: any) => p.id).join(', ')}
(Use these IDs for viewedProducts, cartItems, and purchasedProducts arrays)`

    // Parse as allUserBehaviors to detect multiple users
    const parsedUserBehavior = await parseWithFallback(inputWithContext, 'allUserBehaviors')

    // Extract user IDs from parsed data
    let users: string[] = []
    if (Array.isArray(parsedUserBehavior)) {
      users = parsedUserBehavior
        .map((u: any) => u.userId)
        .filter(Boolean)
      console.log(`✅ Detected ${users.length} user(s):`, users)
    } else if (parsedUserBehavior.userId) {
      users = [parsedUserBehavior.userId]
      console.log(`✅ Detected 1 user:`, users[0])
    }

    console.log('='.repeat(80))

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error: any) {
    console.error('❌ Error detecting users:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to detect users from natural language input',
      },
      { status: 500 }
    )
  }
}
