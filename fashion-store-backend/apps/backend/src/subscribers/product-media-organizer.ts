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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getKeyFromUrl(
  url: string,
  publicBase: string
) {
  const base = publicBase.replace(/\/+$/, "")

  if (!url.startsWith(base + "/")) {
    return null
  }

  const rawKey = url.slice(base.length + 1)

  try {
    return decodeURIComponent(rawKey)
  } catch {
    return rawKey
  }
}

function getExtension(url: string) {
  try {
    const pathname = new URL(url).pathname
    const match = pathname.match(/\.[a-zA-Z0-9]+$/)

    return match?.[0]?.toLowerCase() || ".webp"
  } catch {
    return ".webp"
  }
}

function findExistingProductFolder(
  productId: string,
  urls: string[],
  publicBase: string
) {
  for (const url of urls) {
    const key = getKeyFromUrl(url, publicBase)

    if (!key) {
      continue
    }

    const parts = key.split("/")

    if (
      parts.length >= 3 &&
      parts[0] === "products" &&
      parts[1].endsWith(`-${productId}`)
    ) {
      return `products/${parts[1]}`
    }
  }

  return null
}

export default async function productMediaOrganizer({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(
    ContainerRegistrationKeys.LOGGER
  )

  const query = container.resolve(
    ContainerRegistrationKeys.QUERY
  )

  const productId = data.id

  if (processingProducts.has(productId)) {
    logger.info(
      `[Product Media Organizer] Already processing ${productId} - skip`
    )
    return
  }

  processingProducts.add(productId)

  try {
    const publicBase =
      process.env.S3_FILE_URL?.replace(/\/+$/, "")

    const bucket =
      process.env.S3_BUCKET

    const endpoint =
      process.env.S3_ENDPOINT

    const accessKeyId =
      process.env.S3_ACCESS_KEY_ID

    const secretAccessKey =
      process.env.S3_SECRET_ACCESS_KEY

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

    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "thumbnail",
        "images.id",
        "images.url",
      ],
      filters: {
        id: productId,
      },
    })

    const product = products[0]

    if (!product) {
      logger.warn(
        `[Product Media Organizer] Product not found: ${productId}`
      )
      return
    }

    const images = product.images || []

    if (!images.length) {
      logger.info(
        `[Product Media Organizer] No images for ${product.title}`
      )
      return
    }

    const allUrls = images
      .map((image) => image.url)
      .filter(Boolean)

    if (product.thumbnail) {
      allUrls.push(product.thumbnail)
    }

    /*
     * Important:
     * If product was already organized once, keep the
     * existing folder even if its title is renamed later.
     */
    const existingFolder =
      findExistingProductFolder(
        product.id,
        allUrls,
        publicBase
      )

    const folder =
      existingFolder ||
      `products/${slugify(product.title || "product")}-${product.id}`

    const s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
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

    for (const image of images) {
      if (!image.id || !image.url) {
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
       * Already correctly organized.
       * Reorder/edit => zero R2 operations.
       */
      if (oldKey.startsWith(`${folder}/`)) {
        logger.info(
          `[Product Media Organizer] Already organized: ${image.id}`
        )
        continue
      }

      const extension =
        getExtension(image.url)

      const newKey =
        `${folder}/${image.id}${extension}`

      const newUrl =
        `${publicBase}/${newKey}`

      let destinationExists = false

      try {
        await s3.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: newKey,
          })
        )

        destinationExists = true
      } catch {
        destinationExists = false
      }

      if (!destinationExists) {
        logger.info(
          `[Product Media Organizer] Copying ${oldKey} -> ${newKey}`
        )

        await s3.send(
          new CopyObjectCommand({
            Bucket: bucket,
            Key: newKey,

            /*
             * R2 supports S3 CopyObject.
             * encodeURI preserves path slashes.
             */
            CopySource: encodeURI(
              `/${bucket}/${oldKey}`
            ),

            MetadataDirective: "COPY",
          })
        )

        await s3.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: newKey,
          })
        )
      } else {
        logger.info(
          `[Product Media Organizer] Destination already exists: ${newKey}`
        )
      }

      changes.push({
        id: image.id,
        oldUrl: image.url,
        oldKey,
        newUrl,
        newKey,
      })
    }

    if (!changes.length) {
      logger.info(
        `[Product Media Organizer] Nothing to move`
      )
      return
    }

    /*
     * Preserve current gallery ordering:
     * update every existing image by ID,
     * replacing only URLs that moved.
     */
    const movedById = new Map(
      changes.map((change) => [
        change.id,
        change.newUrl,
      ])
    )

    const updatedImages = images.map(
      (image) => ({
        id: image.id,
        url:
          movedById.get(image.id) ||
          image.url,
      })
    )

    /*
     * If current thumbnail points to one of the
     * moved images, update thumbnail too.
     */
    let updatedThumbnail =
      product.thumbnail

    const thumbnailMove =
      changes.find(
        (change) =>
          change.oldUrl === product.thumbnail
      )

    if (thumbnailMove) {
      updatedThumbnail =
        thumbnailMove.newUrl
    }

    logger.info(
      `[Product Media Organizer] Updating Medusa URLs`
    )

    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: product.id,
            images: updatedImages,
            thumbnail:
              updatedThumbnail || undefined,
          },
        ],
      },
    })

    /*
     * Only after Medusa DB update succeeds,
     * delete old objects.
     */
    for (const change of changes) {
      /*
       * Safety: don't delete if source and destination
       * somehow became identical.
       */
      if (change.oldKey === change.newKey) {
        continue
      }

      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: change.oldKey,
          })
        )

        logger.info(
          `[Product Media Organizer] Old object deleted: ${change.oldKey}`
        )
      } catch (error: any) {
        /*
         * DB already points to the verified new object,
         * so failed cleanup isn't fatal.
         */
        logger.warn(
          `[Product Media Organizer] Could not delete old object ${change.oldKey}: ${
            error?.message || error
          }`
        )
      }
    }

    logger.info(
      `[Product Media Organizer] DONE - ${changes.length} image(s) organized`
    )
  } catch (error: any) {
    logger.error(
      `[Product Media Organizer] Error: ${
        error?.message || error
      }`
    )
  } finally {
    processingProducts.delete(productId)
  }
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
  ],
}