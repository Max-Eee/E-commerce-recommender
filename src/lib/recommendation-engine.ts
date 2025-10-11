import { Product, UserBehavior, Recommendation, ProductInteraction } from '../types/recommendation'

/**
 * Calculate engagement score for a product interaction
 */
function calculateEngagementScore(interaction: ProductInteraction): number {
  let score = 0
  
  // View duration (normalize to 0-1 scale, 60 seconds = full score)
  if (interaction.viewDuration) {
    score += Math.min(interaction.viewDuration / 60, 1) * 0.3
  }
  
  // View count (multiple views show interest)
  if (interaction.viewCount) {
    score += Math.min(interaction.viewCount / 5, 1) * 0.2
  }
  
  // Product interactions (each action shows engagement)
  if (interaction.interactions) {
    const interactionCount = Object.values(interaction.interactions).filter(Boolean).length
    score += (interactionCount / 5) * 0.3 // max 5 interaction types
  }
  
  // Cart actions (strong purchase intent signal)
  if (interaction.cartActions) {
    const { addedToCart, removedFromCart, timesAddedToCart = 0, timesRemovedFromCart = 0 } = interaction.cartActions
    
    // Positive: adding to cart
    if (addedToCart) score += 0.5
    score += Math.min(timesAddedToCart * 0.2, 0.6)
    
    // Negative: removing from cart (shows disinterest)
    if (removedFromCart) score -= 0.3
    score -= Math.min(timesRemovedFromCart * 0.15, 0.4)
  }
  
  // Checkout actions (very strong signals)
  if (interaction.checkoutActions) {
    const { proceededToCheckout, completedPurchase, purchaseCount = 0 } = interaction.checkoutActions
    
    if (proceededToCheckout) score += 0.7
    if (completedPurchase) score += 1.5
    
    // Repeat purchases are extremely valuable
    score += Math.min(purchaseCount * 0.5, 2.0)
  }
  
  // Rating (explicit feedback)
  if (interaction.rating) {
    score += (interaction.rating / 5) * 0.4
  }
  
  // Recency bonus (recent interactions are more relevant)
  if (interaction.timestamp) {
    const daysSinceInteraction = (Date.now() - interaction.timestamp) / (1000 * 60 * 60 * 24)
    const recencyBonus = Math.max(0, 1 - daysSinceInteraction / 30) * 0.3 // decay over 30 days
    score += recencyBonus
  }
  
  return Math.max(0, score) // ensure non-negative
}

/**
 * Get user interaction map with legacy support
 */
function getUserInteractionMap(userBehavior: UserBehavior): Map<string, ProductInteraction> {
  const interactionMap = new Map<string, ProductInteraction>()
  
  // Use enhanced interactions if available
  if (userBehavior.productInteractions) {
    Object.entries(userBehavior.productInteractions).forEach(([productId, interaction]) => {
      interactionMap.set(productId, interaction)
    })
  }
  
  // Legacy support: convert old format to new
  userBehavior.viewedProducts?.forEach(productId => {
    if (!interactionMap.has(productId)) {
      interactionMap.set(productId, { productId, viewCount: 1 })
    }
  })
  
  userBehavior.purchasedProducts?.forEach(productId => {
    const existing = interactionMap.get(productId) || { productId }
    interactionMap.set(productId, {
      ...existing,
      checkoutActions: {
        ...existing.checkoutActions,
        completedPurchase: true,
        purchaseCount: (existing.checkoutActions?.purchaseCount || 0) + 1
      }
    })
  })
  
  userBehavior.cartItems?.forEach(productId => {
    const existing = interactionMap.get(productId) || { productId }
    interactionMap.set(productId, {
      ...existing,
      cartActions: {
        ...existing.cartActions,
        addedToCart: Date.now(),
        timesAddedToCart: (existing.cartActions?.timesAddedToCart || 0) + 1
      }
    })
  })
  
  // Legacy ratings
  if (userBehavior.ratings) {
    Object.entries(userBehavior.ratings).forEach(([productId, rating]) => {
      const existing = interactionMap.get(productId) || { productId }
      interactionMap.set(productId, { ...existing, rating })
    })
  }
  
  return interactionMap
}

