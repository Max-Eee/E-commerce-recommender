import { GoogleGenerativeAI } from '@google/generative-ai'
import { Product, UserBehavior } from '../types/recommendation'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || ''

/**
 * Fetch image from Unsplash based on product name
 */
async function fetchUnsplashImage(productName: string, category?: string): Promise<string> {
  try {
    // Extract keywords from product name - focus on main product type
    let keywords = productName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'with'].includes(word))
      .slice(0, 2)
      .join(' ')
    
    // If no good keywords, use category
    if (!keywords && category) {
      keywords = category.toLowerCase().replace(/\s+/g, ' ')
    }
    
    const searchQuery = keywords || 'product'
    
    console.log(`   🔍 Searching Unsplash for: "${searchQuery}"`)
    
    // Use authenticated API - required for reliable images
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn('   ⚠️  No Unsplash API key - using placeholder')
      return `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(productName.substring(0, 20))}`
    }
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=squarish`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    )
    
    if (!response.ok) {
      console.warn(`   ⚠️  Unsplash API error: ${response.status}`)
      return `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(productName.substring(0, 20))}`
    }
    
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular
      console.log(`   ✅ Found image: ${imageUrl.substring(0, 60)}...`)
      return imageUrl
    } else {
      console.warn(`   ⚠️  No images found for "${searchQuery}"`)
      // Fallback to category search
      if (category && category !== searchQuery) {
        const fallbackResponse = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(category.toLowerCase())}&per_page=1&orientation=squarish`,
          {
            headers: {
              'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          }
        )
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          if (fallbackData.results && fallbackData.results.length > 0) {
            return fallbackData.results[0].urls.regular
          }
        }
      }
      
      return `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(productName.substring(0, 20))}`
    }
  } catch (error) {
    console.error('   ❌ Error fetching Unsplash image:', error)
    return `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(productName.substring(0, 20))}`
  }
}

/**
 * Generate explanation for why a product is recommended
 */
