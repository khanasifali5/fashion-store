import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"

import ProductPreview from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const queryParams: HttpTypes.StoreProductListParams = {}

  if (region.id) {
    queryParams.region_id = region.id
  }

  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }

  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((tag) => tag.id)
      .filter(Boolean) as string[]
  }

  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) =>
    response.products.filter(
      (responseProduct) =>
        responseProduct.id !== product.id
    )
  )

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="mb-16 flex flex-col items-center text-center">
        <span className="mb-6 text-base-regular text-gray-600">
          Related products
        </span>

        <p className="max-w-lg text-2xl-regular text-ui-fg-base">
          You might also want to check out these products.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 small:grid-cols-3 medium:grid-cols-4 medium:gap-x-6">
        {products.map((relatedProduct) => (
          <li key={relatedProduct.id}>
            <ProductPreview
              region={region}
              product={relatedProduct}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}