/**
 * User-Based Collaborative Filtering
 * Find similar users and recommend what they liked
 */
export function userBasedCollaborativeFiltering(
  products: Product[],
  currentUserBehavior: UserBehavior,
  allUserBehaviors: UserBehavior[]
): Map<string, number> {
  const scores = new Map<string, number>()
  
  if (!allUserBehaviors || allUserBehaviors.length === 0) {
    return scores
  }

  const currentUserInteractions = getUserInteractionMap(currentUserBehavior)
  const currentUserId = currentUserBehavior.userId
  
  // Build category interest profile for current user
  const currentUserCategoryInterests = new Map<string, number>()
  currentUserInteractions.forEach((interaction, productId) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      const engagement = calculateEngagementScore(interaction)
      const current = currentUserCategoryInterests.get(product.category) || 0
      currentUserCategoryInterests.set(product.category, current + engagement)
    }
  })

  // Calculate similarity with each user
  const userSimilarities: Array<{ userId: string; similarity: number; behavior: UserBehavior }> = []
  
  allUserBehaviors.forEach(otherUserBehavior => {
    if (otherUserBehavior.userId === currentUserId) return
    
    const otherUserInteractions = getUserInteractionMap(otherUserBehavior)
    let similarity = 0
    let commonProducts = 0
    
    // Calculate overlap in product interactions
    currentUserInteractions.forEach((currentInteraction, productId) => {
      const otherInteraction = otherUserInteractions.get(productId)
      if (otherInteraction) {
        commonProducts++
        const currentEngagement = calculateEngagementScore(currentInteraction)
        const otherEngagement = calculateEngagementScore(otherInteraction)
        // Higher similarity if both users have similar engagement levels
        similarity += Math.min(currentEngagement, otherEngagement)
      }
    })
    
    // Calculate category interest overlap
    const otherUserCategoryInterests = new Map<string, number>()
    otherUserInteractions.forEach((interaction, productId) => {
      const product = products.find(p => p.id === productId)
      if (product) {
        const engagement = calculateEngagementScore(interaction)
        const current = otherUserCategoryInterests.get(product.category) || 0
        otherUserCategoryInterests.set(product.category, current + engagement)
      }
    })
    
    // Calculate category similarity
    let categorySimilarity = 0
    let totalCategories = 0
    currentUserCategoryInterests.forEach((interest, category) => {
      const otherInterest = otherUserCategoryInterests.get(category) || 0
      if (otherInterest > 0) {
        categorySimilarity += Math.min(interest, otherInterest) / Math.max(interest, otherInterest)
        totalCategories++
      }
    })
    
    if (totalCategories > 0) {
      similarity += (categorySimilarity / totalCategories) * 2 // Category similarity is important
    }
    
    // Boost similarity if there are common products
    if (commonProducts > 0) {
      similarity *= (1 + Math.log(commonProducts + 1))
    }
    
    if (similarity > 0) {
      userSimilarities.push({
        userId: otherUserBehavior.userId,
        similarity,
        behavior: otherUserBehavior
      })
    }
  })
  
  // Sort by similarity and take top similar users
  userSimilarities.sort((a, b) => b.similarity - a.similarity)
  const topSimilarUsers = userSimilarities.slice(0, 10)
  
  // Recommend products that similar users liked but current user hasn't interacted with
  const productPopularity = new Map<string, { score: number; count: number }>()
  
  topSimilarUsers.forEach(({ similarity, behavior }) => {
    const otherUserInteractions = getUserInteractionMap(behavior)
    
    otherUserInteractions.forEach((interaction, productId) => {
      // Skip if current user already interacted with this product
      if (currentUserInteractions.has(productId)) return
      
      const engagement = calculateEngagementScore(interaction)
      const weightedScore = engagement * similarity
      
      const existing = productPopularity.get(productId) || { score: 0, count: 0 }
      productPopularity.set(productId, {
        score: existing.score + weightedScore,
        count: existing.count + 1
      })
    })
  })
  
  // Calculate final scores with popularity boost
  productPopularity.forEach((data, productId) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      // Average score weighted by number of similar users who liked it
      const avgScore = data.score / topSimilarUsers.length
      const popularityBoost = Math.log(data.count + 1) * 0.2
      scores.set(productId, avgScore + popularityBoost)
    }
  })
  
  return scores
}

