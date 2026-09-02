import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  Modules,
} from "@medusajs/framework/utils"

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

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


const getR2KeyFromUrl = (
  url: string,
  publicBase: string
): string | null => {
  const base =
    publicBase.replace(
      /\/+$/,
      ""
    )

  if (
    !url.startsWith(
      base + "/"
    )
  ) {
    return null
  }

  const rawKey =
    url.slice(
      base.length + 1
    )

  try {
    return decodeURIComponent(
      rawKey
    )
  } catch {
    return rawKey
  }
}

const isR2NotFoundError = (
  error: any
): boolean => {
  const status =
    error?.$metadata
      ?.httpStatusCode

  return (
    status === 404 ||
    error?.name ===
      "NotFound" ||
    error?.name ===
      "NoSuchKey" ||
    error?.Code ===
      "NoSuchKey" ||
    error?.code ===
      "NoSuchKey"
  )
}

const wait = (
  ms: number
): Promise<void> =>
  new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  )

const r2ObjectExists =
  async (
    s3: S3Client,
    bucket: string,
    key: string
  ): Promise<boolean> => {
    try {
      await s3.send(
        new HeadObjectCommand({
          Bucket:
            bucket,
          Key:
            key,
        })
      )

      return true
    } catch (
      error: any
    ) {
      if (
        isR2NotFoundError(
          error
        )
      ) {
        return false
      }

      throw error
    }
  }

const deleteR2ObjectVerified =
  async (
    s3: S3Client,
    bucket: string,
    key: string
  ): Promise<void> => {
    const delays = [
      0,
      250,
      750,
      1500,
    ]

    let lastError:
      unknown = null

    for (
      const delay of delays
    ) {
      if (delay) {
        await wait(
          delay
        )
      }

      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket:
              bucket,
            Key:
              key,
          })
        )

        const stillExists =
          await r2ObjectExists(
            s3,
            bucket,
            key
          )

        if (!stillExists) {
          return
        }

        lastError =
          new Error(
            `R2 still reports object after delete: ${key}`
          )
      } catch (
        error
      ) {
        lastError =
          error
      }
    }

    throw (
      lastError ??
      new Error(
        `Unable to verify deletion of ${key}`
      )
    )
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

    /*
     * Remember which product image URLs existed before this edit.
     * Product Builder can remove an existing image from the gallery.
     * Once the edit succeeds, any URL that disappeared from the
     * submitted image list is no longer product media and should be
     * removed from R2 as well.
     *
     * This is intentionally done on the backend AFTER a successful
     * save, not immediately when the user clicks Remove. That way,
     * cancelling/abandoning an edit never destroys live media.
     */
    const existingImageUrls =
      new Set(
        (
          existingProduct.images ??
          []
        )
          .map(
            (image: any) =>
              image?.url
          )
          .filter(
            (
              url: unknown
            ): url is string =>
              typeof url ===
                "string" &&
              Boolean(
                url
              )
          )
      )

    const submittedImageUrls =
      new Set(
        (
          body.images ??
          []
        )
          .map(
            (image) =>
              image?.url
          )
          .filter(
            (
              url
            ): url is string =>
              typeof url ===
                "string" &&
              Boolean(
                url
              )
          )
      )

    const removedImageUrls =
      Array.from(
        existingImageUrls
      ).filter(
        (url) =>
          !submittedImageUrls.has(
            url
          )
      )

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
        "thumbnail",
        "metadata",
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

    /*
     * Remove product images that the user deleted in Edit mode.
     *
     * Why this is separate from the media organizer:
     * after the product update, a removed image is no longer part of
     * product.images, so the organizer cannot discover it anymore.
     *
     * Safety:
     * - only R2 URLs under S3_FILE_URL are eligible;
     * - verify the URL is not still present as a product image,
     *   thumbnail, or metadata URL;
     * - delete only after product + variant-media updates succeeded;
     * - verify deletion with HeadObject and retry;
     * - cleanup failure does NOT roll back a successful product edit.
     */
    const removedMediaCleanupFailures:
      string[] = []

    if (
      removedImageUrls.length
    ) {
      const publicBase =
        process.env.S3_FILE_URL
          ?.replace(
            /\/+$/,
            ""
          )

      const bucket =
        process.env.S3_BUCKET

      const endpoint =
        process.env.S3_ENDPOINT

      const accessKeyId =
        process.env
          .S3_ACCESS_KEY_ID

      const secretAccessKey =
        process.env
          .S3_SECRET_ACCESS_KEY

      if (
        !publicBase ||
        !bucket ||
        !endpoint ||
        !accessKeyId ||
        !secretAccessKey
      ) {
        console.warn(
          "Product updated, but removed-media R2 cleanup was skipped because R2 environment variables are missing."
        )

        removedMediaCleanupFailures.push(
          ...removedImageUrls
        )
      } else {
        const s3 =
          new S3Client({
            region:
              process.env
                .S3_REGION ||
              "auto",
            endpoint,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          })

        const currentImageUrls =
          new Set(
            (
              updatedProduct?.images ??
              []
            )
              .map(
                (image: any) =>
                  image?.url
              )
              .filter(
                (
                  url: unknown
                ): url is string =>
                  typeof url ===
                    "string" &&
                  Boolean(
                    url
                  )
              )
          )

        const currentThumbnail =
          typeof updatedProduct
            ?.thumbnail ===
            "string"
            ? updatedProduct
                .thumbnail
            : ""

        const currentMetadataText =
          JSON.stringify(
            updatedProduct
              ?.metadata ??
              {}
          )

        for (
          const removedUrl of
          removedImageUrls
        ) {
          /*
           * Do not delete an object that the saved product still
           * references anywhere.
           */
          if (
            currentImageUrls.has(
              removedUrl
            ) ||
            currentThumbnail ===
              removedUrl ||
            currentMetadataText.includes(
              removedUrl
            )
          ) {
            console.warn(
              `Removed-media cleanup skipped because the saved product still references: ${removedUrl}`
            )
            continue
          }

          const key =
            getR2KeyFromUrl(
              removedUrl,
              publicBase
            )

          if (!key) {
            /*
             * External/non-R2 image: removing it from the product
             * is enough. Never attempt to delete an external URL.
             */
            continue
          }

          try {
            await deleteR2ObjectVerified(
              s3,
              bucket,
              key
            )

            console.info(
              `[Product Builder Edit] Removed old R2 product image + verified: ${key}`
            )
          } catch (
            cleanupError: any
          ) {
            removedMediaCleanupFailures.push(
              removedUrl
            )

            console.error(
              `[Product Builder Edit] Could not delete removed R2 image ${key}: ${
                cleanupError?.message ||
                cleanupError
              }`
            )
          }
        }
      }
    }

    /*
     * The edit is fully complete at this point:
     * - product-level data has been saved
     * - existing variant IDs have been preserved
     * - variant prices/SKUs have been updated
     * - variant media associations have succeeded
     *
     * Only now ask the R2 product-media organizer to run.
     * The organizer no longer listens to product.updated, so
     * it cannot race with this Product Builder edit flow.
     *
     * If the organizer event cannot be emitted, the edit itself
     * must still remain successful. Media can be organized later.
     */
    try {
      const eventBus =
        req.scope.resolve(
          Modules.EVENT_BUS
        )

      await eventBus.emit({
        name:
          "safafi.product-media.organize",
        data: {
          id:
            productId,
        },
      })
    } catch (
      organizerEventError
    ) {
      console.error(
        `Product ${productId} was updated successfully, but the media organizer event could not be emitted:`,
        organizerEventError
      )
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
      removed_media_cleanup_failures:
        removedMediaCleanupFailures,
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