export async function generateRecommendationExplanation(
  product: Product,
  userBehavior: UserBehavior,
  scoreBreakdown: any
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Determine highest scoring factor
    const scores = {
      collaborative: scoreBreakdown.collaborative || 0,
      contentBased: scoreBreakdown.contentBased || 0,
      contextAware: scoreBreakdown.contextAware || 0,
      userBased: scoreBreakdown.userBased || 0,
      categoryPopularity: scoreBreakdown.categoryPopularity || 0,
    }
    
    const maxScore = Math.max(...Object.values(scores))
    const topFactor = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'contextAware'
    
    // Build user context
    const userContext: string[] = []
    if (userBehavior.viewedProducts && userBehavior.viewedProducts.length > 0) {
      userContext.push(`viewed ${userBehavior.viewedProducts.length} products`)
    }
    if (userBehavior.cartItems && userBehavior.cartItems.length > 0) {
      userContext.push(`has ${userBehavior.cartItems.length} items in cart`)
    }
    if (userBehavior.purchasedProducts && userBehavior.purchasedProducts.length > 0) {
      userContext.push(`purchased ${userBehavior.purchasedProducts.length} products`)
    }
    
    // Get categories from product interactions
    const interactedCategories = new Set<string>()
    if (userBehavior.productInteractions) {
      Object.values(userBehavior.productInteractions).forEach((interaction: any) => {
        if (interaction.viewCount > 0 || interaction.cartActions?.timesAddedToCart > 0) {
          // We don't have category in interaction, so we'll note engagement
        }
      })
    }

    const prompt = `You are an AI recommendation expert. Create a SINGLE LINE explanation combining WHY we recommend this product based on user behavior AND general product appeal.

PRODUCT:
"${product.name}" - ${product.category} - $${product.price}

USER BEHAVIOR:
- Viewed: ${userBehavior.viewedProducts?.length || 0} products (${userBehavior.viewedProducts?.slice(0, 3).join(', ') || 'none'})
- In Cart: ${userBehavior.cartItems?.length || 0} items (${userBehavior.cartItems?.slice(0, 3).join(', ') || 'none'})
- Purchased: ${userBehavior.purchasedProducts?.length || 0} products (${userBehavior.purchasedProducts?.slice(0, 3).join(', ') || 'none'})
- Engagement: ${userBehavior.productInteractions ? Object.keys(userBehavior.productInteractions).length : 0} product interactions

RECOMMENDATION SCORES:
Top Factor: ${topFactor} (${(maxScore * 100).toFixed(0)}%)
- Collaborative: ${(scoreBreakdown.collaborative * 100).toFixed(0)}%
- Content Match: ${(scoreBreakdown.contentBased * 100).toFixed(0)}%
- Trending: ${(scoreBreakdown.contextAware * 100).toFixed(0)}%
${scoreBreakdown.userBased ? `- Similar Users: ${(scoreBreakdown.userBased * 100).toFixed(0)}%` : ''}
${scoreBreakdown.categoryPopularity ? `- Category Popular: ${(scoreBreakdown.categoryPopularity * 100).toFixed(0)}%` : ''}

INSTRUCTIONS - SINGLE LINE FORMAT:
Structure: "[USER-SPECIFIC REASON] + [GENERAL APPEAL/BENEFIT]"

EXAMPLES BY TOP FACTOR:

userBased (Similar Users):
- "Similar users who added ${product.category.toLowerCase()} items to cart loved this - known for excellent quality and value."
- "Users with similar shopping patterns frequently purchase this alongside electronics - highly rated for durability."

collaborative (Collaborative Filtering):
- "Based on your cart items (${userBehavior.cartItems?.slice(0, 2).join(', ') || 'items'}), this pairs perfectly with what you're buying - customers love this combination."
- "Your purchase history suggests you'd appreciate this - it's a bestseller among shoppers with similar tastes."

contentBased (Content Match):
- "Matches your interest in ${product.category} (you viewed ${userBehavior.viewedProducts?.length || 0} products) - features premium quality and great reviews."
- "Complements your ${userBehavior.cartItems?.[0] || 'recent'} selection perfectly - popular for its versatility and design."

contextAware (Trending):
- "Trending now in ${product.category} and fits your browsing pattern - customers rave about its value and performance."
- "Currently popular with shoppers like you exploring ${product.category.toLowerCase()} - excellent ratings and fast shipping."

categoryPopularity (Popular in Category):
- "Top seller in ${product.category} matching your cart interests - thousands of 5-star reviews for quality."
- "Most popular ${product.category.toLowerCase()} among active shoppers like you - premium features at great value."

CRITICAL RULES:
1. ONE SENTENCE ONLY (max 25 words)
2. FIRST PART: Reference specific user behavior (what they viewed/added/purchased)
3. SECOND PART: General product benefit/appeal (quality, reviews, features, value)
4. Connect with "and" or "-" between parts
5. Be specific about WHY based on their actual actions
6. Mention concrete benefits (reviews, quality, value, features)
7. Sound natural and conversational

Generate ONE line explanation:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const explanation = response.text().trim()
    
    console.log(`   💡 Generated: "${explanation}"`)
    
    return explanation
  } catch (error) {
    console.error('Error generating LLM explanation:', error)
    // Return a more specific fallback based on category
    return `Trending ${product.category.toLowerCase()} item that matches your interests.`
  }
}

/**
 * Lightweight function to extract user IDs from natural language without full parsing
 * This avoids duplicate heavy AI calls for product parsing
 */
export async function parseUserIdsOnly(userBehaviorInput: string): Promise<string[]> {
  try {
    // First, try to detect from JSON if it's valid JSON
    try {
      const parsed = JSON.parse(userBehaviorInput)
      if (Array.isArray(parsed)) {
        return parsed.map((u: any) => u.userId).filter(Boolean)
      } else if (parsed.userId) {
        return [parsed.userId]
      }
    } catch {
      // Not JSON, continue with AI parsing
    }

    // Use lightweight AI call to extract just user IDs
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const prompt = `Extract ONLY the user IDs from this natural language text.
Return a JSON array of user ID strings, nothing else.

Example input: "Main user (user123) did this. Another user (user456) did that."
Example output: ["user123", "user456"]

If only one user, return array with one element: ["user123"]
If no users mentioned, return empty array: []

TEXT TO ANALYZE:
${userBehaviorInput}

RESPOND WITH ONLY THE JSON ARRAY:`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    
    // Clean markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const userIds = JSON.parse(cleaned)
    return Array.isArray(userIds) ? userIds : []
  } catch (error) {
    console.error('Error extracting user IDs:', error)
    return []
  }
}

/**
 * Try to parse JSON manually first, fall back to LLM if it fails
 */
export async function parseWithFallback(
  input: string,
  type: 'products' | 'userBehavior' | 'allUserBehaviors',
  options?: { skipImage?: boolean }
): Promise<any> {
  console.log(`\n🔄 Attempting to parse ${type}...`)
  
  // Step 1: Try manual JSON parsing
  try {
    const parsed = JSON.parse(input)
    
    // Validate the structure
    let isValid = false
    
    if (type === 'products') {
      isValid = Array.isArray(parsed) && parsed.length > 0 && 
                parsed.every((p: any) => p.id && p.name && p.category && typeof p.price === 'number')
      
      if (isValid) {
        console.log(`   ✅ Manual parsing successful! Found ${parsed.length} products`)
        
        // Add images using Unsplash
        console.log('\n🖼️  Fetching Unsplash images for products...')
        const productsWithImages = await Promise.all(
          parsed.map(async (product: any) => {
            if (!product.image) {
              const imageUrl = await fetchUnsplashImage(product.name, product.category)
              return { ...product, image: imageUrl }
            }
            return product
          })
        )
        
        return productsWithImages
      }
    } else if (type === 'userBehavior') {
      isValid = parsed && typeof parsed === 'object' && 
                Array.isArray(parsed.viewedProducts) &&
                Array.isArray(parsed.cartItems) &&
                Array.isArray(parsed.purchasedProducts)
      
      if (isValid) {
        console.log('   ✅ Manual parsing successful! User behavior validated')
        return parsed
      }
    } else if (type === 'allUserBehaviors') {
      console.log(`   🔍 Validating allUserBehaviors structure...`)
      console.log(`      - Is Array: ${Array.isArray(parsed)}`)
      console.log(`      - Length: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`)
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validationResults = parsed.map((ub: any, index: number) => ({
          index,
          hasUserId: !!ub.userId,
          hasViewedProducts: Array.isArray(ub.viewedProducts),
          userId: ub.userId
        }))
        console.log(`      - Validation per user:`, JSON.stringify(validationResults, null, 2))
        
        isValid = parsed.every((ub: any) => ub.userId && Array.isArray(ub.viewedProducts))
      }
      
      if (isValid) {
        console.log(`   ✅ Manual parsing successful! Found ${parsed.length} user behaviors`)
        return parsed
      } else {
        console.log(`   ❌ Validation failed for allUserBehaviors structure`)
      }
    }
    
    // If structure is invalid but JSON is valid, log warning and fall through to LLM
    console.log('   ⚠️  JSON structure invalid. Falling back to LLM parsing...')
  } catch (error) {
    // JSON parsing failed - this is expected for natural language input
    console.log('   ℹ️  Not valid JSON. Using LLM parsing...')
  }
  
  // Step 2: Fall back to LLM parsing
  console.log('   🤖 Parsing with AI...')
  return await parseNaturalLanguageToJSON(input, type, options)
}

/**
 * Parse natural language input to JSON format using LLM
 */
export async function parseNaturalLanguageToJSON(
  input: string,
  type: 'products' | 'userBehavior' | 'allUserBehaviors',
  options?: { skipImage?: boolean }
): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let prompt = ''
    
    if (type === 'products') {
      prompt = `You are a data conversion assistant. Convert natural language product descriptions into a precise JSON array for a recommendation algorithm.

EXACT FIELDS REQUIRED (DO NOT ADD OR REMOVE ANY FIELDS):
[
  {
    "id": "string (unique, format: categoryname-number)",
    "name": "string (product name)",
    "description": "string (detailed description)",
    "category": "string (one of: Electronics, Furniture, Clothing, Kitchen, Sports, Home Decor, Books, Toys, Beauty, Automotive)",
    "price": number (numeric only, no $ or commas),
    "tags": ["string", "string", "string"] (array of 3-5 lowercase tags)
  }
]

CRITICAL RULES:
1. **ID Format**: "categoryname-number" (e.g., "electronics-1", "furniture-2", "clothing-3")
   - Use lowercase category name
   - Number sequentially starting from 1
   
2. **Name**: Extract EXACT product name from input
   
3. **Category**: Must be ONE of these exact values:
   Electronics, Furniture, Clothing, Kitchen, Sports, Home Decor, Books, Toys, Beauty, Automotive
   
4. **Price**: MUST be a number (e.g., 99.99, 199, 49.99)
   - Remove $ symbols and commas
   - Keep decimals
   
5. **Tags**: Array of 3-5 lowercase, descriptive tags
   - Examples: ["wireless", "bluetooth", "audio"] or ["office", "ergonomic", "furniture"]
   
6. **Description**: Clear, detailed product description (2-3 sentences)

7. **DO NOT INCLUDE**: image, rating, stock, brand, or any other fields

VALIDATION:
- Every product MUST have all 6 fields
- id must be unique and follow pattern
- price must be numeric
- category must be from the list above
- tags must be an array

INPUT TEXT:
${input}

OUTPUT: Return ONLY a valid JSON array with EXACTLY these fields. No markdown, no explanation, no code blocks.`
    } else if (type === 'allUserBehaviors') {
      prompt = `You are a data conversion assistant. Convert natural language descriptions of multiple users into a precise JSON array for a recommendation algorithm.

EXACT FIELDS REQUIRED FOR EACH USER (DO NOT ADD OR REMOVE FIELDS):
[
  {
    "userId": "string (e.g., user1, user2, user3)",
    "viewedProducts": ["string"] (array of product IDs - REQUIRED, can be empty),
    "purchasedProducts": ["string"] (array of product IDs - REQUIRED, can be empty),
    "cartItems": ["string"] (array of product IDs - REQUIRED, can be empty),
    "searchQueries": ["string"] (OPTIONAL),
    "ratings": {} (OPTIONAL object),
    "productInteractions": {
      "product-id": {
        "productId": "string",
        "viewDuration": number (seconds),
        "viewCount": number,
        "interactions": {
          "sizeSelected": boolean,
          "colorSelected": boolean,
          "imageZoomed": boolean,
          "descriptionRead": boolean,
          "reviewsRead": boolean
        },
        "cartActions": {
          "addedToCart": number|null (timestamp),
          "timesAddedToCart": number,
          "removedFromCart": number|null (timestamp),
          "timesRemovedFromCart": number
        },
        "checkoutActions": {
          "proceededToCheckout": boolean,
          "completedPurchase": boolean,
          "purchaseCount": number
        },
        "rating": number|null (1-5),
        "timestamp": number
      }
    },
    "sessionDuration": number (OPTIONAL seconds),
    "deviceType": "string" (OPTIONAL: desktop/mobile/tablet),
    "timeOfDay": "string" (OPTIONAL: morning/afternoon/evening/night)
  }
]

CRITICAL RULES:
1. **MANDATORY FIELDS (NEVER OMIT):**
   - userId (string)
   - viewedProducts (array - can be empty [])
   - purchasedProducts (array - can be empty [])
   - cartItems (array - can be empty [])

2. **Product IDs**: Must match IDs from the product catalog

3. **Action Mapping**:
   - "viewed/browsed" → viewedProducts array
   - "purchased/bought" → purchasedProducts array + checkoutActions.completedPurchase=true
   - "added to cart/in cart" → cartItems array + cartActions.addedToCart
   - "removed from cart" → cartActions.removedFromCart

4. **Timestamps**: Use ${Date.now()} for current, ${Date.now() - 3600000} for 1hr ago

5. **Product Interactions** (OPTIONAL but recommended):
   - Only include if detailed actions mentioned
   - viewDuration: 30-120 seconds
   - viewCount: 1-5
   - Set booleans based on actions described

6. **Contextual Fields (OPTIONAL but enhance recommendations)**:
   - searchQueries: Extract any search terms mentioned (e.g., "searched for wireless headphones" → ["wireless headphones"])
     * Used to boost products matching search intent (up to +0.5 score)
   - sessionDuration: Total browsing time in SECONDS (e.g., "browsed for 15 minutes" → 900)
     * Used to identify engagement level: >30min = highly engaged (prefers premium), <5min = quick browser (prefers budget)
   - deviceType: "desktop", "mobile", or "tablet" (e.g., "on their phone" → "mobile")
     * Mobile users get boost for mid-range products ($20-$100)
   - timeOfDay: "morning", "afternoon", "evening", or "night" (e.g., "late evening shopping" → "evening")
     * Evening users get boost for premium items (>$100)

7. **DO NOT INCLUDE**: firstName, lastName, email, address, or any PII fields

INPUT TEXT:
${input}

OUTPUT: Return ONLY a valid JSON array of user behaviors. No markdown, no explanation.`
    } else {
      prompt = `You are a data conversion assistant. Convert natural language user behavior into precise JSON format for a recommendation algorithm.

EXACT FIELDS REQUIRED (DO NOT ADD OR REMOVE FIELDS):

ENHANCED FORMAT (if detailed actions mentioned):
{
  "userId": "string (default: user1)",
  "viewedProducts": ["string"] (array of product IDs - REQUIRED, can be empty),
  "purchasedProducts": ["string"] (array of product IDs - REQUIRED, can be empty),
  "cartItems": ["string"] (array of product IDs - REQUIRED, can be empty),
  "searchQueries": ["string"] (OPTIONAL - array of search terms used, e.g., ["wireless headphones", "bluetooth"]),
  "ratings": {} (OPTIONAL object),
  "sessionDuration": number (OPTIONAL - total session time in SECONDS, e.g., 900 for 15min, 1800 for 30min),
  "deviceType": "string" (OPTIONAL - "desktop", "mobile", or "tablet"),
  "timeOfDay": "string" (OPTIONAL - "morning", "afternoon", "evening", or "night"),
  "productInteractions": {
    "product-id": {
      "productId": "string",
      "viewDuration": number (seconds: 30-120),
      "viewCount": number (1-5),
      "interactions": {
        "sizeSelected": boolean,
        "colorSelected": boolean,
        "imageZoomed": boolean,
        "descriptionRead": boolean,
        "reviewsRead": boolean
      },
      "cartActions": {
        "addedToCart": number|null (timestamp),
        "timesAddedToCart": number,
        "removedFromCart": number|null (timestamp),
        "timesRemovedFromCart": number
      },
      "checkoutActions": {
        "proceededToCheckout": boolean,
        "completedPurchase": boolean,
        "purchaseCount": number
      },
      "rating": number|null (1-5),
      "timestamp": number
    }
  },
  "sessionDuration": number (OPTIONAL),
  "deviceType": "string" (OPTIONAL: desktop/mobile/tablet),
  "timeOfDay": "string" (OPTIONAL: morning/afternoon/evening/night)
}

SIMPLE FORMAT (if only basic actions mentioned):
{
  "userId": "user1",
  "viewedProducts": ["prod-1", "prod-2"],
  "purchasedProducts": ["prod-3"],
  "cartItems": ["prod-4"],
  "searchQueries": [],
  "ratings": {}
}

🚨 CRITICAL: PRODUCT ID MATCHING RULES 🚨

**YOU MUST USE ONLY THE EXACT PRODUCT IDs PROVIDED IN THE INPUT**

The input will contain a line like:
"AVAILABLE PRODUCT IDs TO USE: electronics-1, electronics-2, furniture-1, furniture-2"

**RULES:**
1. **ONLY use IDs from the AVAILABLE PRODUCT IDs list**
2. **DO NOT create new IDs like "laptop-1", "keyboard-1", "monitor-1"**
3. **DO NOT invent product IDs**
4. **Map product descriptions to available IDs:**
   - If user "viewed a laptop" → find electronics ID from available list (e.g., "electronics-1")
   - If user "added furniture to cart" → use furniture IDs from list (e.g., "furniture-1")
   - If user "purchased a keyboard" → use an electronics ID from the list
5. **Use the same ID in ALL arrays if product is mentioned multiple times:**
   - If "electronics-1" was viewed AND added to cart → both viewedProducts and cartItems should contain "electronics-1"

**EXAMPLE MAPPING:**
Available IDs: electronics-1, electronics-2, furniture-1, furniture-2

User behavior description: "User viewed a laptop (5 times, 180 seconds), added it to cart (3 times), also viewed a keyboard (3 times), purchased a mouse, and has a monitor in cart"

CORRECT OUTPUT:
{
  "viewedProducts": ["electronics-1", "electronics-2", "electronics-3", "electronics-4"],
  "cartItems": ["electronics-4", "electronics-1"],
  "purchasedProducts": ["electronics-5"],
  "productInteractions": {
    "electronics-1": { "productId": "electronics-1", ... }, // laptop
    "electronics-2": { "productId": "electronics-2", ... }, // keyboard
    "electronics-5": { "productId": "electronics-5", ... }  // mouse
  }
}

❌ WRONG OUTPUT (DO NOT DO THIS):
{
  "viewedProducts": ["laptop-1", "keyboard-1"],  ← WRONG! These IDs don't exist!
  "cartItems": ["monitor-1", "laptop-1"],        ← WRONG! Made-up IDs!
  "productInteractions": {
    "laptop-1": {...}                            ← WRONG! Use available IDs!
  }
}

CRITICAL RULES:

0. **MANDATORY FIELDS (NEVER OMIT):**
   - userId (string, default "user1")
   - viewedProducts (array - REQUIRED, can be empty [])
   - purchasedProducts (array - REQUIRED, can be empty [])
   - cartItems (array - REQUIRED, can be empty [])
   - **IMPORTANT**: AT LEAST 1 product must be in cartItems OR purchasedProducts for user1

0.5. **IF INPUT ASKS FOR SAMPLE DATA**:
   - Keywords: "sample", "generate", "create", "10 behaviors", "20 users", etc.
   - **DO NOT return empty arrays!**
   - **MUST generate realistic sample interactions**
   - If asked for "10 sample behaviors for user1":
     * Create 10 different product interactions
     * viewedProducts: array with 3-5 product IDs FROM AVAILABLE LIST
     * cartItems: array with 2-3 product IDs FROM AVAILABLE LIST
     * purchasedProducts: array with 1-2 product IDs FROM AVAILABLE LIST
   - **USE ONLY IDs FROM THE AVAILABLE PRODUCT IDs LIST**
   - **NEVER return empty arrays when sample data is requested**

1. **Action Mapping:**
   - "added to cart/in cart" → cartItems array + cartActions.addedToCart (timestamp)
   - "removed from cart" → cartActions.removedFromCart (timestamp)
   - "purchased/bought" → purchasedProducts array + checkoutActions.completedPurchase=true
   - "viewed/browsed" → viewedProducts array
   - Count: "added twice" → timesAddedToCart: 2

2. **Timestamps**: 
   - Recent: ${Date.now() - 3600000} (1hr ago)
   - Older: ${Date.now() - 86400000} (1 day ago)

3. **Interactions** (OPTIONAL, only if detailed actions mentioned):
   - "zoomed" → imageZoomed: true
   - "read description" → descriptionRead: true
   - "selected size/color" → sizeSelected/colorSelected: true

4. **Contextual Fields (OPTIONAL but enhance recommendations)**:
   - searchQueries: Extract any search terms mentioned (e.g., "searched for wireless headphones" → ["wireless headphones"])
     * Algorithm uses this to boost products matching search intent (up to +0.5 score)
   - sessionDuration: Total browsing time in SECONDS (e.g., "browsed for 15 minutes" → 900)
     * Algorithm uses this to identify engagement: >30min = highly engaged (prefers premium $50+), <5min = quick browser (prefers budget <$100)
   - deviceType: "desktop", "mobile", or "tablet" (e.g., "on their phone" → "mobile")
     * Algorithm boosts mid-range products ($20-$100) for mobile users
   - timeOfDay: "morning", "afternoon", "evening", or "night" (e.g., "late evening shopping" → "evening")
     * Algorithm boosts premium items (>$100) for evening users

5. **Validation**:
   - **Product IDs MUST be from the AVAILABLE PRODUCT IDs list ONLY**
   - At least 1 product in cartItems OR purchasedProducts for user1
   - All arrays must exist (can be empty [])

6. **DO NOT INCLUDE**: name, email, address, phone, or any PII fields

INPUT TEXT:
${input}

OUTPUT: Return ONLY valid JSON with EXACTLY these fields. No markdown, no code blocks, no explanation.`
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()
    
    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const parsed = JSON.parse(text)
    
    // Validate user behavior has at least 1 item in cart or purchased
    if (type === 'userBehavior') {
      const cartCount = parsed.cartItems?.length || 0
      const purchasedCount = parsed.purchasedProducts?.length || 0
      const viewedCount = parsed.viewedProducts?.length || 0
      
      console.log(`\n📊 User Behavior Validation:`)
      console.log(`   Viewed: ${viewedCount}, Cart: ${cartCount}, Purchased: ${purchasedCount}`)
      
      // If completely empty, generate sample data
      if (cartCount === 0 && purchasedCount === 0 && viewedCount === 0) {
        console.warn('⚠️  LLM returned empty behavior. Generating sample data...')
        
        // Generate realistic sample behavior
        parsed.viewedProducts = ['electronics-1', 'furniture-2', 'clothing-3']
        parsed.cartItems = ['electronics-1', 'furniture-2']
        parsed.purchasedProducts = ['clothing-3']
        
        console.log(`   ✅ Added sample data: 3 viewed, 2 in cart, 1 purchased`)
      } else if (cartCount === 0 && purchasedCount === 0) {
        console.warn('⚠️  No cart items or purchases found. Adding items from viewed products.')
        
        // If we have viewed products, add some to cart
        if (parsed.viewedProducts && parsed.viewedProducts.length > 0) {
          const itemsToAdd = Math.min(2, parsed.viewedProducts.length)
          parsed.cartItems = parsed.viewedProducts.slice(0, itemsToAdd)
          console.log(`   ✅ Added ${itemsToAdd} viewed items to cart`)
        } else {
          // Completely fallback - add default items
          parsed.viewedProducts = ['electronics-1', 'furniture-2']
          parsed.cartItems = ['electronics-1']
          console.log(`   ✅ Added default items: 2 viewed, 1 in cart`)
        }
      }
    }
    
    // If parsing products, fetch Unsplash images for each product unless skipImage is true
    if (type === 'products' && Array.isArray(parsed)) {
      if (options?.skipImage) {
        console.log('\n🖼️  Skipping Unsplash image fetch for detection (skipImage=true)')
        return parsed
      }

      console.log('\n🖼️  Fetching Unsplash images for products...')
      const productsWithImages = await Promise.all(
        parsed.map(async (product: any) => {
          const imageUrl = await fetchUnsplashImage(product.name, product.category)
          console.log(`   ✅ ${product.name}: ${imageUrl}`)
          return {
            ...product,
            image: imageUrl
          }
        })
      )
      return productsWithImages
    }
    
    return parsed
  } catch (error) {
    console.error('Error parsing natural language:', error)
    throw new Error('Failed to parse input. Please check the format.')
  }
}

/**
 * Validate and normalize JSON input using LLM
 */
export async function normalizeJSONInput(
  input: any,
  type: 'products' | 'userBehavior'
): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let prompt = ''
    
    if (type === 'products') {
      prompt = `Validate and normalize this product catalog JSON. Ensure each product has all required fields: id, name, description, category, price (number). Add default values for missing fields. If tags or image are missing, add appropriate defaults.

Input JSON: ${JSON.stringify(input)}

Output format (return ONLY valid JSON, no markdown or explanation):
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "category": "string",
    "price": number,
    "tags": ["array"],
    "image": "string"
  }
]`
    } else {
      prompt = `Validate and normalize this user behavior JSON. Ensure it has: userId, viewedProducts (array), purchasedProducts (array), cartItems (array). Add empty arrays for missing fields.

Input JSON: ${JSON.stringify(input)}

Output format (return ONLY valid JSON, no markdown or explanation):
{
  "userId": "string",
  "viewedProducts": ["array"],
  "purchasedProducts": ["array"],
  "cartItems": ["array"],
  "searchQueries": ["array"],
  "ratings": {}
}`
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()
    
    // Clean up the response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    return JSON.parse(text)
  } catch (error) {
    console.error('Error normalizing JSON:', error)
    // Return the input as-is if normalization fails
    return input
  }
}
