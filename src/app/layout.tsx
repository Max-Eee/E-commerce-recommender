import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { Toaster } from "@medusajs/ui"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <main className="relative">
          <Nav />
          {props.children}
          <Footer />
          <Toaster />
        </main>
      </body>
    </html>
  )
}
