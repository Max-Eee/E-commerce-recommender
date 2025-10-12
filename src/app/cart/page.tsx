import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import RecommendationCart from "@modules/cart/components/recommendation-cart"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function Cart() {
  // In mock mode, we use recommendation-based cart
  const useMockMode = !process.env.MEDUSA_BACKEND_URL

  if (useMockMode) {
    return <RecommendationCart />
  }

  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return <CartTemplate cart={cart} customer={customer} />
}
