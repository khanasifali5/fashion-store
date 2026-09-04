import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  Modules,
} from "@medusajs/framework/utils"

import {
  HERO_BANNER_MODULE,
} from "../../../../modules/hero-banner"

import HeroBannerModuleService from "../../../../modules/hero-banner/service"

const ORGANIZE_EVENT =
  "safafi.hero-banner-media.organize"

const hasOwn = (
  object: Record<string, any>,
  key: string
) =>
  Object.prototype.hasOwnProperty.call(
    object,
    key
  )

const toNumber = (
  value: unknown,
  fallback = 0
) => {
  const parsed = Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : fallback
}

const nullableNumber = (
  value: unknown
): number | null => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : null
}

const clamp = (
  value: number,
  min: number,
  max: number
) =>
  Math.min(
    max,
    Math.max(min, value)
  )

const parseDate = (
  value: unknown
): Date | null => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null
  }

  const date = new Date(
    String(value)
  )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid date value."
    )
  }

  return date
}

const collectMediaUrls = (
  banner:
    | Record<string, any>
    | null
    | undefined
): string[] => {
  if (!banner) {
    return []
  }

  return [
    banner.media_url,
    banner.mobile_media_url,
    banner.poster_url,
    banner.mobile_poster_url,
  ].filter(
    (
      value
    ): value is string =>
      typeof value === "string" &&
      Boolean(
        value.trim()
      )
  )
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<HeroBannerModuleService>(
        HERO_BANNER_MODULE
      )

    const { id } =
      req.params

    const body =
      req.body as Record<
        string,
        any
      >

    /*
     * Keep the old URLs before update.
     * After a successful save the organizer can safely
     * remove media that was replaced or removed.
     */
    const existing =
      await (service as any).retrieveHeroBanner(
        id
      )

    if (!existing) {
      return res
        .status(404)
        .json({
          message:
            "Hero banner not found.",
        })
    }

    const oldMediaUrls =
      collectMediaUrls(
        existing
      )

    const updateData:
      Record<string, any> = {
        id,
        ...body,
      }

    if (
      hasOwn(
        body,
        "hero_height"
      )
    ) {
      updateData.hero_height =
        Math.max(
          360,
          toNumber(
            body.hero_height,
            720
          )
        )
    }

    if (
      hasOwn(
        body,
        "mobile_height"
      )
    ) {
      updateData.mobile_height =
        Math.max(
          400,
          toNumber(
            body.mobile_height,
            540
          )
        )
    }

    if (
      hasOwn(
        body,
        "desktop_focal_x"
      )
    ) {
      updateData.desktop_focal_x =
        clamp(
          toNumber(
            body.desktop_focal_x,
            50
          ),
          0,
          100
        )
    }

    if (
      hasOwn(
        body,
        "desktop_focal_y"
      )
    ) {
      updateData.desktop_focal_y =
        clamp(
          toNumber(
            body.desktop_focal_y,
            50
          ),
          0,
          100
        )
    }

    if (
      hasOwn(
        body,
        "mobile_focal_x"
      )
    ) {
      const value =
        nullableNumber(
          body.mobile_focal_x
        )

      updateData.mobile_focal_x =
        value === null
          ? null
          : clamp(
              value,
              0,
              100
            )
    }

    if (
      hasOwn(
        body,
        "mobile_focal_y"
      )
    ) {
      const value =
        nullableNumber(
          body.mobile_focal_y
        )

      updateData.mobile_focal_y =
        value === null
          ? null
          : clamp(
              value,
              0,
              100
            )
    }

    if (
      hasOwn(
        body,
        "eyebrow_size"
      )
    ) {
      updateData.eyebrow_size =
        toNumber(
          body.eyebrow_size,
          14
        )
    }

    if (
      hasOwn(
        body,
        "eyebrow_weight"
      )
    ) {
      updateData.eyebrow_weight =
        toNumber(
          body.eyebrow_weight,
          600
        )
    }

    if (
      hasOwn(
        body,
        "eyebrow_letter_spacing"
      )
    ) {
      updateData.eyebrow_letter_spacing =
        toNumber(
          body.eyebrow_letter_spacing,
          2
        )
    }

    if (
      hasOwn(
        body,
        "eyebrow_line_height"
      )
    ) {
      updateData.eyebrow_line_height =
        toNumber(
          body.eyebrow_line_height,
          1.2
        )
    }

    if (
      hasOwn(
        body,
        "title_size"
      )
    ) {
      updateData.title_size =
        toNumber(
          body.title_size,
          64
        )
    }

    if (
      hasOwn(
        body,
        "title_mobile_size"
      )
    ) {
      updateData.title_mobile_size =
        toNumber(
          body.title_mobile_size,
          38
        )
    }

    if (
      hasOwn(
        body,
        "title_weight"
      )
    ) {
      updateData.title_weight =
        toNumber(
          body.title_weight,
          700
        )
    }

    if (
      hasOwn(
        body,
        "title_letter_spacing"
      )
    ) {
      updateData.title_letter_spacing =
        toNumber(
          body.title_letter_spacing,
          0
        )
    }

    if (
      hasOwn(
        body,
        "title_line_height"
      )
    ) {
      updateData.title_line_height =
        toNumber(
          body.title_line_height,
          1
        )
    }

    if (
      hasOwn(
        body,
        "subtitle_size"
      )
    ) {
      updateData.subtitle_size =
        toNumber(
          body.subtitle_size,
          18
        )
    }

    if (
      hasOwn(
        body,
        "subtitle_mobile_size"
      )
    ) {
      updateData.subtitle_mobile_size =
        toNumber(
          body.subtitle_mobile_size,
          15
        )
    }

    if (
      hasOwn(
        body,
        "subtitle_weight"
      )
    ) {
      updateData.subtitle_weight =
        toNumber(
          body.subtitle_weight,
          400
        )
    }

    if (
      hasOwn(
        body,
        "subtitle_letter_spacing"
      )
    ) {
      updateData.subtitle_letter_spacing =
        toNumber(
          body.subtitle_letter_spacing,
          0
        )
    }

    if (
      hasOwn(
        body,
        "subtitle_line_height"
      )
    ) {
      updateData.subtitle_line_height =
        toNumber(
          body.subtitle_line_height,
          1.5
        )
    }

    if (
      hasOwn(
        body,
        "mobile_typography_override"
      )
    ) {
      updateData.mobile_typography_override =
        body.mobile_typography_override === true
    }

    if (
      hasOwn(
        body,
        "content_offset_x"
      )
    ) {
      updateData.content_offset_x =
        toNumber(
          body.content_offset_x,
          0
        )
    }

    if (
      hasOwn(
        body,
        "content_offset_y"
      )
    ) {
      updateData.content_offset_y =
        toNumber(
          body.content_offset_y,
          0
        )
    }

    if (
      hasOwn(
        body,
        "content_max_width"
      )
    ) {
      updateData.content_max_width =
        Math.max(
          240,
          toNumber(
            body.content_max_width,
            620
          )
        )
    }

    if (
      hasOwn(
        body,
        "mobile_content_offset_x"
      )
    ) {
      updateData.mobile_content_offset_x =
        nullableNumber(
          body.mobile_content_offset_x
        )
    }

    if (
      hasOwn(
        body,
        "mobile_content_offset_y"
      )
    ) {
      updateData.mobile_content_offset_y =
        nullableNumber(
          body.mobile_content_offset_y
        )
    }

    if (
      hasOwn(
        body,
        "mobile_content_max_width"
      )
    ) {
      updateData.mobile_content_max_width =
        Math.max(
          220,
          toNumber(
            body.mobile_content_max_width,
            340
          )
        )
    }

    if (
      hasOwn(
        body,
        "button_size"
      )
    ) {
      updateData.button_size =
        Math.max(
          8,
          toNumber(
            body.button_size,
            13
          )
        )
    }

    if (
      hasOwn(
        body,
        "overlay_opacity"
      )
    ) {
      updateData.overlay_opacity =
        clamp(
          toNumber(
            body.overlay_opacity,
            10
          ),
          0,
          100
        )
    }

    if (
      hasOwn(
        body,
        "position"
      )
    ) {
      updateData.position =
        toNumber(
          body.position,
          0
        )
    }

    if (
      hasOwn(
        body,
        "autoplay_duration"
      )
    ) {
      updateData.autoplay_duration =
        Math.max(
          1000,
          toNumber(
            body.autoplay_duration,
            6000
          )
        )
    }

    if (
      hasOwn(
        body,
        "is_active"
      )
    ) {
      updateData.is_active =
        body.is_active === true
    }

    const existingStartsAt =
      existing.starts_at
        ? new Date(
            existing.starts_at
          )
        : null

    const existingEndsAt =
      existing.ends_at
        ? new Date(
            existing.ends_at
          )
        : null

    const startsAt =
      hasOwn(
        body,
        "starts_at"
      )
        ? parseDate(
            body.starts_at
          )
        : existingStartsAt

    const endsAt =
      hasOwn(
        body,
        "ends_at"
      )
        ? parseDate(
            body.ends_at
          )
        : existingEndsAt

    if (
      startsAt &&
      endsAt &&
      endsAt <= startsAt
    ) {
      return res
        .status(400)
        .json({
          message:
            "Publish end time must be after publish start time.",
        })
    }

    if (
      hasOwn(
        body,
        "starts_at"
      )
    ) {
      updateData.starts_at =
        startsAt
    }

    if (
      hasOwn(
        body,
        "ends_at"
      )
    ) {
      updateData.ends_at =
        endsAt
    }

    const banner =
      await (service as any).updateHeroBanners(
        updateData
      )

    /*
     * Save succeeded.
     *
     * Organizer now:
     * 1) moves current media to hero-banners/hero_<id>/;
     * 2) updates Hero URLs;
     * 3) removes replaced/removed old media only if no
     *    Hero banner still references those URLs.
     */
    try {
      const eventBus =
        req.scope.resolve(
          Modules.EVENT_BUS
        )

      await eventBus.emit({
        name:
          ORGANIZE_EVENT,
        data: {
          id,
          mode:
            "organize",
          cleanup_urls:
            oldMediaUrls,
        },
      })
    } catch (
      organizerEventError
    ) {
      console.error(
        `Hero ${id} was updated successfully, but the media organizer event could not be emitted:`,
        organizerEventError
      )
    }

    res.json({
      hero_banner:
        banner,
    })
  } catch (error) {
    console.error(
      "UPDATE HERO BANNER ERROR:",
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : String(error)

    if (
      message ===
      "Invalid date value."
    ) {
      return res
        .status(400)
        .json({
          message,
        })
    }

    res.status(500).json({
      message:
        "Failed to update hero banner",
      error:
        message,
    })
  }
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<HeroBannerModuleService>(
        HERO_BANNER_MODULE
      )

    const { id } =
      req.params

    const existing =
      await (service as any).retrieveHeroBanner(
        id
      )

    if (!existing) {
      return res
        .status(404)
        .json({
          message:
            "Hero banner not found.",
        })
    }

    const oldMediaUrls =
      collectMediaUrls(
        existing
      )

    /*
     * Delete DB record first.
     *
     * If R2 cleanup fails, we only get an orphan file.
     * We never delete media first and leave a live Hero
     * record pointing to a missing R2 object.
     */
    await (service as any).deleteHeroBanners(
      id
    )

    try {
      const eventBus =
        req.scope.resolve(
          Modules.EVENT_BUS
        )

      await eventBus.emit({
        name:
          ORGANIZE_EVENT,
        data: {
          id,
          mode:
            "cleanup",
          cleanup_urls:
            oldMediaUrls,
        },
      })
    } catch (
      organizerEventError
    ) {
      console.error(
        `Hero ${id} was deleted successfully, but its R2 cleanup event could not be emitted:`,
        organizerEventError
      )
    }

    res.status(200).json({
      id,
      deleted:
        true,
    })
  } catch (error) {
    console.error(
      "DELETE HERO BANNER ERROR:",
      error
    )

    res.status(500).json({
      message:
        "Failed to delete hero banner",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}
