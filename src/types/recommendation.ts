export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  attributes?: Record<string, any>
  image?: string
  tags?: string[]
}

export interface ProductInteraction {
  productId: string
  viewDuration?: number // in seconds
  viewCount?: number // number of times viewed
  interactions?: {
    sizeSelected?: boolean
    colorSelected?: boolean
    imageZoomed?: boolean
    descriptionRead?: boolean
    reviewsRead?: boolean
  }
  cartActions?: {
    addedToCart?: number // timestamp
    removedFromCart?: number // timestamp (negative signal)
    timesAddedToCart?: number // how many times added
    timesRemovedFromCart?: number // how many times removed
  }
  checkoutActions?: {
    proceededToCheckout?: boolean
    completedPurchase?: boolean
    purchaseCount?: number // how many times purchased
    lastPurchaseDate?: number // timestamp
  }
  rating?: number // 1-5 stars
  timestamp?: number
}

export interface UserBehavior {
  userId: string
  viewedProducts: string[] // Legacy support
  purchasedProducts: string[] // Legacy support
  cartItems: string[] // Legacy support
  searchQueries?: string[]
  ratings?: Record<string, number> // Legacy support
  
  // Enhanced behavior tracking
  productInteractions?: Record<string, ProductInteraction>
  sessionDuration?: number // total session time in seconds
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  location?: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
}

export interface Recommendation {
  productId: string
  product: Product
  score: number
  explanation: string
  recommendationType: 'collaborative' | 'content-based' | 'trending' | 'hybrid'
}

export interface RecommendationInput {
  products: Product[]
  userBehavior: UserBehavior
  allUserBehaviors?: UserBehavior[] // For collaborative filtering across users
  currentUserId?: string // The user for whom recommendations are being generated
}

export interface RecommendationResult {
  recommendations: Recommendation[]
  userId: string
  timestamp: string
}

