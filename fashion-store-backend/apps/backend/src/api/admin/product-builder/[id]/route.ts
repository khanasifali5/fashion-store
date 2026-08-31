import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

type BuilderPrice = {
  currency_code: string
  amount: number
}

type BuilderVariant = {
  title: string
  sku: string
  options: Record<string, string>
  prices: BuilderPrice[]
  manage_inventory: boolean
  allow_backorder: boolean
  stock_quantity: number
}

type ColorImage = {
  id: string
  url: string
}

type UpdateBuilderProductBody = {
  title: string
  handle: string
  description?: string
  status?: "draft" | "proposed" | "published" | "rejected"
  thumbnail?: string
  images?: {
    url: string
  }[]
  shipping_profile_id: string
  sales_channel_id: string
  type_id?: string
  collection_id?: string
  category_ids?: string[]
  tag_ids?: string[]
  discountable?: boolean
  variants: BuilderVariant[]
  metadata?: Record<string, unknown>
  color_image_map?: Record<
    string,
    ColorImage[]
  >
}

const normalize = (
  value?: string | null
) =>
  value?.trim().toLowerCase() ??
  ""

const getVariantOption = (
  variant: any,
  title:
    | "color"
    | "size"
) => {
  return variant.options?.find(
    (option: any) => {
      const optionTitle =
        normalize(
          option.option?.title
        )

      if (title === "color") {
        return (
          optionTitle === "color" ||
          optionTitle === "colour"
        )
      }

      return optionTitle ===
        "size"
    }
  )?.value as
    | string
    | undefined
}

const combinationKey = (
  color?: string,
  size?: string
) =>
  `${normalize(color)}::${normalize(
    size
  )}`

const getForwardHeaders = (
  req: MedusaRequest
) => {
  const headers:
    Record<string, string> = {
      "content-type":
        "application/json",
    }

  if (req.headers.cookie) {
    headers.cookie =
      req.headers.cookie
  }

  if (
    req.headers.authorization
  ) {
    headers.authorization =
      req.headers.authorization
  }

  return headers
}

const getBaseURL = (
  req: MedusaRequest
) => {
  const forwardedProto =
    req.headers[
      "x-forwarded-proto"
    ]

  const protocol =
    Array.isArray(
      forwardedProto
    )
      ? forwardedProto[0]
      : forwardedProto ||
        "http"

  const host =
    req.headers.host

  if (!host) {
    throw new Error(
      "Unable to resolve Medusa backend host."
    )
  }

  return `${protocol}://${host}`
}

