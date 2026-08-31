import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

const normalizeHandle = (
  value?: string | null
) => {
  if (!value) {
    return ""
  }

  return decodeURIComponent(value)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()
}

export const listCategories = async (
  query?: Record<string, unknown>
) => {
  const limit =
    Number(query?.limit) || 100

  return sdk.client
    .fetch<{
      product_categories:
        HttpTypes.StoreProductCategory[]
    }>(
      "/store/product-categories",
      {
        query: {
          fields:
            "*category_children,*products,*parent_category,*parent_category.parent_category",
          limit,
          include_descendants_tree:
            true,
          parent_category_id:
            null,
          ...query,
        },
        cache: "no-store",
      }
    )
    .then(
      ({
        product_categories,
      }) => product_categories
    )
}

const findCategoryPathInTree = (
  categories:
    HttpTypes.StoreProductCategory[],
  handle: string,
  ancestors:
    HttpTypes.StoreProductCategory[] = []
):
  | HttpTypes.StoreProductCategory[]
  | undefined => {
  const target =
    normalizeHandle(handle)

  for (
    const category of categories
  ) {
    const currentPath = [
      ...ancestors,
      category,
    ]

    if (
      normalizeHandle(
        category.handle
      ) === target
    ) {
      return currentPath
    }

    if (
      category.category_children
        ?.length
    ) {
      const found =
        findCategoryPathInTree(
          category.category_children,
          target,
          currentPath
        )

      if (found) {
        return found
      }
    }
  }

  return undefined
}

const flattenTree = (
  categories:
    HttpTypes.StoreProductCategory[]
) => {
  const result:
    HttpTypes.StoreProductCategory[] =
    []

  const seen =
    new Set<string>()

  const walk = (
    category:
      HttpTypes.StoreProductCategory
  ) => {
    if (
      !category?.id ||
      seen.has(category.id)
    ) {
      return
    }

    seen.add(category.id)
    result.push(category)

    for (
      const child of
      category.category_children ??
      []
    ) {
      walk(child)
    }
  }

  for (
    const category of categories
  ) {
    walk(category)
  }

  return result
}

/**
 * Selected category:
 * always use the final URL segment.
 */
export const getCategoryByHandle =
  async (
    categoryHandle: string[]
  ) => {
    const requestedHandle =
      categoryHandle
        .filter(Boolean)
        .at(-1)

    if (!requestedHandle) {
      return undefined
    }

    const tree =
      await listCategories()

    const path =
      findCategoryPathInTree(
        tree,
        requestedHandle
      )

    if (path?.length) {
      return path[
        path.length - 1
      ]
    }

    return sdk.client
      .fetch<HttpTypes.StoreProductCategoryListResponse>(
        "/store/product-categories",
        {
          query: {
            fields:
              "*category_children,*products,*parent_category,*parent_category.parent_category",
            handle:
              normalizeHandle(
                requestedHandle
              ),
            include_descendants_tree:
              true,
            limit: 1,
          },
          cache: "no-store",
        }
      )
      .then(
        ({
          product_categories,
        }) =>
          product_categories[0]
      )
}

/**
 * Category-page breadcrumb.
 *
 * If the route already contains the full hierarchy, preserve
 * that route exactly. For a single-handle legacy route, resolve
 * the path from the descendants tree.
 */
export const getCategoryBreadcrumb =
  async (
    categoryHandles: string[]
  ): Promise<
    HttpTypes.StoreProductCategory[]
  > => {
    const handles =
      categoryHandles
        .map(normalizeHandle)
        .filter(Boolean)

    if (!handles.length) {
      return []
    }

    const tree =
      await listCategories()

    const allCategories =
      flattenTree(tree)

    const byHandle =
      new Map(
        allCategories.map(
          (category) => [
            normalizeHandle(
              category.handle
            ),
            category,
          ]
        )
      )

    if (handles.length > 1) {
      const breadcrumb =
        handles
          .map(
            (handle) =>
              byHandle.get(
                handle
              )
          )
          .filter(
            (
              category
            ): category is HttpTypes.StoreProductCategory =>
              Boolean(category)
          )

      if (
        breadcrumb.length ===
        handles.length
      ) {
        return breadcrumb
      }
    }

    const selectedHandle =
      handles.at(-1)!

    return (
      findCategoryPathInTree(
        tree,
        selectedHandle
      ) ?? []
    )
  }

/**
 * Flat category record used only for canonical product breadcrumbs.
 *
 * IMPORTANT:
 * We intentionally do NOT use include_descendants_tree here.
 * We want every Medusa category exactly once, with its real
 * parent_category_id and direct product membership.
 */
