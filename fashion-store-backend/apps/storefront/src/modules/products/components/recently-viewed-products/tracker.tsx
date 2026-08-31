"use client"

import { useEffect } from "react"

const COOKIE_KEY =
  "safafi_recently_viewed_product_ids_v1"

const LEGACY_STORAGE_KEY =
  "safafi_recently_viewed_products_v1"

const MAX_STORED_PRODUCTS = 12
const COOKIE_MAX_AGE =
  60 * 60 * 24 * 30

const readCookieIds = (): string[] => {
  try {
    const cookie =
      document.cookie
        .split("; ")
        .find((item) =>
          item.startsWith(
            `${COOKIE_KEY}=`
          )
        )

    if (!cookie) {
      return []
    }

    const raw =
      cookie.substring(
        COOKIE_KEY.length + 1
      )

    const parsed =
      JSON.parse(
        decodeURIComponent(raw)
      )

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item): item is string =>
        typeof item === "string" &&
        Boolean(item.trim())
    )
  } catch {
    return []
  }
}

const readLegacyIds = (): string[] => {
  /*
   * Migrate IDs from the old localStorage snapshot implementation,
   * so users don't lose their existing Recently Viewed history.
   */
  try {
    const raw =
      window.localStorage.getItem(
        LEGACY_STORAGE_KEY
      )

    if (!raw) {
      return []
    }

    const parsed =
      JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string"
          ? item.id
          : null
      )
      .filter(
        (
          id
        ): id is string =>
          Boolean(id)
      )
  } catch {
    return []
  }
}

const writeCookieIds = (
  ids: string[]
) => {
  const value =
    encodeURIComponent(
      JSON.stringify(ids)
    )

  document.cookie =
    `${COOKIE_KEY}=${value}; ` +
    `Path=/; ` +
    `Max-Age=${COOKIE_MAX_AGE}; ` +
    `SameSite=Lax`
}

export default function RecentlyViewedTracker({
  productId,
}: {
  productId: string
}) {
  useEffect(() => {
    const currentCookieIds =
      readCookieIds()

    const legacyIds =
      readLegacyIds()

    const mergedPrevious =
      Array.from(
        new Set([
          ...currentCookieIds,
          ...legacyIds,
        ])
      )

    const nextIds =
      [
        productId,
        ...mergedPrevious.filter(
          (id) =>
            id !== productId
        ),
      ].slice(
        0,
        MAX_STORED_PRODUCTS
      )

    writeCookieIds(
      nextIds
    )
  }, [productId])

  return null
}