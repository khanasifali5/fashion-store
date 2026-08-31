import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

type StyleWithProductsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const parseProductIds = (
  value: unknown
): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value.filter(
          (item): item is string =>
            typeof item === "string" &&
            Boolean(item.trim())
        )
      )
    )
  }

  if (typeof value === "string") {
    const trimmed = value.trim()

    if (!trimmed) {
      return []
    }

    try {
      const parsed = JSON.parse(trimmed)

      if (Array.isArray(parsed)) {
        return parseProductIds(parsed)
      }
    } catch {
      // Comma-separated metadata is also supported.
    }

    return Array.from(
      new Set(
        trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )
  }

  return []
}

export default async function StyleWithProducts({
  product,
  region,
  countryCode,
}: StyleWithProductsProps) {
  /*
   * Preferred / premium source:
   * manually curated IDs saved in product metadata.
   *
   * Supported metadata keys:
   * - style_with_product_ids
   * - showcase_style_with_product_ids
   *
   * Value can be:
   * ["prod_1", "prod_2"]
   * or
   * "prod_1,prod_2"
   */
  const configuredIds = parseProductIds(
    product.metadata?.style_with_product_ids ??
      product.metadata?.showcase_style_with_product_ids
  ).filter((id) => id !== product.id)

  let products: HttpTypes.StoreProduct[] = []

  if (configuredIds.length) {
    const result = await listProducts({
      countryCode,
      queryParams: {
        id: configuredIds,
        limit: Math.min(
          Math.max(configuredIds.length, 4),
          12
        ),
      },
    })

    const byId = new Map(
      result.response.products.map((item) => [
        item.id,
        item,
      ])
    )

    products = configuredIds
      .map((id) => byId.get(id))
      .filter(
        (
          item
        ): item is HttpTypes.StoreProduct =>
          Boolean(item)
      )
  }

  /*
   * Automatic fallback:
   * same collection usually works well for "Style With"
   * because a collection can contain clothing, bags,
   * footwear, etc. rather than only near-identical items.
   */
  if (!products.length) {
    const collectionId =
      product.collection?.id ??
      product.collection_id

    if (collectionId) {
      const result = await listProducts({
        countryCode,
        queryParams: {
          collection_id: [collectionId],
          limit: 10,
        },
      })

      products =
        result.response.products.filter(
          (item) => item.id !== product.id
        )
    }
  }

  /*
   * Shared tags are the second fallback.
   */
  if (!products.length && product.tags?.length) {
    const tagIds = product.tags
      .map((tag) => tag.id)
      .filter(
        (id): id is string => Boolean(id)
      )

    if (tagIds.length) {
      const result = await listProducts({
        countryCode,
        queryParams: {
          tag_id: tagIds,
          limit: 10,
        },
      })

      products =
        result.response.products.filter(
          (item) => item.id !== product.id
        )
    }
  }

  const visibleProducts = products.slice(0, 4)

  if (!visibleProducts.length) {
    return null
  }

  return (
    <section
      className="mt-14"
      aria-labelledby="style-with-title"
      style={{
        fontFamily:
          '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <h2
        id="style-with-title"
        className="mb-5 text-[12px] font-normal leading-5 text-black"
      >
        Style With
      </h2>

      <ul
        className="
          grid
          grid-cols-2
          gap-x-5
          gap-y-10
        "
      >
        {visibleProducts.map((item) => (
          <li
            key={item.id}
            className="min-w-0"
          >
            <ProductPreview
              product={item}
              region={region}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