/**
 * Category Popularity Score
 * Boost popular items within categories the user is interested in
 */
export function categoryPopularityScore(
  products: Product[],
  currentUserBehavior: UserBehavior,
  allUserBehaviors: UserBehavior[]
): Map<string, number> {
  const scores = new Map<string, number>()
  
  if (!allUserBehaviors || allUserBehaviors.length === 0) {
    return scores
  }

  const currentUserInteractions = getUserInteractionMap(currentUserBehavior)
  
  // Identify categories current user is interested in
  const userCategoryInterest = new Map<string, number>()
  currentUserInteractions.forEach((interaction, productId) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      const engagement = calculateEngagementScore(interaction)
      const current = userCategoryInterest.get(product.category) || 0
      userCategoryInterest.set(product.category, current + engagement)
    }
  })
  
  // Calculate product popularity across all users per category
  const categoryProductPopularity = new Map<string, Map<string, number>>()
  
  allUserBehaviors.forEach(userBehavior => {
    const userInteractions = getUserInteractionMap(userBehavior)
    
    userInteractions.forEach((interaction, productId) => {
      const product = products.find(p => p.id === productId)
      if (product) {
        const engagement = calculateEngagementScore(interaction)
        
        if (!categoryProductPopularity.has(product.category)) {
          categoryProductPopularity.set(product.category, new Map())
        }
        
        const categoryMap = categoryProductPopularity.get(product.category)!
        const currentScore = categoryMap.get(productId) || 0
        categoryMap.set(productId, currentScore + engagement)
      }
    })
  })
  
  // Score products based on popularity in user's interested categories
  products.forEach(product => {
    if (currentUserInteractions.has(product.id)) return
    
    const categoryInterest = userCategoryInterest.get(product.category) || 0
    if (categoryInterest > 0) {
      const categoryMap = categoryProductPopularity.get(product.category)
      if (categoryMap) {
        const popularity = categoryMap.get(product.id) || 0
        // Normalize by number of users
        const normalizedPopularity = popularity / allUserBehaviors.length
        // Weight by user's interest in this category
        const score = normalizedPopularity * Math.min(categoryInterest, 1.0)
        scores.set(product.id, score)
      }
    }
  })
  
  return scores
}

/**
 * Collaborative Filtering - Enhanced with engagement scoring
 */
export function collaborativeFiltering(
  products: Product[],
  userBehavior: UserBehavior,
  allUserBehaviors?: UserBehavior[]
): Map<string, number> {
  const scores = new Map<string, number>()
  const userInteractions = getUserInteractionMap(userBehavior)
  
  // Calculate user's preference profile
  const categoryPreferences = new Map<string, number>()
  const priceRange = { min: Infinity, max: 0, avg: 0, count: 0 }
  
  userInteractions.forEach((interaction, productId) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      const engagementScore = calculateEngagementScore(interaction)
      
      // Build category preferences
      const currentScore = categoryPreferences.get(product.category) || 0
      categoryPreferences.set(product.category, currentScore + engagementScore)
      
      // Build price preferences (weighted by engagement)
      priceRange.min = Math.min(priceRange.min, product.price)
      priceRange.max = Math.max(priceRange.max, product.price)
      priceRange.avg += product.price * engagementScore
      priceRange.count += engagementScore
    }
  })
  
  if (priceRange.count > 0) {
    priceRange.avg /= priceRange.count
  }
  
  // Score products based on similarity to user preferences
  products.forEach((product) => {
    if (!userInteractions.has(product.id)) {
      let score = 0
      
      // Category preference score
      const categoryScore = categoryPreferences.get(product.category) || 0
      score += categoryScore * 0.4
      
      // Price similarity score
      if (priceRange.count > 0) {
        const priceDiff = Math.abs(product.price - priceRange.avg)
        const priceScore = 1 / (1 + priceDiff / priceRange.avg)
        score += priceScore * 0.3
      }
      
      // Find similar products user has interacted with
      let maxSimilarity = 0
      userInteractions.forEach((interaction, interactedProductId) => {
        const interactedProduct = products.find(p => p.id === interactedProductId)
        if (interactedProduct) {
          const engagementScore = calculateEngagementScore(interaction)
          
          let similarity = 0
          if (product.category === interactedProduct.category) similarity += 0.5
          
          // Tag overlap
          if (product.tags && interactedProduct.tags) {
            const commonTags = product.tags.filter(tag => interactedProduct.tags?.includes(tag))
            similarity += commonTags.length * 0.1
          }
          
          similarity *= engagementScore
          maxSimilarity = Math.max(maxSimilarity, similarity)
        }
      })
      
      score += maxSimilarity * 0.3
      scores.set(product.id, score)
    }
  })

  return scores
}

