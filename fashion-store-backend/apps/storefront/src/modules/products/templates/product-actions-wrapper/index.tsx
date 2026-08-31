import { listProducts } from "@lib/data/products"
import { retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const [product, cart] = await Promise.all([
    listProducts({
      queryParams: {
        id: [id],
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,*variants,*variants.options,*variants.images,*options,*options.values,*images",
      },
      regionId: region.id,
    }).then(({ response }) => response.products[0]),

    retrieveCart(
      undefined,
      "*items,*items.variant"
    ),
  ])

  if (!product) {
    return null
  }

  const cartVariantQuantities: Record<string, number> = {}

  for (const item of cart?.items ?? []) {
    if (!item.variant_id) continue

    cartVariantQuantities[item.variant_id] =
      (cartVariantQuantities[item.variant_id] ?? 0) +
      (item.quantity ?? 0)
  }

  return (
    <ProductActions
      product={product}
      region={region}
      cartVariantQuantities={cartVariantQuantities}
    />
  )
}
