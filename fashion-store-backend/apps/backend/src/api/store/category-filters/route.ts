import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  getVariantAvailability,
} from "@medusajs/framework/utils"

type FilterValue = {
  id: string
  value: string
}

type FilterOption = {
  id: string
  title: string
  values: FilterValue[]
}

type ProductRecord = {
  id: string
  status?: string
  options?: Array<{
    id?: string
    title?: string
  }>
  variants?: Array<{
    id?: string
    manage_inventory?: boolean
    allow_backorder?: boolean
    options?: Array<{
      id?: string
      option_id?: string
      value?: string
    }>
  }>
}

const normalize = (
  value?: string | null
) =>
  value?.trim().toLowerCase() ?? ""

const isColorTitle = (
  title?: string | null
) => {
  const normalized =
    normalize(title)

  return (
    normalized === "color" ||
    normalized === "colour" ||
    normalized === "colors" ||
    normalized === "colours"
  )
}

const isSizeTitle = (
  title?: string | null
) => {
  const normalized =
    normalize(title)

  return (
    normalized === "size" ||
    normalized === "sizes"
  )
}

const isSupportedFilterOption = (
  title?: string | null
) =>
  isColorTitle(title) ||
  isSizeTitle(title)

export async function GET(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  const primaryCategoryId =
    typeof req.query.category_id ===
    "string"
      ? req.query.category_id.trim()
      : ""

  const rawCategoryIds =
    typeof req.query.category_ids ===
    "string"
      ? req.query.category_ids
          .split(",")
          .map((id) =>
            id.trim()
          )
          .filter(Boolean)
      : []

  const categoryIds =
    Array.from(
      new Set(
        [
          primaryCategoryId,
          ...rawCategoryIds,
        ].filter(Boolean)
      )
    )

  const collectionId =
    typeof req.query.collection_id ===
    "string"
      ? req.query.collection_id.trim()
      : ""

  if (
    !categoryIds.length &&
    !collectionId
  ) {
    return res
      .status(400)
      .json({
        message:
          "category_id, category_ids, or collection_id is required.",
      })
  }

  const query =
    req.scope.resolve(
      ContainerRegistrationKeys.QUERY
    )

  /*
   * One shared product map keeps:
   * - parent/descendant category results deduped
   * - collection results compatible with exactly the same facet logic
   */
  const productMap =
    new Map<
      string,
      ProductRecord
    >()

  const take = 100

  const readProducts = async (
    filters: Record<
      string,
      unknown
    >
  ) => {
    let skip = 0

    while (true) {
      const {
        data: pageProducts,
      } = await query.graph({
        entity: "product",

        fields: [
          "id",
          "status",

          "options.id",
          "options.title",

          "variants.id",
          "variants.manage_inventory",
          "variants.allow_backorder",

          "variants.options.id",
          "variants.options.option_id",
          "variants.options.value",
        ],

        /*
         * `as any` is intentionally kept only at this Medusa graph
         * boundary because relation-filter typings vary between
         * installed Medusa versions.
         */
        filters: {
          status:
            "published",
          ...filters,
        } as any,

        pagination: {
          skip,
          take,
        },
      })

      const currentPage =
        (
          pageProducts ?? []
        ) as ProductRecord[]

      for (
        const product of
        currentPage
      ) {
        if (product.id) {
          productMap.set(
            product.id,
            product
          )
        }
      }

      if (
        currentPage.length <
        take
      ) {
        break
      }

      skip += take
    }
  }

  if (collectionId) {
    /*
     * Product exposes collection_id in Medusa's Product filters.
     * This gives Collection pages their own Color / Size /
     * Availability facets without changing the Store Products API.
     */
    await readProducts({
      collection_id:
        collectionId,
    })
  } else {
    /*
     * Keep the existing descendant-category behavior unchanged.
     * Query each category separately because the installed Medusa
     * graph relation typing accepts one relation ID at a time.
     */
    for (
      const categoryId of
      categoryIds
    ) {
      await readProducts({
        categories: {
          id: categoryId,
        },
      })
    }
  }

  const products =
    Array.from(
      productMap.values()
    )

  /*
   * option_id -> title
   */
  const optionTitles =
    new Map<
      string,
      string
    >()

  for (
    const product of
    products
  ) {
    for (
      const option of
      product.options ?? []
    ) {
      if (
        !option.id ||
        !option.title ||
        !isSupportedFilterOption(
          option.title
        )
      ) {
        continue
      }

      optionTitles.set(
        option.id,
        option.title
      )
    }
  }

  /*
   * Build Color / Size values only from values actually
   * used by variants in the selected category/collection.
   */
  const optionMap =
    new Map<
      string,
      {
        id: string
        title: string
        values: Map<
          string,
          FilterValue
        >
      }
    >()

  for (
    const product of
    products
  ) {
    for (
      const variant of
      product.variants ?? []
    ) {
      for (
        const variantOption of
        variant.options ?? []
      ) {
        const optionId =
          variantOption.option_id

        const valueId =
          variantOption.id

        const value =
          variantOption.value

        if (
          !optionId ||
          !valueId ||
          !value
        ) {
          continue
        }

        const title =
          optionTitles.get(
            optionId
          )

        if (
          !title ||
          !isSupportedFilterOption(
            title
          )
        ) {
          continue
        }

        if (
          !optionMap.has(
            optionId
          )
        ) {
          optionMap.set(
            optionId,
            {
              id: optionId,
              title,
              values:
                new Map<
                  string,
                  FilterValue
                >(),
            }
          )
        }

        optionMap
          .get(optionId)!
          .values.set(
            valueId,
            {
              id:
                valueId,
              value,
            }
          )
      }
    }
  }

  const options:
    FilterOption[] =
    Array.from(
      optionMap.values()
    )
      .map((option) => ({
        id:
          option.id,
        title:
          option.title,
        values:
          Array.from(
            option.values.values()
          ).sort(
            (a, b) =>
              a.value.localeCompare(
                b.value
              )
          ),
      }))
      .filter(
        (option) =>
          option.values.length >
          0
      )
      .sort((a, b) => {
        if (
          isColorTitle(
            a.title
          )
        ) {
          return -1
        }

        if (
          isColorTitle(
            b.title
          )
        ) {
          return 1
        }

        if (
          isSizeTitle(
            a.title
          )
        ) {
          return -1
        }

        if (
          isSizeTitle(
            b.title
          )
        ) {
          return 1
        }

        return a.title.localeCompare(
          b.title
        )
      })

  /*
   * The exact same sales-channel-aware availability calculation
   * remains in use for both category and collection pages.
   */
  const salesChannelId =
    req.publishable_key_context
      ?.sales_channel_ids?.[0]

  const variants =
    products.flatMap(
      (product) =>
        (
          product.variants ?? []
        ).map(
          (variant) => ({
            ...variant,
            product_id:
              product.id,
          })
        )
    )

  const managedVariantIds =
    variants
      .filter(
        (variant) =>
          Boolean(
            variant.id
          ) &&
          variant.manage_inventory !==
            false &&
          variant.allow_backorder !==
            true
      )
      .map(
        (variant) =>
          variant.id!
      )

  let variantAvailability:
    | Awaited<
        ReturnType<
          typeof getVariantAvailability
        >
      >
    | null = null

  if (
    salesChannelId &&
    managedVariantIds.length >
      0
  ) {
    variantAvailability =
      await getVariantAvailability(
        query,
        {
          variant_ids:
            managedVariantIds,
          sales_channel_id:
            salesChannelId,
        }
      )
  }

  const inStockProductIds =
    new Set<string>()

  for (
    const variant of
    variants
  ) {
    if (!variant.id) {
      continue
    }

    const alwaysAvailable =
      variant.manage_inventory ===
        false ||
      variant.allow_backorder ===
        true

    const trackedAvailability =
      variantAvailability?.[
        variant.id
      ]?.availability

    const trackedAvailable =
      Boolean(
        salesChannelId &&
          typeof trackedAvailability ===
            "number" &&
          trackedAvailability >
            0
      )

    if (
      alwaysAvailable ||
      trackedAvailable
    ) {
      inStockProductIds.add(
        variant.product_id
      )
    }
  }

  return res
    .status(200)
    .json({
      category_id:
        primaryCategoryId ||
        categoryIds[0] ||
        undefined,

      category_ids:
        categoryIds,

      collection_id:
        collectionId ||
        undefined,

      options,

      availability: {
        supported:
          Boolean(
            salesChannelId
          ),

        in_stock_product_ids:
          Array.from(
            inStockProductIds
          ),

        in_stock_count:
          inStockProductIds.size,

        total_products:
          products.length,
      },
    })
}
