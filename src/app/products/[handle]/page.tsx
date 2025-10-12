import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getDefaultRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"

type Props = {
  params: Promise<{ handle: string }>
}

export async function generateStaticParams() {
  try {
    const { response } = await listProducts({
      queryParams: { limit: 100, fields: "handle" },
    })

    return response.products.map((product) => ({
      handle: product.handle,
    }))
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getDefaultRegion()

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    queryParams: { handle } as any,
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | The E-Commerce Store`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | The E-Commerce Store`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getDefaultRegion()

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    queryParams: { handle: params.handle } as any,
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
    />
  )
}
