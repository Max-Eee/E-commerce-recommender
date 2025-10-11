"use client"

import { Button, Heading, toast } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const handleCheckout = () => {
    toast.info("This is a mock website. Checkout functionality is not implemented.", {
      duration: 4000,
    })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      <Divider />
      <CartTotals totals={cart} />
      <Button 
        className="w-full h-10" 
        onClick={handleCheckout}
        data-testid="checkout-button"
      >
        Go to checkout
      </Button>
    </div>
  )
}

export default Summary
