import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import {
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

import { createHash } from "node:crypto"

import { HERO_BANNER_MODULE } from "../modules/hero-banner"
import HeroBannerModuleService from "../modules/hero-banner/service"

const EVENT = "safafi.hero-banner-media.organize"
const processing = new Set<string>()

type EventData = {
  id: string
  mode?: "organize" | "cleanup"
  cleanup_urls?: string[]
}

type HeroLike = Record<string, any> & {
  id: string
}

const MEDIA_FIELDS = [
  {
    field: "media_url",
    role: "desktop",
    typeField: "media_type",
    fallbackType: "image",
  },
  {
    field: "mobile_media_url",
    role: "mobile",
    typeField: "mobile_media_type",
    fallbackType: "image",
  },
  {
    field: "poster_url",
    role: "desktop-poster",
    fallbackType: "image",
  },
  {
    field: "mobile_poster_url",
    role: "mobile-poster",
    fallbackType: "image",
  },
] as const

const wait = (ms: number) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, ms)
  )

function isNotFound(error: any) {
  const status = error?.$metadata?.httpStatusCode

  return (
    status === 404 ||
    error?.name === "NotFound" ||
    error?.name === "NoSuchKey" ||
    error?.Code === "NoSuchKey" ||
    error?.code === "NoSuchKey"
  )
}

function getKeyFromUrl(
  url: string,
  publicBase: string
): string | null {
  const base = publicBase.replace(/\/+$/, "")

  if (!url.startsWith(base + "/")) {
    return null
  }

  const raw = url.slice(base.length + 1)

  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function getExtension(
  url: string,
  mediaType: "image" | "video"
) {
  try {
    const match = new URL(url).pathname.match(
      /\.[a-zA-Z0-9]+$/
    )

    if (match?.[0]) {
      return match[0].toLowerCase()
    }
  } catch {}

  return mediaType === "video" ? ".mp4" : ".webp"
}

function tokenFor(key: string) {
  return createHash("sha1")
    .update(key)
    .digest("hex")
    .slice(0, 12)
}

function collectUrls(
  banner?: HeroLike | null
): string[] {
  if (!banner) {
    return []
  }

  return MEDIA_FIELDS
    .map(({ field }) => banner[field])
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        Boolean(value)
    )
}

async function objectExists(
  s3: S3Client,
  bucket: string,
  key: string
) {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )

    return true
  } catch (error: any) {
    if (isNotFound(error)) {
      return false
    }

    throw error
  }
}

async function deleteVerified(
  s3: S3Client,
  bucket: string,
  key: string
) {
  const delays = [0, 250, 750, 1500]
  let lastError: unknown = null

  for (const delay of delays) {
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

      if (
        !(await objectExists(
          s3,
          bucket,
          key
        ))
      ) {
        return
      }

      lastError = new Error(
        `R2 still reports object after delete: ${key}`
      )
    } catch (error) {
      lastError = error
    }
  }

  throw (
    lastError ??
    new Error(
      `Unable to verify deletion of ${key}`
    )
  )
}

async function referencedHeroUrls(
  service: HeroBannerModuleService
) {
  const banners =
    await (service as any).listHeroBanners()

  const urls = new Set<string>()

  for (const banner of banners ?? []) {
    for (const url of collectUrls(banner)) {
      urls.add(url)
    }
  }

  return urls
}

async function cleanupUrls({
  urls,
  service,
  s3,
  bucket,
  publicBase,
  logger,
}: {
  urls: string[]
  service: HeroBannerModuleService
  s3: S3Client
  bucket: string
  publicBase: string
  logger: any
}) {
  if (!urls.length) {
    return
  }

  const referenced =
    await referencedHeroUrls(service)

  for (
    const url of Array.from(
      new Set(urls.filter(Boolean))
    )
  ) {
    if (referenced.has(url)) {
      logger.info(
        `[Hero Media Organizer] Cleanup skipped; still referenced: ${url}`
      )
      continue
    }

    const key = getKeyFromUrl(
      url,
      publicBase
    )

    if (!key) {
      logger.info(
        `[Hero Media Organizer] External/non-R2 URL skipped: ${url}`
      )
      continue
    }

    try {
      await deleteVerified(
        s3,
        bucket,
        key
      )

      logger.info(
        `[Hero Media Organizer] Old object deleted + verified: ${key}`
      )
    } catch (error: any) {
      logger.error(
        `[Hero Media Organizer] SOURCE CLEANUP FAILED ${key}: ${
          error?.message || error
        }`
      )
    }
  }
}