const readJson = async (
  response: Response
) => {
  const text =
    await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return {
      message: text,
    }
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productId =
    req.params.id

  const body =
    req.body as UpdateBuilderProductBody

  if (
    !productId ||
    !body.title ||
    !body.handle ||
    !body.shipping_profile_id ||
    !body.sales_channel_id
  ) {
    return res.status(400).json({
      message:
        "Missing required Product Builder edit data.",
    })
  }

  const query =
    req.scope.resolve("query")

  try {
    /*
     * Load the existing product first.
     * We intentionally preserve its Color × Size variant identity.
     */
    const {
      data: existingProducts,
    } = await query.graph({
      entity: "product",
      filters: {
        id: productId,
      },
      fields: [
        "id",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.options.value",
        "variants.options.option.title",
        "variants.images.id",
        "images.id",
        "images.url",
      ],
    })

    const existingProduct =
      existingProducts[0]

    if (!existingProduct?.id) {
      return res.status(404).json({
        message:
          "Product not found.",
      })
    }

    const existingVariants =
      existingProduct.variants ??
      []

    const existingByCombination =
      new Map<string, any>()

    for (
      const variant of
      existingVariants
    ) {
      const color =
        getVariantOption(
          variant,
          "color"
        )

      const size =
        getVariantOption(
          variant,
          "size"
        )

      existingByCombination.set(
        combinationKey(
          color,
          size
        ),
        variant
      )
    }

    const submittedByCombination =
      new Map<
        string,
        BuilderVariant
      >()

    for (
      const variant of
      body.variants ?? []
    ) {
      submittedByCombination.set(
        combinationKey(
          variant.options.Color ??
            variant.options.Colour,
          variant.options.Size
        ),
        variant
      )
    }

    /*
     * Safety rule:
     * Product Builder Edit updates existing variants, but does not
     * create/delete Color × Size combinations. That preserves variant
     * IDs used by carts, inventory, orders, and storefront URLs.
     */
    if (
      existingByCombination.size !==
        submittedByCombination.size ||
      Array.from(
        existingByCombination.keys()
      ).some(
        (key) =>
          !submittedByCombination.has(
            key
          )
      )
    ) {
      return res.status(409).json({
        message:
          "Color/Size combinations changed. Product Builder Edit protects existing variant IDs, so add or remove variant combinations in Medusa's standard product editor first.",
      })
    }

    const baseURL =
      getBaseURL(req)

    const headers =
      getForwardHeaders(req)

    /*
     * Update product-level data through Medusa's own Admin API.
     * Metadata is merged at the top level by Medusa, so unrelated
     * metadata remains intact.
     */
    const productResponse =
      await fetch(
        `${baseURL}/admin/products/${productId}?fields=id,title,handle`,
        {
          method: "POST",
          headers,
          body:
            JSON.stringify({
              title:
                body.title,
              handle:
                body.handle,
              description:
                body.description ??
                null,
              status:
                body.status ??
                undefined,
              thumbnail:
                body.thumbnail ??
                null,
              images:
                body.images ??
                [],
              metadata:
                body.metadata ??
                {},
              shipping_profile_id:
                body.shipping_profile_id,
              sales_channels: [
                {
                  id:
                    body.sales_channel_id,
                },
              ],
              type_id:
                body.type_id ??
                null,
              collection_id:
                body.collection_id ??
                null,
              categories:
                (
                  body.category_ids ??
                  []
                ).map(
                  (id) => ({
                    id,
                  })
                ),
              tags:
                (
                  body.tag_ids ??
                  []
                ).map(
                  (id) => ({
                    id,
                  })
                ),
              discountable:
                body.discountable ??
                true,
            }),
        }
      )

    const productData =
      await readJson(
        productResponse
      )

    if (
      !productResponse.ok
    ) {
      throw new Error(
        productData?.message ||
          `Product update failed (${productResponse.status}).`
      )
    }

    /*
     * Update existing variant title/SKU/prices.
     *
     * We deliberately don't send option values when they haven't
     * changed. This avoids unnecessary sibling-variant validation and
     * keeps the edit path faster on products with many variants.
     */
    for (
      const [
        key,
        existingVariant,
      ] of existingByCombination
    ) {
      const submitted =
        submittedByCombination.get(
          key
        )!

      const variantResponse =
        await fetch(
          `${baseURL}/admin/products/${productId}/variants/${existingVariant.id}?fields=id,title,sku`,
          {
            method: "POST",
            headers,
            body:
              JSON.stringify({
                title:
                  submitted.title,
                sku:
                  submitted.sku,
                prices:
                  submitted.prices,
              }),
          }
        )

      const variantData =
        await readJson(
          variantResponse
        )

      if (
        !variantResponse.ok
      ) {
        throw new Error(
          variantData?.message ||
            `Variant update failed for ${submitted.title}.`
        )
      }
    }

    /*
     * Refresh product images after the product-level update, because
     * ProductImage IDs can change when the image list is replaced.
     */
    const {
      data: updatedProducts,
    } = await query.graph({
      entity: "product",
      filters: {
        id: productId,
      },
      fields: [
        "id",
        "title",
        "handle",
        "variants.id",
        "variants.options.value",
        "variants.options.option.title",
        "variants.images.id",
        "images.id",
        "images.url",
      ],
    })

    const updatedProduct =
      updatedProducts[0]

    const productImageIdByUrl =
      new Map<
        string,
        string
      >()

    for (
      const image of
      updatedProduct?.images ??
      []
    ) {
      if (
        image?.url &&
        image?.id
      ) {
        productImageIdByUrl.set(
          image.url,
          image.id
        )
      }
    }

    const colorImageMap =
      body.color_image_map ??
      {}

    /*
     * IMPORTANT — Medusa 2.11.2+ scoped variant images:
     *
     * variant.images is an EFFECTIVE image list. It can contain:
     *   1. images explicitly associated with the variant, AND
     *   2. product images that are not associated with any variant.
     *
     * Because of that, variant.images MUST NOT be used to decide
     * whether a selected image is already associated.
     *
     * The old edit route did exactly that:
     * it saw a shared/unassociated image inside variant.images,
     * assumed the pivot association already existed, and skipped
     * adding it. Product Builder therefore looked correct while
     * Medusa Admin -> Variant -> Media showed "No media yet".
     *
     * Fix:
     * - Always send every selected image ID in `add`.
     * - Send every other product image ID in `remove`.
     *
     * Medusa's official batch endpoint owns the actual
     * ProductVariant <-> ProductImage pivot association.
     */
    const allProductImageIds =
      Array.from(
        new Set(
          Array.from(
            productImageIdByUrl.values()
          )
        )
      )

    let variantMediaUpdates = 0

    for (
      const variant of
      updatedProduct?.variants ??
      []
    ) {
      const colorValue =
        getVariantOption(
          variant,
          "color"
        )

      if (!colorValue) {
        continue
      }

      /*
       * Match color keys defensively so "Black" / "black"
       * or accidental surrounding whitespace don't break media.
       */
      const matchingColorEntry =
        Object.entries(
          colorImageMap
        ).find(
          ([key]) =>
            normalize(key) ===
            normalize(colorValue)
        )

      const selectedImages =
        matchingColorEntry?.[1] ??
        []

      const desiredImageIds =
        Array.from(
          new Set(
            selectedImages
              .map((image) =>
                productImageIdByUrl.get(
                  image.url
                )
              )
              .filter(
                (
                  id
                ): id is string =>
                  Boolean(id)
              )
          )
        )

      const desiredSet =
        new Set(
          desiredImageIds
        )

      /*
       * DO NOT compare against variant.images here.
       * That relation contains effective/shared images too.
       */
      const add =
        desiredImageIds

      const remove =
        allProductImageIds.filter(
          (id) =>
            !desiredSet.has(id)
        )

      const associationResponse =
        await fetch(
          `${baseURL}/admin/products/${productId}/variants/${variant.id}/images/batch`,
          {
            method: "POST",
            headers,
            body:
              JSON.stringify({
                add,
                remove,
              }),
          }
        )

      const associationData =
        await readJson(
          associationResponse
        )

      if (
        !associationResponse.ok
      ) {
        const rawMessage =
          associationData?.message ||
          associationData?.error ||
          ""

        if (
          associationResponse.status ===
          404
        ) {
          throw new Error(
            "Medusa's native variant-media endpoint is unavailable. Product variant media requires Medusa 2.11.2 or newer. Upgrade the backend packages and run `npx medusa db:migrate`, then restart the backend."
          )
        }

        throw new Error(
          typeof rawMessage ===
            "string" &&
          rawMessage
            ? `Variant image association failed for ${colorValue}: ${rawMessage}`
            : `Variant image association failed for ${colorValue} (HTTP ${associationResponse.status}).`
        )
      }

      variantMediaUpdates += 1
    }

    return res.status(200).json({
      product: {
        id:
          updatedProduct?.id ??
          productId,
        title:
          updatedProduct?.title ??
          body.title,
        handle:
          updatedProduct?.handle ??
          body.handle,
      },
      inventory_note:
        "Stock quantities are unchanged. Edit mode preserves location-based inventory.",
      variant_media_updates:
        variantMediaUpdates,
    })
  } catch (error) {
    console.error(
      "Product Builder update failed:",
      error
    )

    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to update product.",
    })
  }
}