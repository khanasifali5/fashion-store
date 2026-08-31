import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { cookies } from "next/headers"

import RecentlyViewedTracker from "./tracker"

const COOKIE_KEY =
  "safafi_recently_viewed_product_ids_v1"

const MAX_STORED_PRODUCTS = 12
const MAX_VISIBLE_PRODUCTS = 4

const parseIds = (
  value?: string | null
): string[] => {
  if (!value) {
    return []
  }

  try {
    const decoded =
      decodeURIComponent(value)

    const parsed =
      JSON.parse(decoded)

    if (!Array.isArray(parsed)) {
      return []
    }

    return Array.from(
      new Set(
        parsed.filter(
          (item): item is string =>
            typeof item === "string" &&
            Boolean(item.trim())
        )
      )
    ).slice(
      0,
      MAX_STORED_PRODUCTS
    )
  } catch {
    return []
  }
}

type RecentlyViewedProductsProps = {
  currentProductId: string
  region: HttpTypes.StoreRegion
  countryCode: string
}

export default async function RecentlyViewedProducts({
  currentProductId,
  region,
  countryCode,
}: RecentlyViewedProductsProps) {
  /*
   * Cookie stores IDs only.
   *
   * We intentionally fetch complete products again instead of storing
   * title/image/price snapshots. That lets Recently Viewed render the
   * EXACT same ProductPreview used by category and recommendation grids:
   *
   * - configured cropped color swatches
   * - variant-specific image galleries
   * - hover flip image
   * - desktop arrows
   * - mobile swipe / trackpad carousel
   * - current price/title
   */
  const cookieStore =
    await cookies()

  const storedIds =
    parseIds(
      cookieStore.get(
        COOKIE_KEY
      )?.value
    )

  const recentIds =
    storedIds
      .filter(
        (id) =>
          id !== currentProductId
      )
      .slice(
        0,
        MAX_VISIBLE_PRODUCTS
      )

  let products:
    HttpTypes.StoreProduct[] = []

  if (recentIds.length) {
    const result =
      await listProducts({
        countryCode,
        queryParams: {
          id: recentIds,
          limit:
            recentIds.length,
        },
      })

    /*
     * Store API doesn't have to preserve the requested ID order,
     * so put products back into recently-viewed order.
     */
    const byId =
      new Map(
        result.response.products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      )

    products =
      recentIds
        .map(
          (id) =>
            byId.get(id)
        )
        .filter(
          (
            product
          ): product is HttpTypes.StoreProduct =>
            Boolean(product)
        )
  }

  return (
    <>
      {/*
       * Client-side tracker updates the cookie AFTER this page is shown,
       * so the current product becomes visible on the NEXT product page.
       */}
      <RecentlyViewedTracker
        productId={
          currentProductId
        }
      />

      {products.length > 0 && (
        <section
          className="w-full px-5 pb-20 pt-6 small:pb-28 small:pt-10"
          aria-labelledby="recently-viewed-title"
          style={{
            fontFamily:
              '"Helvetica Neue", Helvetica, Arial, sans-serif',
          }}
        >
          <h2
            id="recently-viewed-title"
            className="mb-7 text-[12px] font-normal leading-5 text-black"
          >
            Recently Viewed
          </h2>

          <ul
            className="
              grid
              grid-cols-2
              gap-x-5
              gap-y-12
              medium:grid-cols-4
              medium:gap-x-10
            "
          >
            {products.map(
              (product) => (
                <li
                  key={
                    product.id
                  }
                  className="min-w-0"
                >
                  <ProductPreview
                    product={
                      product
                    }
                    region={
                      region
                    }
                  />
                </li>
              )
            )}
          </ul>
        </section>
      )}
    </>
  )
}