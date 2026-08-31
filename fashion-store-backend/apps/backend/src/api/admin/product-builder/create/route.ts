import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  createInventoryItemsWorkflow,
  createProductsWorkflow,
  deleteInventoryItemWorkflow,
} from "@medusajs/medusa/core-flows"

type BuilderOption = {
  id: string
  value_ids: string[]
}

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

type CreateBuilderProductBody = {
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
  options: BuilderOption[]
  variants: BuilderVariant[]
  metadata?: Record<string, unknown>
  color_image_map?: Record<
    string,
    ColorImage[]
  >
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const body =
    req.body as CreateBuilderProductBody

  if (
    !body.title ||
    !body.handle ||
    !body.shipping_profile_id ||
    !body.sales_channel_id ||
    !body.options?.length ||
    !body.variants?.length
  ) {
    return res.status(400).json({
      message:
        "Missing required product builder data.",
    })
  }

  const query =
    req.scope.resolve("query")

  /*
   * Inventory in Medusa is location-based.
   * Prefer the store's default location; otherwise
   * use the first stock location available.
   */
  const { data: stores } =
    await query.graph({
      entity: "store",
      fields: [
        "id",
        "default_location_id",
      ],
    })

  let locationId =
    stores[0]?.default_location_id

  if (!locationId) {
    const { data: locations } =
      await query.graph({
        entity: "stock_location",
        fields: ["id", "name"],
      })

    locationId =
      locations[0]?.id
  }

  if (!locationId) {
    return res.status(400).json({
      message:
        "No stock location exists. Create a stock location in Settings → Locations & Shipping, then try again.",
    })
  }

  /*
   * Create exactly one inventory item for each
   * normal product variant. This keeps Inventory Kit OFF.
   */
  const inventoryInput =
    body.variants.map(
      (variant) => ({
        sku: variant.sku,
        title:
          `${body.title} - ${variant.title}`,
        requires_shipping: true,
        location_levels: [
          {
            location_id:
              locationId,
            stocked_quantity:
              variant.stock_quantity,
          },
        ],
      })
    )

  let inventoryItems:
    | {
        id: string
      }[]
    | undefined

  try {
    const inventoryResult =
      await createInventoryItemsWorkflow(
        req.scope
      ).run({
        input: {
          items:
            inventoryInput,
        },
      })

    inventoryItems =
      inventoryResult.result as {
        id: string
      }[]

    if (
      inventoryItems.length !==
      body.variants.length
    ) {
      throw new Error(
        "Inventory items could not be created for every variant."
      )
    }

    const productInput = {
      title:
        body.title,
      handle:
        body.handle,
      description:
        body.description,
      status:
        body.status ??
        "draft",
      thumbnail:
        body.thumbnail,
      images:
        body.images ?? [],
      metadata:
        body.metadata ?? {},
      shipping_profile_id:
        body.shipping_profile_id,
      sales_channels: [
        {
          id:
            body.sales_channel_id,
        },
      ],
      type_id:
        body.type_id,
      collection_id:
        body.collection_id,
      categories:
        (body.category_ids ?? []).map(
          (id) => ({
            id,
          })
        ),
      tags:
        (body.tag_ids ?? []).map(
          (id) => ({
            id,
          })
        ),
      discountable:
        body.discountable ??
        true,
      options:
        body.options,
      variants:
        body.variants.map(
          (
            variant,
            index
          ) => ({
            title:
              variant.title,
            sku:
              variant.sku,
            options:
              variant.options,
            prices:
              variant.prices,

            /*
             * Normal physical-product defaults.
             */
            manage_inventory:
              true,
            allow_backorder:
              false,

            /*
             * One inventory item per variant = not a kit.
             */
            inventory_items: [
              {
                inventory_item_id:
                  inventoryItems![index]
                    .id,
              },
            ],
          })
        ),
    }

    const productResult =
      await createProductsWorkflow(
        req.scope
      ).run({
        input: {
          products: [
            productInput as any,
          ],
        },
      })

    const products =
      productResult.result as any[]

    const product =
      products[0]

    if (!product?.id) {
      throw new Error(
        "Product creation finished without returning a product ID."
      )
    }

    /*
     * Medusa 2.11.2+ stores variant-image associations
     * separately from normal variant updates.
     *
     * Use Medusa's official batch association endpoint:
     * POST /admin/products/:product_id/variants/:variant_id/images/batch
     *
     * The images already belong to the product. We only
     * create the many-to-many associations here.
     */
    const colorImageMap =
      body.color_image_map ?? {}

    if (
      Object.keys(
        colorImageMap
      ).length
    ) {
      const {
        data: createdProducts,
      } = await query.graph({
        entity: "product",
        filters: {
          id: product.id,
        },
        fields: [
          "id",
          "variants.id",
          "variants.options.value",
          "variants.options.option.title",
          "images.id",
          "images.url",
        ],
      })

      const createdProduct =
        createdProducts[0]

      const productImages =
        createdProduct?.images ??
        []

      /*
       * Uploaded file IDs are not necessarily the same
       * IDs as ProductImage records created by the
       * create-product workflow, so resolve them by URL.
       */
      const productImageIdByUrl =
        new Map<string, string>()

      for (
        const image of
        productImages
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
          "Unable to resolve Medusa backend host for variant image association."
        )
      }

      const cookie =
        req.headers.cookie

      const authorization =
        req.headers.authorization

      for (
        const variant of
        createdProduct?.variants ??
        []
      ) {
        const colorOption =
          variant.options?.find(
            (option: any) => {
              const title =
                option.option?.title
                  ?.trim()
                  .toLowerCase()

              return (
                title === "color" ||
                title === "colour"
              )
            }
          )

        const colorValue =
          colorOption?.value

        if (!colorValue) {
          continue
        }

        const selectedImages =
          colorImageMap[
            colorValue
          ] ?? []

        if (
          !selectedImages.length
        ) {
          continue
        }

        const imageIds =
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

        if (!imageIds.length) {
          console.warn(
            `No product image IDs resolved for color "${colorValue}".`
          )
          continue
        }

        const endpoint =
          `${protocol}://${host}` +
          `/admin/products/${product.id}` +
          `/variants/${variant.id}` +
          `/images/batch`

        const headers:
          Record<string, string> = {
            "content-type":
              "application/json",
          }

        /*
         * Product Builder is called from authenticated
         * Medusa Admin, so forward the same auth context
         * to the built-in Admin API route.
         */
        if (cookie) {
          headers.cookie =
            cookie
        }

        if (authorization) {
          headers.authorization =
            authorization
        }

        const associationResponse =
          await fetch(
            endpoint,
            {
              method: "POST",
              headers,
              body:
                JSON.stringify({
                  add:
                    imageIds,
                  remove: [],
                }),
            }
          )

        if (
          !associationResponse.ok
        ) {
          const errorText =
            await associationResponse.text()

          throw new Error(
            `Variant image association failed for ${variant.id} (${colorValue}): ${associationResponse.status} ${errorText}`
          )
        }
      }

      /*
       * Verify associations before returning success.
       * This makes a silent "product created but media
       * missing" failure visible immediately.
       */
      const {
        data: verifiedProducts,
      } = await query.graph({
        entity: "product",
        filters: {
          id: product.id,
        },
        fields: [
          "id",
          "variants.id",
          "variants.images.id",
          "variants.images.url",
        ],
      })

      const variantsWithoutMedia =
        (
          verifiedProducts[0]
            ?.variants ?? []
        ).filter(
          (variant: any) => {
            /*
             * Only require media for variants whose color
             * actually had images assigned in the builder.
             */
            const originalVariant =
              createdProduct?.variants?.find(
                (item: any) =>
                  item.id ===
                  variant.id
              )

            const color =
              originalVariant?.options?.find(
                (option: any) => {
                  const title =
                    option.option?.title
                      ?.trim()
                      .toLowerCase()

                  return (
                    title ===
                      "color" ||
                    title ===
                      "colour"
                  )
                }
              )?.value

            return (
              color &&
              (
                colorImageMap[
                  color
                ] ?? []
              ).length >
                0 &&
              !variant.images?.length
            )
          }
        )

      if (
        variantsWithoutMedia.length
      ) {
        throw new Error(
          `Product was created, but Medusa did not persist media for ${variantsWithoutMedia.length} variant(s).`
        )
      }
    }

    return res.status(200).json({
      product,
    })
  } catch (error) {
    /*
     * If product creation fails after inventory creation,
     * clean up the inventory items to avoid orphan records.
     */
    if (
      inventoryItems?.length
    ) {
      try {
        await deleteInventoryItemWorkflow(
          req.scope
        ).run({
          input: {
            ids:
              inventoryItems.map(
                (item) =>
                  item.id
              ),
          } as any,
        })
      } catch (
        cleanupError
      ) {
        console.error(
          "Failed cleaning up inventory items:",
          cleanupError
        )
      }
    }

    console.error(
      "Product Builder create failed:",
      error
    )

    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to create product.",
    })
  }
}