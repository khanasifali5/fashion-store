import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  Modules,
} from "@medusajs/framework/utils"

import {
  HERO_BANNER_MODULE,
} from "../../../modules/hero-banner"

import HeroBannerModuleService from "../../../modules/hero-banner/service"

const ORGANIZE_EVENT =
  "safafi.hero-banner-media.organize"

const numberOr = (
  value: unknown,
  fallback: number
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

const nullableDate = (
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

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<HeroBannerModuleService>(
        HERO_BANNER_MODULE
      )

    const banners =
      await (service as any).listHeroBanners()

    res.json({
      hero_banners: banners,
    })
  } catch (error) {
    console.error(
      "HERO BANNER GET ERROR:",
      error
    )

    res.status(500).json({
      message:
        "Failed to load hero banners",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
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

    const body =
      req.body as Record<
        string,
        any
      >

    if (!body.media_url) {
      return res
        .status(400)
        .json({
          message:
            "media_url is required",
        })
    }

    const startsAt =
      nullableDate(
        body.starts_at
      )

    const endsAt =
      nullableDate(
        body.ends_at
      )

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

    const banner =
      await (service as any).createHeroBanners({
        ...body,

        hero_height:
          Math.max(
            360,
            numberOr(
              body.hero_height,
              720
            )
          ),

        mobile_height:
          Math.max(
            400,
            numberOr(
              body.mobile_height,
              540
            )
          ),

        desktop_focal_x:
          clamp(
            numberOr(
              body.desktop_focal_x,
              50
            ),
            0,
            100
          ),

        desktop_focal_y:
          clamp(
            numberOr(
              body.desktop_focal_y,
              50
            ),
            0,
            100
          ),

        mobile_focal_x:
          body.mobile_focal_x === null ||
          body.mobile_focal_x === undefined ||
          body.mobile_focal_x === ""
            ? null
            : clamp(
                numberOr(
                  body.mobile_focal_x,
                  50
                ),
                0,
                100
              ),

        mobile_focal_y:
          body.mobile_focal_y === null ||
          body.mobile_focal_y === undefined ||
          body.mobile_focal_y === ""
            ? null
            : clamp(
                numberOr(
                  body.mobile_focal_y,
                  50
                ),
                0,
                100
              ),

        eyebrow_size:
          numberOr(
            body.eyebrow_size,
            14
          ),

        eyebrow_weight:
          numberOr(
            body.eyebrow_weight,
            600
          ),

        eyebrow_letter_spacing:
          numberOr(
            body.eyebrow_letter_spacing,
            2
          ),

        eyebrow_line_height:
          numberOr(
            body.eyebrow_line_height,
            1.2
          ),

        title_size:
          numberOr(
            body.title_size,
            64
          ),

        title_mobile_size:
          numberOr(
            body.title_mobile_size,
            38
          ),

        title_weight:
          numberOr(
            body.title_weight,
            700
          ),

        title_letter_spacing:
          numberOr(
            body.title_letter_spacing,
            0
          ),

        title_line_height:
          numberOr(
            body.title_line_height,
            1
          ),

        subtitle_size:
          numberOr(
            body.subtitle_size,
            18
          ),

        subtitle_mobile_size:
          numberOr(
            body.subtitle_mobile_size,
            15
          ),

        subtitle_weight:
          numberOr(
            body.subtitle_weight,
            400
          ),

        subtitle_letter_spacing:
          numberOr(
            body.subtitle_letter_spacing,
            0
          ),

        subtitle_line_height:
          numberOr(
            body.subtitle_line_height,
            1.5
          ),

        mobile_typography_override:
          body.mobile_typography_override === true,

        content_offset_x:
          numberOr(
            body.content_offset_x,
            0
          ),

        content_offset_y:
          numberOr(
            body.content_offset_y,
            0
          ),

        content_max_width:
          Math.max(
            240,
            numberOr(
              body.content_max_width,
              620
            )
          ),

        mobile_content_offset_x:
          nullableNumber(
            body.mobile_content_offset_x
          ),

        mobile_content_offset_y:
          nullableNumber(
            body.mobile_content_offset_y
          ),

        mobile_content_max_width:
          Math.max(
            220,
            numberOr(
              body.mobile_content_max_width,
              340
            )
          ),

        button_size:
          Math.max(
            8,
            numberOr(
              body.button_size,
              13
            )
          ),

        overlay_opacity:
          clamp(
            numberOr(
              body.overlay_opacity,
              10
            ),
            0,
            100
          ),

        position:
          numberOr(
            body.position,
            0
          ),

        autoplay_duration:
          Math.max(
            1000,
            numberOr(
              body.autoplay_duration,
              6000
            )
          ),

        is_active:
          body.is_active ??
          true,

        starts_at:
          startsAt,

        ends_at:
          endsAt,
      })

    /*
     * The Hero record is now saved successfully.
     * Only now request media organization.
     *
     * Images/videos have already passed through the
     * optimized R2 upload provider before this point.
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
          id:
            banner.id,
          mode:
            "organize",
        },
      })
    } catch (
      organizerEventError
    ) {
      console.error(
        `Hero ${banner.id} was created successfully, but the media organizer event could not be emitted:`,
        organizerEventError
      )
    }

    res.status(201).json({
      hero_banner:
        banner,
    })
  } catch (error) {
    console.error(
      "HERO BANNER POST ERROR:",
      error
    )

    res.status(500).json({
      message:
        "Failed to create hero banner",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}
