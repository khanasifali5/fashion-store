import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

type SimilarItemsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  categoryId?: string
}

export default async function SimilarItems({
  product,
  region,
  countryCode,
  categoryId,
}: SimilarItemsProps) {
  let products: HttpTypes.StoreProduct[] = []

  /*
   * First choice: deepest category from the breadcrumb.
   * This gives trousers -> trousers, bags -> bags, etc.
   */
  if (categoryId) {
    const result = await listProducts({
      countryCode,
      queryParams: {
        category_id: [categoryId],
        limit: 12,
      },
    })

    products =
      result.response.products.filter(
        (item) => item.id !== product.id
      )
  }

  /*
   * Fallback to collection if the product was opened directly
   * and no category context is available.
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
          limit: 12,
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
      className="w-full px-5 py-14 small:py-20"
      aria-labelledby="similar-items-title"
      style={{
        fontFamily:
          '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <h2
        id="similar-items-title"
        className="mb-7 text-[12px] font-normal leading-5 text-black"
      >
        Similar Items
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