type FlatCategoryRecord =
  HttpTypes.StoreProductCategory & {
    parent_category_id?:
      | string
      | null
    products?: Array<{
      id?: string | null
    }>
  }

const listAllFlatCategories =
  async (): Promise<
    FlatCategoryRecord[]
  > => {
    const pageSize = 100
    let offset = 0

    const all:
      FlatCategoryRecord[] =
      []

    while (true) {
      const response =
        await sdk.client.fetch<{
          product_categories:
            FlatCategoryRecord[]
          count?: number
          limit?: number
          offset?: number
        }>(
          "/store/product-categories",
          {
            query: {
              /*
               * parent_category_id is the real hierarchy link.
               * products.id is the real category-product membership.
               */
              fields:
                "id,name,handle,parent_category_id,products.id",
              limit:
                pageSize,
              offset,
            },
            cache:
              "no-store",
          }
        )

      const page =
        response.product_categories ??
        []

      all.push(...page)

      const total =
        typeof response.count ===
        "number"
          ? response.count
          : undefined

      if (
        page.length < pageSize ||
        (total !== undefined &&
          all.length >= total)
      ) {
        break
      }

      offset += pageSize
    }

    return all
  }

const buildActualCategoryPath = ({
  category,
  byId,
}: {
  category:
    FlatCategoryRecord
  byId: Map<
    string,
    FlatCategoryRecord
  >
}): HttpTypes.StoreProductCategory[] => {
  const reversed:
    HttpTypes.StoreProductCategory[] =
    []

  const seen =
    new Set<string>()

  let current:
    | FlatCategoryRecord
    | undefined =
    category

  while (
    current?.id &&
    !seen.has(current.id)
  ) {
    seen.add(current.id)

    reversed.push(
      current as HttpTypes.StoreProductCategory
    )

    const parentId =
      current.parent_category_id

    if (!parentId) {
      break
    }

    current =
      byId.get(parentId)
  }

  return reversed.reverse()
}

/**
 * SINGLE SOURCE OF TRUTH for product pages opened without
 * category navigation context.
 *
 * It answers:
 * "Which actual Medusa category contains this product, and what
 * is that category's actual parent chain?"
 *
 * No URL guessing.
 * No label rewriting.
 * No ProductPreview-specific logic.
 */
export const getProductCanonicalBreadcrumb =
  async (
    productId: string
  ): Promise<
    HttpTypes.StoreProductCategory[]
  > => {
    if (!productId) {
      return []
    }

    const categories =
      await listAllFlatCategories()

    const byId =
      new Map(
        categories
          .filter(
            (category) =>
              Boolean(category.id)
          )
          .map(
            (category) => [
              category.id,
              category,
            ]
          )
      )

    /*
     * These are categories where Medusa says the product is
     * directly a member. This is not inferred from titles/URLs.
     */
    const assignedCategories =
      categories.filter(
        (category) =>
          category.products?.some(
            (product) =>
              product.id ===
              productId
          )
      )

    if (
      !assignedCategories.length
    ) {
      return []
    }

    const paths =
      assignedCategories
        .map((category) =>
          buildActualCategoryPath({
            category,
            byId,
          })
        )
        .filter(
          (path) =>
            path.length > 0
        )

    if (!paths.length) {
      return []
    }

    /*
     * A product can be assigned to multiple real categories.
     * For a direct/non-category entry point there is no visitor
     * route to disambiguate, so use the most-specific ACTUAL
     * assignment. Equal-depth paths are resolved deterministically.
     */
    return [...paths].sort(
      (a, b) => {
        const depthDifference =
          b.length - a.length

        if (depthDifference) {
          return depthDifference
        }

        const aKey =
          a.map(
            (item) =>
              normalizeHandle(
                item.handle
              )
          ).join("/")

        const bKey =
          b.map(
            (item) =>
              normalizeHandle(
                item.handle
              )
          ).join("/")

        return aKey.localeCompare(
          bKey
        )
      }
    )[0]
  }

export const getCategoryIdsWithDescendants =
  (
    category:
      HttpTypes.StoreProductCategory
  ): string[] => {
    const ids =
      new Set<string>()

    const walk = (
      current:
        HttpTypes.StoreProductCategory
    ) => {
      if (!current?.id) {
        return
      }

      ids.add(current.id)

      for (
        const child of
        current.category_children ??
        []
      ) {
        walk(child)
      }
    }

    walk(category)

    return Array.from(ids)
  }

export const flattenCategoryTree =
  (
    categories:
      HttpTypes.StoreProductCategory[]
  ): HttpTypes.StoreProductCategory[] =>
    flattenTree(categories)