/**
 * Content-Based Filtering - Enhanced with engagement scoring
 */
export function contentBasedFiltering(
  products: Product[],
  userBehavior: UserBehavior
): Map<string, number> {
  const scores = new Map<string, number>()
  const userInteractions = getUserInteractionMap(userBehavior)
  
  if (userInteractions.size === 0) {
    return scores
  }

  // Get products user has interacted with, weighted by engagement
  const interactedProducts = Array.from(userInteractions.entries())
    .map(([productId, interaction]) => ({
      product: products.find(p => p.id === productId),
      engagement: calculateEngagementScore(interaction)
    }))
    .filter(item => item.product !== undefined)

  // Calculate similarity scores
  products.forEach((product) => {
    if (!userInteractions.has(product.id)) {
      let totalSimilarity = 0
      let totalWeight = 0
      
      interactedProducts.forEach(({ product: interactedProduct, engagement }) => {
        if (!interactedProduct) return
        
        let similarity = 0
        
        // Category match (strong signal)
        if (product.category === interactedProduct.category) {
          similarity += 0.5
        }
        
        // Tag overlap
        if (product.tags && interactedProduct.tags) {
          const commonTags = product.tags.filter(tag => 
            interactedProduct.tags?.includes(tag)
          )
          similarity += commonTags.length * 0.15
        }
        
        // Price similarity
        const priceDiff = Math.abs(product.price - interactedProduct.price)
        const priceRatio = Math.min(product.price, interactedProduct.price) / 
                          Math.max(product.price, interactedProduct.price)
        similarity += priceRatio * 0.25
        
        // Description similarity (simple keyword matching)
        if (product.description && interactedProduct.description) {
          const productWords = new Set(product.description.toLowerCase().split(/\s+/))
          const interactedWords = new Set(interactedProduct.description.toLowerCase().split(/\s+/))
          const commonWords = Array.from(productWords).filter(word => 
            interactedWords.has(word) && word.length > 3
          )
          similarity += commonWords.length * 0.05
        }
        
        // Weight by engagement score
        totalSimilarity += similarity * engagement
        totalWeight += engagement
      })
      
      if (totalWeight > 0) {
        scores.set(product.id, totalSimilarity / totalWeight)
      }
    }
  })

  return scores
}

/**
 * Context-Aware Rules - Enhanced with behavioral signals
 */
