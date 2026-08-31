import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { OptionValueIds } from "@lib/util/product-option-filters"
import ProductPreview from "@modules/products/components/product-preview/index"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  categoryIds,
  productsIds,
  countryCode,
  optionValueIds,
  inStockOnly = false,
  categoryPath,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  categoryIds?: string[]
  productsIds?: string[]
  countryCode: string
  optionValueIds?: OptionValueIds
  inStockOnly?: boolean
  categoryPath?: string
}) {
  const queryParams:
    PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams.collection_id = [
      collectionId,
    ]
  }

  if (categoryIds?.length) {
    queryParams.category_id =
      Array.from(
        new Set(
          categoryIds.filter(
            Boolean
          )
        )
      )
  } else if (categoryId) {
    queryParams.category_id = [
      categoryId,
    ]
  }

  if (productsIds) {
    queryParams.id =
      productsIds
  }

  if (
    sortBy === "created_at"
  ) {
    queryParams.order =
      "created_at"
  }

  const region =
    await getRegion(
      countryCode
    )

  if (!region) {
    return null
  }

  const {
    response: {
      products,
      count,
    },
  } =
    await listProductsWithSort(
      {
        page,
        queryParams,
        sortBy,
        countryCode,
        optionValueIds,
        inStockOnly,
      }
    )

  const totalPages =
    Math.ceil(
      count /
        PRODUCT_LIMIT
    )

  return (
    <>
      <ul
        className="
          grid
          w-full
          grid-cols-2
          gap-x-5
          gap-y-12
          small:grid-cols-3
          medium:grid-cols-4
          medium:gap-x-10
          medium:gap-y-16
        "
        data-testid="products-list"
      >
        {products.map(
          (product) => (
            <li
              key={product.id}
              className="min-w-0"
            >
              <ProductPreview
                product={product}
                region={region}
                categoryPath={categoryPath}
              />
            </li>
          )
        )}
      </ul>

      {totalPages > 1 && (
        <div className="mt-16">
          <Pagination
            data-testid="product-pagination"
            page={page}
            totalPages={
              totalPages
            }
          />
        </div>
      )}
    </>
  )
}