export default async function heroBannerMediaOrganizer({
  event: { data },
  container,
}: SubscriberArgs<EventData>) {
  const logger = container.resolve(
    ContainerRegistrationKeys.LOGGER
  )

  const bannerId = data.id
  const mode = data.mode ?? "organize"

  if (!bannerId) {
    logger.warn(
      "[Hero Media Organizer] Missing Hero banner ID"
    )
    return
  }

  const processKey = `${mode}:${bannerId}`

  if (processing.has(processKey)) {
    logger.info(
      `[Hero Media Organizer] Already processing ${processKey} - skip`
    )
    return
  }

  processing.add(processKey)

  const copiedDestinationKeys: string[] = []

  try {
    const publicBase =
      process.env.S3_FILE_URL?.replace(
        /\/+$/,
        ""
      )

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

    const service =
      container.resolve<HeroBannerModuleService>(
        HERO_BANNER_MODULE
      )

    const s3 = new S3Client({
      region:
        process.env.S3_REGION ||
        "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    if (mode === "cleanup") {
      await cleanupUrls({
        urls:
          data.cleanup_urls ?? [],
        service,
        s3,
        bucket,
        publicBase,
        logger,
      })

      logger.info(
        `[Hero Media Organizer] Cleanup complete for ${bannerId}`
      )
      return
    }

    const banner =
      await (service as any).retrieveHeroBanner(
        bannerId
      )

    if (!banner) {
      logger.warn(
        `[Hero Media Organizer] Hero not found: ${bannerId}`
      )
      return
    }

    const folder =
      `hero-banners/hero_${bannerId}`

    logger.info(
      `[Hero Media Organizer] Folder: ${folder}/`
    )

    const movedByOldKey = new Map<
      string,
      {
        oldUrl: string
        oldKey: string
        newUrl: string
        newKey: string
      }
    >()

    const updates: Record<
      string,
      string
    > = {}

    for (const config of MEDIA_FIELDS) {
      const url =
        banner[config.field]

      if (
        typeof url !== "string" ||
        !url
      ) {
        continue
      }

      const oldKey =
        getKeyFromUrl(
          url,
          publicBase
        )

      if (!oldKey) {
        logger.warn(
          `[Hero Media Organizer] External/non-R2 media skipped (${config.field}): ${url}`
        )
        continue
      }

      if (
        oldKey.startsWith(
          `${folder}/`
        )
      ) {
        logger.info(
          `[Hero Media Organizer] Already organized (${config.field}): ${oldKey}`
        )
        continue
      }

      const reused =
        movedByOldKey.get(oldKey)

      if (reused) {
        updates[config.field] =
          reused.newUrl
        continue
      }

      const rawType =
        "typeField" in config &&
        config.typeField
          ? banner[
              config.typeField
            ]
          : config.fallbackType

      const mediaType:
        | "image"
        | "video" =
        rawType === "video"
          ? "video"
          : "image"

      const extension =
        getExtension(
          url,
          mediaType
        )

      const newKey =
        `${folder}/${config.role}-${tokenFor(
          oldKey
        )}${extension}`

      const newUrl =
        `${publicBase}/${newKey}`

      if (
        !(await objectExists(
          s3,
          bucket,
          newKey
        ))
      ) {
        logger.info(
          `[Hero Media Organizer] Copying ${oldKey} -> ${newKey}`
        )

        await s3.send(
          new CopyObjectCommand({
            Bucket: bucket,
            Key: newKey,
            CopySource: encodeURI(
              `/${bucket}/${oldKey}`
            ),
            MetadataDirective:
              "COPY",
          })
        )

        if (
          !(await objectExists(
            s3,
            bucket,
            newKey
          ))
        ) {
          throw new Error(
            `Copied destination could not be verified: ${newKey}`
          )
        }

        copiedDestinationKeys.push(
          newKey
        )
      }

      const move = {
        oldUrl: url,
        oldKey,
        newUrl,
        newKey,
      }

      movedByOldKey.set(
        oldKey,
        move
      )

      updates[config.field] =
        newUrl
    }

    if (
      Object.keys(updates).length
    ) {
      await (service as any).updateHeroBanners({
        id: bannerId,
        ...updates,
      })

      logger.info(
        "[Hero Media Organizer] Medusa URLs updated"
      )
    }

    const referenced =
      await referencedHeroUrls(
        service
      )

    for (
      const move of
      movedByOldKey.values()
    ) {
      if (
        referenced.has(
          move.oldUrl
        )
      ) {
        logger.info(
          `[Hero Media Organizer] Source kept because another Hero still references it: ${move.oldKey}`
        )
        continue
      }

      try {
        await deleteVerified(
          s3,
          bucket,
          move.oldKey
        )

        logger.info(
          `[Hero Media Organizer] Source deleted + verified: ${move.oldKey}`
        )
      } catch (error: any) {
        logger.error(
          `[Hero Media Organizer] SOURCE CLEANUP FAILED ${move.oldKey}: ${
            error?.message || error
          }`
        )
      }
    }

    if (
      data.cleanup_urls?.length
    ) {
      await cleanupUrls({
        urls:
          data.cleanup_urls,
        service,
        s3,
        bucket,
        publicBase,
        logger,
      })
    }

    logger.info(
      `[Hero Media Organizer] DONE - ${bannerId}`
    )
  } catch (error: any) {
    if (
      copiedDestinationKeys.length
    ) {
      const bucket =
        process.env.S3_BUCKET

      const endpoint =
        process.env.S3_ENDPOINT

      const accessKeyId =
        process.env.S3_ACCESS_KEY_ID

      const secretAccessKey =
        process.env.S3_SECRET_ACCESS_KEY

      if (
        bucket &&
        endpoint &&
        accessKeyId &&
        secretAccessKey
      ) {
        const cleanupS3 =
          new S3Client({
            region:
              process.env.S3_REGION ||
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
            await deleteVerified(
              cleanupS3,
              bucket,
              key
            )
          } catch (
            cleanupError: any
          ) {
            logger.warn(
              `[Hero Media Organizer] Could not roll back ${key}: ${
                cleanupError?.message ||
                cleanupError
              }`
            )
          }
        }
      }
    }

    logger.error(
      `[Hero Media Organizer] Error: ${
        error?.message || error
      }`
    )
  } finally {
    processing.delete(
      processKey
    )
  }
}

export const config: SubscriberConfig = {
  event: EVENT,
}