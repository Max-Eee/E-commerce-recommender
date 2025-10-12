import { NextRequest, NextResponse } from 'next/server'
import { generateRecommendations } from '../../../lib/recommendation-engine'
import { generateRecommendationExplanation, parseWithFallback, normalizeJSONInput } from '../../../lib/gemini-service'
import { Product, UserBehavior, Recommendation } from '../../../types/recommendation'

export async function POST(request: NextRequest) {
  try {
  const body = await request.json()
  const { productsInput, userBehaviorInput, allUserBehaviorsInput, inputType, targetUserId, parsedProducts: parsedProductsFromClient, parsedUserBehavior: parsedUserBehaviorFromClient } = body

    console.log('\n' + '='.repeat(100))
    console.log('🚀 RECOMMENDATION ENGINE - PROCESSING STARTED')
    console.log('='.repeat(100))
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`)
    console.log(`📝 Input Type: ${inputType}`)
    if (targetUserId) {
      console.log(`🎯 Target User ID: ${targetUserId}`)
    }
    console.log('='.repeat(100))

    // STEP 1: Generate Product Catalog using LLM
    console.log('\n📦 STEP 1: GENERATING PRODUCT CATALOG')
    console.log('-'.repeat(100))
    console.log('🔤 Raw Products Input:')
    console.log(productsInput.substring(0, 200) + (productsInput.length > 200 ? '...' : ''))
    
    let products: Product[] = []
    
    console.log('\n🤖 Parsing products...')
    if (parsedProductsFromClient) {
      console.log('   ℹ️  Using parsedProducts provided by frontend (detection step)')
      // Ensure images exist - use parseWithFallback on the JSON string which will perform manual parse and image enrichment
      products = await parseWithFallback(JSON.stringify(parsedProductsFromClient), 'products')
    } else {
      products = await parseWithFallback(productsInput, 'products')
    }
    
    console.log('✅ Product Catalog Generated:')
    console.log(`   Total Products: ${products.length}`)
    products.forEach((p, i) => {
      console.log(`   ${i + 1}. [${p.id}] ${p.name} - $${p.price} (${p.category})`)
      console.log(`      Tags: ${p.tags?.join(', ') || 'none'}`)
    })
    console.log('\n📋 Full Product Catalog Data:')
    console.log(JSON.stringify(products, null, 2))
    console.log('-'.repeat(100))

    // STEP 2: Generate User Behavior based on Product Catalog
    console.log('\n👤 STEP 2: GENERATING USER BEHAVIOR (based on product catalog)')
    console.log('-'.repeat(100))
    console.log('🔤 Raw User Behavior Input:')
    console.log(userBehaviorInput.substring(0, 200) + (userBehaviorInput.length > 200 ? '...' : ''))
    
    let userBehavior: UserBehavior
    let allUserBehaviors: UserBehavior[] | undefined
    
    console.log('\n🤖 Parsing user behavior...')
    console.log('📝 Available Product IDs for validation:', products.map(p => p.id).join(', '))
    
    // First, try to detect if it's an array or single object
    let parseType: 'userBehavior' | 'allUserBehaviors' = 'userBehavior'
    let isValidJSON = false
    let inputToUse = userBehaviorInput
    
    try {
      const testParse = JSON.parse(userBehaviorInput)
      isValidJSON = true
      if (Array.isArray(testParse)) {
        parseType = 'allUserBehaviors'
        console.log('   📊 Detected array format - parsing as multiple users')
      } else {
        console.log('   👤 Detected object format - parsing as single user')
      }
    } catch {
      // Not valid JSON, will use LLM to determine
      console.log('   🤖 Natural language detected - will let AI determine format')
      // Only enhance input with product IDs if it's natural language (not valid JSON)
      inputToUse = `${userBehaviorInput}

AVAILABLE PRODUCT IDs TO USE: ${products.map(p => p.id).join(', ')}
(Use these IDs for viewedProducts, cartItems, and purchasedProducts arrays)`
    }
    
    let parsedUserBehavior: any
    if (parsedUserBehaviorFromClient) {
      console.log('   ℹ️  Using parsedUserBehavior provided by frontend (detection step)')
      parsedUserBehavior = parsedUserBehaviorFromClient
    } else {
      parsedUserBehavior = await parseWithFallback(inputToUse, parseType)
    }
    
    // Check if we got multiple users (array) or single user (object)
    if (Array.isArray(parsedUserBehavior)) {
      console.log(`\n📊 Multiple users detected: ${parsedUserBehavior.length} users`)
      
      // Find the target user
      if (targetUserId) {
        const targetUser = parsedUserBehavior.find(u => u.userId === targetUserId)
        if (!targetUser) {
          throw new Error(`Target user "${targetUserId}" not found in provided user behaviors`)
        }
        userBehavior = targetUser
        // All other users become the allUserBehaviors (need to normalize them too)
        allUserBehaviors = parsedUserBehavior
          .filter(u => u.userId !== targetUserId)
          .map(ub => ({
            userId: ub.userId || `user-${Math.random()}`,
            viewedProducts: Array.isArray(ub.viewedProducts) ? ub.viewedProducts : [],
            purchasedProducts: Array.isArray(ub.purchasedProducts) ? ub.purchasedProducts : [],
            cartItems: Array.isArray(ub.cartItems) ? ub.cartItems : [],
            searchQueries: Array.isArray(ub.searchQueries) ? ub.searchQueries : [],
            ratings: ub.ratings || {},
            productInteractions: ub.productInteractions,
            sessionDuration: ub.sessionDuration,
            deviceType: ub.deviceType,
            timeOfDay: ub.timeOfDay,
          }))
        console.log(`✅ Target user selected: ${targetUserId}`)
        console.log(`📊 Other users for collaborative filtering: ${allUserBehaviors.length}`)
      } else {
        // No target specified, use first user
        userBehavior = parsedUserBehavior[0]
        allUserBehaviors = parsedUserBehavior
          .slice(1)
          .map(ub => ({
            userId: ub.userId || `user-${Math.random()}`,
            viewedProducts: Array.isArray(ub.viewedProducts) ? ub.viewedProducts : [],
            purchasedProducts: Array.isArray(ub.purchasedProducts) ? ub.purchasedProducts : [],
            cartItems: Array.isArray(ub.cartItems) ? ub.cartItems : [],
            searchQueries: Array.isArray(ub.searchQueries) ? ub.searchQueries : [],
            ratings: ub.ratings || {},
            productInteractions: ub.productInteractions,
            sessionDuration: ub.sessionDuration,
            deviceType: ub.deviceType,
            timeOfDay: ub.timeOfDay,
          }))
        console.log(`⚠️ No target user specified, using first user: ${userBehavior.userId}`)
      }
    } else {
      // Single user object
      userBehavior = parsedUserBehavior
      console.log(`\n👤 Single user detected: ${userBehavior.userId}`)
    }
    
    // Log what LLM returned before normalization
    console.log('🔍 Raw LLM Output for main user:')
    console.log(`   Viewed: ${userBehavior.viewedProducts?.length || 0}`)
    console.log(`   Cart: ${userBehavior.cartItems?.length || 0}`)
    console.log(`   Purchased: ${userBehavior.purchasedProducts?.length || 0}`)
    
    // Normalize user behavior - preserve existing arrays, only add if missing
    userBehavior = {
      userId: userBehavior.userId || 'user1',
      viewedProducts: Array.isArray(userBehavior.viewedProducts) ? userBehavior.viewedProducts : [],
      purchasedProducts: Array.isArray(userBehavior.purchasedProducts) ? userBehavior.purchasedProducts : [],
      cartItems: Array.isArray(userBehavior.cartItems) ? userBehavior.cartItems : [],
      searchQueries: Array.isArray(userBehavior.searchQueries) ? userBehavior.searchQueries : [],
      ratings: userBehavior.ratings || {},
      productInteractions: userBehavior.productInteractions,
      sessionDuration: userBehavior.sessionDuration,
      deviceType: userBehavior.deviceType,
      timeOfDay: userBehavior.timeOfDay,
    }
    
    console.log('\n✅ User Behavior Generated:')
    console.log(`   User ID: ${userBehavior.userId}`)
    console.log(`   Viewed Products: ${userBehavior.viewedProducts?.length || 0} items`)
    console.log(`      IDs: ${userBehavior.viewedProducts?.join(', ') || 'none'}`)
    console.log(`   Purchased Products: ${userBehavior.purchasedProducts?.length || 0} items`)
    console.log(`      IDs: ${userBehavior.purchasedProducts?.join(', ') || 'none'}`)
    console.log(`   Cart Items: ${userBehavior.cartItems?.length || 0} items`)
    console.log(`      IDs: ${userBehavior.cartItems?.join(', ') || 'none'}`)
    
    if (userBehavior.productInteractions) {
      console.log(`   Product Interactions: ${Object.keys(userBehavior.productInteractions).length} products`)
      Object.entries(userBehavior.productInteractions).forEach(([prodId, interaction]) => {
        console.log(`      [${prodId}]:`)
        console.log(`         View Count: ${interaction.viewCount}, Duration: ${interaction.viewDuration}s`)
        if (interaction.cartActions) {
          console.log(`         Cart: Added ${interaction.cartActions.timesAddedToCart}x, Removed ${interaction.cartActions.timesRemovedFromCart}x`)
        }
        if (interaction.checkoutActions) {
          console.log(`         Checkout: ${interaction.checkoutActions.completedPurchase ? 'PURCHASED' : 'Not purchased'} (Count: ${interaction.checkoutActions.purchaseCount})`)
        }
        if (interaction.rating) {
          console.log(`         Rating: ${interaction.rating}/5 stars`)
        }
      })
    }
    
    console.log('\n📋 Full User Behavior Data:')
    console.log(JSON.stringify(userBehavior, null, 2))
    console.log('-'.repeat(100))

    // STEP 3: Parse All Users Behaviors (if provided and not already parsed from Step 2)
    if (allUserBehaviorsInput && !allUserBehaviors) {
      console.log('\n👥 STEP 3: GENERATING ALL USERS BEHAVIORS')
      console.log('-'.repeat(100))
      console.log('🔤 Raw All Users Input:')
      console.log(allUserBehaviorsInput.substring(0, 200) + (allUserBehaviorsInput.length > 200 ? '...' : ''))
      
      console.log('\n🤖 Parsing all users behaviors...')
      allUserBehaviors = await parseWithFallback(allUserBehaviorsInput, 'allUserBehaviors')
      
      // Normalize all user behaviors
      if (allUserBehaviors) {
        allUserBehaviors = allUserBehaviors.map(ub => ({
          userId: ub.userId || `user-${Math.random()}`,
          viewedProducts: ub.viewedProducts || [],
          purchasedProducts: ub.purchasedProducts || [],
          cartItems: ub.cartItems || [],
          searchQueries: ub.searchQueries || [],
          ratings: ub.ratings || {},
          productInteractions: ub.productInteractions,
          sessionDuration: ub.sessionDuration,
          deviceType: ub.deviceType,
          timeOfDay: ub.timeOfDay,
        }))
        
        console.log(`\n✅ All Users Behaviors Generated: ${allUserBehaviors.length} users`)
        allUserBehaviors.forEach((ub, i) => {
          console.log(`   ${i + 1}. User: ${ub.userId}`)
          console.log(`      Viewed: ${ub.viewedProducts?.length || 0}, Purchased: ${ub.purchasedProducts?.length || 0}, Cart: ${ub.cartItems?.length || 0}`)
        })
        
        console.log('\n📋 Full All Users Data:')
        console.log(JSON.stringify(allUserBehaviors, null, 2))
      }
      console.log('-'.repeat(100))
    }

    // STEP 4: Validate Data
    console.log('\n✅ STEP 4: DATA VALIDATION')
    console.log('-'.repeat(100))
    
    // Validate product IDs in user behavior
    const productIds = products.map(p => p.id)
    const validateIds = (ids: string[] | undefined, label: string) => {
      if (!ids) return { valid: [], invalid: [] }
      const valid = ids.filter(id => productIds.includes(id))
      const invalid = ids.filter(id => !productIds.includes(id))
      console.log(`   ${label}:`)
      console.log(`      Valid: ${valid.length}/${ids.length} [${valid.join(', ')}]`)
      if (invalid.length > 0) {
        console.log(`      ⚠️ Invalid: ${invalid.length} [${invalid.join(', ')}]`)
      }
      return { valid, invalid }
    }
    
    validateIds(userBehavior.viewedProducts, 'Viewed Products')
    validateIds(userBehavior.purchasedProducts, 'Purchased Products')
    validateIds(userBehavior.cartItems, 'Cart Items')
    
    if (userBehavior.productInteractions) {
      const interactionIds = Object.keys(userBehavior.productInteractions)
      validateIds(interactionIds, 'Product Interactions')
    }
    
    console.log('\n✅ Data Validation Complete!')
    console.log('-'.repeat(100))

    // STEP 5: Generate Recommendations using Hybrid Algorithm
    console.log('\n🎯 STEP 5: GENERATING RECOMMENDATIONS WITH HYBRID ALGORITHM')
    console.log('-'.repeat(100))
    console.log(`📊 Processing for user: ${userBehavior.userId}`)
    console.log(`   🎯 Target User: ${userBehavior.userId}`)
    console.log(`   📝 Target User Data:`)
    console.log(`      - Viewed: ${userBehavior.viewedProducts?.length || 0} products`)
    console.log(`      - Cart: ${userBehavior.cartItems?.length || 0} items`)
    console.log(`      - Purchased: ${userBehavior.purchasedProducts?.length || 0} items`)
    
    if (allUserBehaviors && allUserBehaviors.length > 0) {
      console.log(`   🤝 Collaborative filtering enabled with ${allUserBehaviors.length} other users:`)
      allUserBehaviors.forEach((ub, i) => {
        console.log(`      ${i + 1}. ${ub.userId} - Viewed: ${ub.viewedProducts?.length || 0}, Cart: ${ub.cartItems?.length || 0}, Purchased: ${ub.purchasedProducts?.length || 0}`)
      })
    } else {
      console.log(`   👤 Single user mode (no collaborative data)`)
    }
    console.log('\n🔄 Running recommendation algorithms...')
    
    const recommendationScores = generateRecommendations(products, userBehavior, 10, allUserBehaviors)
    
    console.log(`\n✅ Generated ${recommendationScores.length} recommendations`)
    console.log('\n📊 Score Breakdown:')
    recommendationScores.forEach((rec, i) => {
      const product = products.find(p => p.id === rec.productId)
      console.log(`   ${i + 1}. ${product?.name} (${rec.productId})`)
      console.log(`      Final Score: ${(rec.score * 100).toFixed(2)}%`)
      console.log(`      Breakdown:`)
      console.log(`         - Collaborative: ${(rec.breakdown.collaborative * 100).toFixed(2)}%`)
      console.log(`         - Content-Based: ${(rec.breakdown.contentBased * 100).toFixed(2)}%`)
      console.log(`         - Context-Aware: ${(rec.breakdown.contextAware * 100).toFixed(2)}%`)
      if (rec.breakdown.userBased !== undefined) {
        console.log(`         - User-Based: ${(rec.breakdown.userBased * 100).toFixed(2)}%`)
      }
      if (rec.breakdown.categoryPopularity !== undefined) {
        console.log(`         - Category Popularity: ${(rec.breakdown.categoryPopularity * 100).toFixed(2)}%`)
      }
    })
    console.log('-'.repeat(100))

    // STEP 6: Generate LLM Explanations
    console.log('\n💡 STEP 6: GENERATING LLM EXPLANATIONS FOR RECOMMENDATIONS')
    console.log('-'.repeat(100))
    
    const recommendations: Recommendation[] = await Promise.all(
      recommendationScores.map(async ({ productId, score, breakdown }, index) => {
        const product = products.find(p => p.id === productId)!
        
        console.log(`\n🤖 Generating explanation ${index + 1}/${recommendationScores.length} for: ${product.name}`)
        
        const explanation = await generateRecommendationExplanation(
          product,
          userBehavior,
          breakdown
        )
        
        console.log(`   ✅ Explanation: ${explanation}`)

        // Determine recommendation type based on highest score
        let recommendationType: 'collaborative' | 'content-based' | 'trending' | 'hybrid' = 'hybrid'
        if (breakdown.collaborative > breakdown.contentBased && breakdown.collaborative > breakdown.contextAware) {
          recommendationType = 'collaborative'
        } else if (breakdown.contentBased > breakdown.collaborative && breakdown.contentBased > breakdown.contextAware) {
          recommendationType = 'content-based'
        } else if (breakdown.contextAware > breakdown.collaborative && breakdown.contextAware > breakdown.contentBased) {
          recommendationType = 'trending'
        }

        return {
          productId,
          product,
          score,
          explanation,
          recommendationType,
        }
      })
    )
    
    console.log('\n✅ All explanations generated!')
    console.log('-'.repeat(100))

    // STEP 7: Final Recommendations Output
    console.log('\n🎯 STEP 7: FINAL RECOMMENDATIONS OUTPUT')
    console.log('='.repeat(100))
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.product.name} (${rec.product.category})`)
      console.log(`   ID: ${rec.productId}`)
      console.log(`   Price: $${rec.product.price}`)
      console.log(`   Score: ${(rec.score * 100).toFixed(1)}%`)
      console.log(`   Type: ${rec.recommendationType.toUpperCase()}`)
      console.log(`   Tags: ${rec.product.tags?.join(', ') || 'none'}`)
      console.log(`   💡 ${rec.explanation}`)
    })
    console.log('\n' + '='.repeat(100))

    // STEP 8: Cart Summary
    const cartItems = products.filter(p => userBehavior.cartItems?.includes(p.id))
    console.log('\n🛒 STEP 8: CART SUMMARY')
    console.log('='.repeat(100))
    if (cartItems.length > 0) {
      cartItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - $${item.price} (ID: ${item.id})`)
      })
      console.log(`\n📊 Total Items in Cart: ${cartItems.length}`)
      console.log(`💰 Total Cart Value: $${cartItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}`)
    } else {
      console.log('❌ No items in cart')
    }
    console.log('='.repeat(100))
    
    console.log('\n✅ RECOMMENDATION ENGINE - PROCESSING COMPLETE')
    console.log('='.repeat(100) + '\n')

    // Final verification before sending response
    console.log('\n📤 PREPARING API RESPONSE:')
    console.log('='.repeat(100))
    console.log(`   Recommendations: ${recommendations.length}`)
    console.log(`   Products: ${products.length}`)
    console.log(`   User Behavior:`)
    console.log(`      User ID: ${userBehavior.userId}`)
    console.log(`      Viewed Products: ${userBehavior.viewedProducts?.length || 0} [${userBehavior.viewedProducts?.join(', ') || 'none'}]`)
    console.log(`      Cart Items: ${userBehavior.cartItems?.length || 0} [${userBehavior.cartItems?.join(', ') || 'none'}]`)
    console.log(`      Purchased Products: ${userBehavior.purchasedProducts?.length || 0} [${userBehavior.purchasedProducts?.join(', ') || 'none'}]`)
    console.log('='.repeat(100) + '\n')

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        products,
        userBehavior,
        userId: userBehavior.userId,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Recommendation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate recommendations',
      },
      { status: 500 }
    )
  }
}
