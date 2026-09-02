import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"

import {
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"

import {
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

import {
  S3Client,
  CopyObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"

const processingProducts = new Set<string>()

const ORGANIZE_EVENT =
  "safafi.product-media.organize"

function slugify(
  value: string
): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getKeyFromUrl(
  url: string,
  publicBase: string
): string | null {
  const base =
    publicBase.replace(/\/+$/, "")

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

function getExtension(
  url: string
): string {
  try {
    const pathname =
      new URL(url).pathname

    const match =
      pathname.match(
        /\.[a-zA-Z0-9]+$/
      )

    return (
      match?.[0]
        ?.toLowerCase() ||
      ".webp"
    )
  } catch {
    return ".webp"
  }
}

function findExistingProductFolder(
  productId: string,
  urls: string[],
  publicBase: string
): string | null {
  for (const url of urls) {
    const key =
      getKeyFromUrl(
        url,
        publicBase
      )

    if (!key) {
      continue
    }

    const parts =
      key.split("/")

    if (
      parts.length >= 3 &&
      parts[0] ===
        "products" &&
      parts[1].endsWith(
        `-${productId}`
      )
    ) {
      return `products/${parts[1]}`
    }
  }

  return null
}

function isNotFoundError(
  error: any
): boolean {
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

function asRecord(
  value: unknown
): Record<
  string,
  unknown
> {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >
  }

  return {}
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

async function objectExists(
  s3: S3Client,
  bucket: string,
  key: string
): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )

    return true
  } catch (
    error: any
  ) {
    if (
      isNotFoundError(
        error
      )
    ) {
      return false
    }

    throw error
  }
}

async function deleteObjectVerified(
  s3: S3Client,
  bucket: string,
  key: string
): Promise<void> {
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
      await wait(delay)
    }

    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      )

      const stillExists =
        await objectExists(
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

export default async function productMediaOrganizer({
  event: { data },
  container,
}: SubscriberArgs<{
  id: string
}>) {
  const logger =
    container.resolve(
      ContainerRegistrationKeys.LOGGER
    )

  const query =
    container.resolve(
      ContainerRegistrationKeys.QUERY
    )

  const productId =
    data.id

  if (!productId) {
    logger.warn(
      "[Product Media Organizer] Missing product ID"
    )
    return
  }

  if (
    processingProducts.has(
      productId
    )
  ) {
    logger.info(
      `[Product Media Organizer] Already processing ${productId} - skip`
    )
    return
  }

  processingProducts.add(
    productId
  )

  const copiedDestinationKeys:
    string[] = []

  try {
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
      throw new Error(
        "Missing R2 environment variables"
      )
    }

    const {
      data: products,
    } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "thumbnail",
        "metadata",
        "images.id",
        "images.url",
      ],
      filters: {
        id: productId,
      },
    })

    const product =
      products[0]

    if (!product) {
      logger.warn(
        `[Product Media Organizer] Product not found: ${productId}`
      )
      return
    }

    const images =
      product.images || []

    if (!images.length) {
      logger.info(
        `[Product Media Organizer] No images for ${product.title}`
      )
      return
    }

    const allUrls =
      images
        .map(
          (image: any) =>
            image.url
        )
        .filter(
          Boolean
        ) as string[]

    if (
      product.thumbnail
    ) {
      allUrls.push(
        product.thumbnail
      )
    }

    /*
     * If this product has already been organized once,
     * keep that original folder forever, even if the
     * product title changes later.
     */
    const existingFolder =
      findExistingProductFolder(
        product.id,
        allUrls,
        publicBase
      )

    const folder =
      existingFolder ||
      `products/${
        slugify(
          product.title ||
            "product"
        ) || "product"
      }-${product.id}`

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

    logger.info(
      `[Product Media Organizer] Product: ${product.title}`
    )

    logger.info(
      `[Product Media Organizer] Folder: ${folder}/`
    )

    const changes: Array<{
      id: string
      oldUrl: string
      oldKey: string
      newUrl: string
      newKey: string
    }> = []

    for (
      const image of images
    ) {
      if (
        !image.id ||
        !image.url
      ) {
        continue
      }

      const oldKey =
        getKeyFromUrl(
          image.url,
          publicBase
        )

      if (!oldKey) {
        logger.warn(
          `[Product Media Organizer] External/non-R2 image skipped: ${image.url}`
        )
        continue
      }

      /*
       * Already inside this product's stable folder.
       * Reorder/edit => zero R2 operations.
       */
      if (
        oldKey.startsWith(
          `${folder}/`
        )
      ) {
        logger.info(
          `[Product Media Organizer] Already organized: ${image.id}`
        )
        continue
      }

      const extension =
        getExtension(
          image.url
        )

      const newKey =
        `${folder}/${image.id}${extension}`

      const newUrl =
        `${publicBase}/${newKey}`

      let destinationExists =
        false

      try {
        await s3.send(
          new HeadObjectCommand({
            Bucket:
              bucket,
            Key:
              newKey,
          })
        )

        destinationExists =
          true
      } catch (
        error: any
      ) {
        if (
          isNotFoundError(
            error
          )
        ) {
          destinationExists =
            false
        } else {
          throw error
        }
      }

      if (
        !destinationExists
      ) {
        logger.info(
          `[Product Media Organizer] Copying ${oldKey} -> ${newKey}`
        )

        await s3.send(
          new CopyObjectCommand({
            Bucket:
              bucket,
            Key:
              newKey,
            CopySource:
              encodeURI(
                `/${bucket}/${oldKey}`
              ),
            MetadataDirective:
              "COPY",
          })
        )

        /*
         * Verify the new object before touching the DB
         * or deleting the source.
         */
        await s3.send(
          new HeadObjectCommand({
            Bucket:
              bucket,
            Key:
              newKey,
          })
        )

        copiedDestinationKeys.push(
          newKey
        )
      } else {
        logger.info(
          `[Product Media Organizer] Destination already exists: ${newKey}`
        )
      }

      changes.push({
        id:
          image.id,
        oldUrl:
          image.url,
        oldKey,
        newUrl,
        newKey,
      })
    }

    if (!changes.length) {
      logger.info(
        "[Product Media Organizer] Nothing to move"
      )
      return
    }

    const movedById =
      new Map(
        changes.map(
          (change) => [
            change.id,
            change.newUrl,
          ]
        )
      )

    const movedByOldUrl =
      new Map(
        changes.map(
          (change) => [
            change.oldUrl,
            change.newUrl,
          ]
        )
      )

    /*
     * Preserve current gallery order.
     * Only the URLs change.
     */
    const updatedImages =
      images.map(
        (image: any) => ({
          id:
            image.id,
          url:
            movedById.get(
              image.id
            ) ||
            image.url,
        })
      )

    let updatedThumbnail =
      product.thumbnail

    if (
      typeof product.thumbnail ===
        "string"
    ) {
      updatedThumbnail =
        movedByOldUrl.get(
          product.thumbnail
        ) ||
        product.thumbnail
    }

    /*
     * Product Builder stores both stable ProductImage IDs
     * and URL fallbacks for Main / Flip / Swatch roles.
     * Keep the IDs unchanged and refresh URL fallbacks
     * whenever the R2 object moves.
     */
    const currentMetadata =
      asRecord(
        product.metadata
      )

    const updatedMetadata: Record<
      string,
      unknown
    > = {
      ...currentMetadata,
    }

    const primaryId =
      typeof currentMetadata
        .showcase_primary_image_id ===
        "string"
        ? currentMetadata
            .showcase_primary_image_id
        : ""

    const primaryUrl =
      typeof currentMetadata
        .showcase_primary_image_url ===
        "string"
        ? currentMetadata
            .showcase_primary_image_url
        : ""

    if (
      primaryId ||
      primaryUrl
    ) {
      updatedMetadata.showcase_primary_image_url =
        (
          primaryId &&
          movedById.get(
            primaryId
          )
        ) ||
        movedByOldUrl.get(
          primaryUrl
        ) ||
        primaryUrl
    }

    const flipId =
      typeof currentMetadata
        .showcase_flip_image_id ===
        "string"
        ? currentMetadata
            .showcase_flip_image_id
        : ""

    const flipUrl =
      typeof currentMetadata
        .showcase_flip_image_url ===
        "string"
        ? currentMetadata
            .showcase_flip_image_url
        : ""

    if (
      flipId ||
      flipUrl
    ) {
      updatedMetadata.showcase_flip_image_url =
        (
          flipId &&
          movedById.get(
            flipId
          )
        ) ||
        movedByOldUrl.get(
          flipUrl
        ) ||
        flipUrl
    }

    const rawSwatches =
      currentMetadata
        .showcase_color_swatches

    if (
      rawSwatches &&
      typeof rawSwatches ===
        "object" &&
      !Array.isArray(
        rawSwatches
      )
    ) {
      const nextSwatches:
        Record<
          string,
          unknown
        > = {}

      for (
        const [
          color,
          rawValue,
        ] of Object.entries(
          rawSwatches as Record<
            string,
            unknown
          >
        )
      ) {
        if (
          !rawValue ||
          typeof rawValue !==
            "object" ||
          Array.isArray(
            rawValue
          )
        ) {
          nextSwatches[
            color
          ] =
            rawValue
          continue
        }

        const swatch =
          rawValue as Record<
            string,
            unknown
          >

        const imageId =
          typeof swatch
            .image_id ===
            "string"
            ? swatch
                .image_id
            : ""

        const imageUrl =
          typeof swatch
            .image_url ===
            "string"
            ? swatch
                .image_url
            : ""

        nextSwatches[
          color
        ] = {
          ...swatch,
          image_url:
            (
              imageId &&
              movedById.get(
                imageId
              )
            ) ||
            movedByOldUrl.get(
              imageUrl
            ) ||
            imageUrl,
        }
      }

      updatedMetadata.showcase_color_swatches =
        nextSwatches
    }

    logger.info(
      "[Product Media Organizer] Updating Medusa URLs + storefront metadata"
    )

    /*
     * This workflow will emit product.updated, but this
     * organizer does NOT subscribe to product.updated
     * anymore, so there is no recursive organizer loop.
     */
    await updateProductsWorkflow(
      container
    ).run({
      input: {
        products: [
          {
            id:
              product.id,
            images:
              updatedImages,
            thumbnail:
              updatedThumbnail ||
              undefined,
            metadata:
              updatedMetadata,
          },
        ],
      },
    })

    /*
     * DB update succeeded and now points at verified
     * destination objects. Only now remove old objects.
     *
     * IMPORTANT:
     * DeleteObject alone is not treated as success.
     * We verify with HeadObject and retry. The previous
     * implementation swallowed delete failures and could
     * print DONE while duplicate source objects remained.
     */
    const cleanupFailures:
      string[] = []

    for (
      const change of changes
    ) {
      if (
        change.oldKey ===
        change.newKey
      ) {
        continue
      }

      try {
        await deleteObjectVerified(
          s3,
          bucket,
          change.oldKey
        )

        logger.info(
          `[Product Media Organizer] Old object deleted + verified: ${change.oldKey}`
        )
      } catch (
        error: any
      ) {
        cleanupFailures.push(
          change.oldKey
        )

        logger.error(
          `[Product Media Organizer] SOURCE CLEANUP FAILED ${change.oldKey}: ${
            error?.message ||
            error
          }`
        )
      }
    }

    if (
      cleanupFailures.length
    ) {
      logger.error(
        `[Product Media Organizer] ORGANIZED, BUT ${cleanupFailures.length} old source object(s) still need cleanup.`
      )
    } else {
      logger.info(
        `[Product Media Organizer] DONE - ${changes.length} image(s) organized; old source objects removed`
      )
    }
  } catch (
    error: any
  ) {
    /*
     * If we copied new destination objects but the Medusa
     * DB update failed, remove only the destinations that
     * THIS run created. The original source objects are
     * still intact, so the product remains usable.
     */
    if (
      copiedDestinationKeys.length
    ) {
      try {
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
          bucket &&
          endpoint &&
          accessKeyId &&
          secretAccessKey
        ) {
          const cleanupS3 =
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

          for (
            const key of
            copiedDestinationKeys
          ) {
            try {
              await cleanupS3.send(
                new DeleteObjectCommand({
                  Bucket:
                    bucket,
                  Key:
                    key,
                })
              )
            } catch (
              cleanupError: any
            ) {
              logger.warn(
                `[Product Media Organizer] Could not roll back copied destination ${key}: ${
                  cleanupError?.message ||
                  cleanupError
                }`
              )
            }
          }
        }
      } catch (
        cleanupError: any
      ) {
        logger.warn(
          `[Product Media Organizer] Destination rollback failed: ${
            cleanupError?.message ||
            cleanupError
          }`
        )
      }
    }

    logger.error(
      `[Product Media Organizer] Error: ${
        error?.message ||
        error
      }`
    )
  } finally {
    processingProducts.delete(
      productId
    )
  }
}

export const config:
  SubscriberConfig = {
    /*
     * IMPORTANT:
     * Do NOT listen to product.created / product.updated.
     *
     * Product Builder emits this custom event only after
     * product creation, metadata normalization, and
     * variant-image association have all completed.
     * That removes the previous race condition.
     */
    event:
      ORGANIZE_EVENT,
  }