export function contextAwareRules(
  products: Product[],
  userBehavior: UserBehavior
): Map<string, number> {
  const scores = new Map<string, number>()
  const userInteractions = getUserInteractionMap(userBehavior)

  // Analyze user context
  const contextFactors = {
    hasCheckoutBehavior: false,
    hasHighEngagement: false,
    avgPrice: 0,
    priceCount: 0
  }
  
  userInteractions.forEach((interaction) => {
    if (interaction.checkoutActions?.proceededToCheckout) {
      contextFactors.hasCheckoutBehavior = true
    }
    
    const engagement = calculateEngagementScore(interaction)
    if (engagement > 1.0) {
      contextFactors.hasHighEngagement = true
    }
    
    const product = products.find(p => p.id === interaction.productId)
    if (product) {
      contextFactors.avgPrice += product.price * engagement
      contextFactors.priceCount += engagement
    }
  })
  
  if (contextFactors.priceCount > 0) {
    contextFactors.avgPrice /= contextFactors.priceCount
  }

  products.forEach((product) => {
    if (!userInteractions.has(product.id)) {
      let score = 0
      
      // Price-based scoring (match user's price range)
      if (contextFactors.priceCount > 0) {
        const priceDiff = Math.abs(product.price - contextFactors.avgPrice)
        const priceScore = 1 / (1 + priceDiff / contextFactors.avgPrice)
        score += priceScore * 0.3
      }
      
      // Premium product boost for high-engagement users
      if (contextFactors.hasHighEngagement && product.price > 100) {
        score += 0.25
      }
      
      // Boost products in checkout price range
      if (contextFactors.hasCheckoutBehavior) {
        if (product.price >= contextFactors.avgPrice * 0.8 && 
            product.price <= contextFactors.avgPrice * 1.2) {
          score += 0.3
        }
      }
      
      // Time-based contextual boost
      if (userBehavior.timeOfDay) {
        // Evening users might be more willing to browse premium items
        if (userBehavior.timeOfDay === 'evening' && product.price > 100) {
          score += 0.15
        }
      }
      
      // Device-based adjustments
      if (userBehavior.deviceType === 'mobile') {
        // Mobile users might prefer mid-range products
        if (product.price >= 20 && product.price <= 100) {
          score += 0.1
        }
      }
      
      // Ratings boost (if available)
      if (userBehavior.ratings && userBehavior.ratings[product.id]) {
        score += userBehavior.ratings[product.id] * 0.15
      }
      
      // Random trending factor (normalized)
      score += Math.random() * 0.2
      
      scores.set(product.id, score)
    }
  })

  return scores
}

/**
 * Hybrid Recommendation Engine
 * Combines all three approaches with weighted scoring
 */
export function generateRecommendations(
  products: Product[],
  userBehavior: UserBehavior,
  topN: number = 10,
  allUserBehaviors?: UserBehavior[]
): { productId: string; score: number; breakdown: any }[] {
  // Get scores from each method
  const collaborativeScores = collaborativeFiltering(products, userBehavior, allUserBehaviors)
  const contentScores = contentBasedFiltering(products, userBehavior)
  const contextScores = contextAwareRules(products, userBehavior)
  
  // Get user-based collaborative filtering scores if we have multiple users
  let userBasedScores = new Map<string, number>()
  let categoryPopularityScores = new Map<string, number>()
  
  if (allUserBehaviors && allUserBehaviors.length > 1) {
    userBasedScores = userBasedCollaborativeFiltering(products, userBehavior, allUserBehaviors)
    categoryPopularityScores = categoryPopularityScore(products, userBehavior, allUserBehaviors)
  }

  // Combine with weights
  // If we have multiple users: User-Based (25%), Collaborative (20%), Content (20%), Context (20%), Popularity (15%)
  // If single user: Collaborative (40%), Content (30%), Context (30%)
  const finalScores = new Map<string, number>()
  const scoreBreakdown = new Map<string, any>()

  const hasMultipleUsers = allUserBehaviors && allUserBehaviors.length > 1

  products.forEach((product) => {
    const collabScore = collaborativeScores.get(product.id) || 0
    const contentScore = contentScores.get(product.id) || 0
    const contextScore = contextScores.get(product.id) || 0
    const userBasedScore = userBasedScores.get(product.id) || 0
    const popularityScore = categoryPopularityScores.get(product.id) || 0

    let finalScore: number
    
    if (hasMultipleUsers) {
      finalScore = 
        userBasedScore * 0.25 +
        collabScore * 0.20 + 
        contentScore * 0.20 + 
        contextScore * 0.20 +
        popularityScore * 0.15
    } else {
      finalScore = 
        collabScore * 0.4 + 
        contentScore * 0.3 + 
        contextScore * 0.3
    }

    if (finalScore > 0) {
      finalScores.set(product.id, finalScore)
      scoreBreakdown.set(product.id, {
        collaborative: collabScore,
        contentBased: contentScore,
        contextAware: contextScore,
        userBased: userBasedScore,
        categoryPopularity: popularityScore,
        final: finalScore,
      })
    }
  })

  // Sort and get top N
  const sortedRecommendations = Array.from(finalScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([productId, score]) => ({
      productId,
      score,
      breakdown: scoreBreakdown.get(productId),
    }))

  return sortedRecommendations
}
