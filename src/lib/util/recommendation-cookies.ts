import Cookies from "js-cookie"

export interface StoredRecommendationData {
  recommendations: any[]
  products: any[]
  userBehavior: any
  timestamp: number
}

const COOKIE_NAME = "recommendation_data"
const COOKIE_EXPIRY = 7 // days

export function saveRecommendationDataToCookie(data: Omit<StoredRecommendationData, "timestamp">) {
  const dataWithTimestamp: StoredRecommendationData = {
    ...data,
    timestamp: Date.now(),
  }
  
  // Extract cart items for logging
  const cartItemIds = data.userBehavior.cartItems || []
  const cartItems = data.products.filter((product: any) => cartItemIds.includes(product.id))
  
  console.log('\n💾 SAVING TO COOKIES:')
  console.log('='.repeat(80))
  console.log(`📦 Total Products: ${data.products.length}`)
  console.log(`🎯 Recommendations: ${data.recommendations.length}`)
  console.log(`🛒 Cart Items: ${cartItems.length}`)
  if (cartItems.length > 0) {
    console.log('\nCart Contents:')
    cartItems.forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. ${item.name} - $${item.price} (ID: ${item.id})`)
    })
  }
  console.log(`⏱️  Expiry: ${COOKIE_EXPIRY} days`)
  console.log('='.repeat(80) + '\n')
  
  // Store in cookie (compressed/stringified)
  Cookies.set(COOKIE_NAME, JSON.stringify(dataWithTimestamp), {
    expires: COOKIE_EXPIRY,
    sameSite: "lax",
  })
  
  // Also store in sessionStorage for immediate access
  sessionStorage.setItem("recommendationResults", JSON.stringify(data))
  
  // Dispatch a custom event to notify components that cart has been updated
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('cartUpdated', { 
      detail: { cartItems: cartItemIds }
    })
    window.dispatchEvent(event)
    console.log('🔔 Dispatched cartUpdated event')
  }
}

export function getRecommendationDataFromCookie(): StoredRecommendationData | null {
  try {
    // First try sessionStorage (faster and more reliable)
    if (typeof window !== 'undefined') {
      const sessionData = sessionStorage.getItem("recommendationResults")
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        console.log('📦 Loaded recommendation data from sessionStorage:', {
          products: parsed.products?.length || 0,
          recommendations: parsed.recommendations?.length || 0,
          cartItems: parsed.userBehavior?.cartItems?.length || 0
        })
        return { ...parsed, timestamp: Date.now() }
      }
    }
    
    // Fallback to cookie
    const cookieData = Cookies.get(COOKIE_NAME)
    if (!cookieData) {
      console.log('❌ No data found in sessionStorage or cookies')
      return null
    }
    
    const parsed = JSON.parse(cookieData)
    
    // Check if data is older than 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (parsed.timestamp < sevenDaysAgo) {
      clearRecommendationData()
      return null
    }
    
    console.log('📦 Loaded recommendation data from cookie:', {
      products: parsed.products?.length || 0,
      recommendations: parsed.recommendations?.length || 0,
      cartItems: parsed.userBehavior?.cartItems?.length || 0
    })
    
    return parsed
  } catch (error) {
    console.error("Error parsing recommendation data:", error)
    return null
  }
}

export function clearRecommendationData() {
  console.log('\n🗑️  CLEARING RECOMMENDATION DATA:')
  console.log('='.repeat(80))
  console.log('Removing cookies and sessionStorage...')
  
  Cookies.remove(COOKIE_NAME)
  sessionStorage.removeItem("recommendationResults")
  
  console.log('✅ Data cleared successfully')
  console.log('='.repeat(80) + '\n')
  
  // Dispatch event to notify components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cartItems: [] }}))
    console.log('🔔 Dispatched cartUpdated event (empty cart)')
  }
}

export function getCartItemsFromRecommendations() {
  const data = getRecommendationDataFromCookie()
  if (!data) {
    console.log('🛒 No recommendation data found in cookies')
    return []
  }
  
  const { products, userBehavior } = data
  
  // Get items in cart from user behavior
  const cartItemIds = userBehavior.cartItems || []
  
  // Return full product objects for items in cart
  const cartItems = products.filter((product: any) => cartItemIds.includes(product.id))
  
  console.log('\n🛒 RETRIEVING CART ITEMS FROM COOKIES:')
  console.log('='.repeat(80))
  console.log(`Cart Item IDs from User Behavior: ${JSON.stringify(cartItemIds)}`)
  console.log(`Matched Products: ${cartItems.length}`)
  if (cartItems.length > 0) {
    cartItems.forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. ${item.name} - $${item.price}`)
    })
  } else {
    console.log('No items in cart')
  }
  console.log('='.repeat(80) + '\n')
  
  return cartItems
}
