import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { HERO_BANNER_MODULE } from "../../../../modules/hero-banner"
import HeroBannerModuleService from "../../../../modules/hero-banner/service"

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

    const banner =
      await (service as any).updateHeroBanners({
        id,
        ...body,

        hero_height:
          body.hero_height !==
          undefined
            ? Number(
                body.hero_height
              )
            : undefined,

        mobile_height:
          body.mobile_height !==
          undefined
            ? Number(
                body.mobile_height
              )
            : undefined,

        position:
          body.position !==
          undefined
            ? Number(
                body.position
              )
            : undefined,

        eyebrow_size:
          body.eyebrow_size !==
          undefined
            ? Number(
                body.eyebrow_size
              )
            : undefined,

        title_size:
          body.title_size !==
          undefined
            ? Number(
                body.title_size
              )
            : undefined,

        title_mobile_size:
          body.title_mobile_size !==
          undefined
            ? Number(
                body.title_mobile_size
              )
            : undefined,

        subtitle_size:
          body.subtitle_size !==
          undefined
            ? Number(
                body.subtitle_size
              )
            : undefined,

        subtitle_mobile_size:
          body.subtitle_mobile_size !==
          undefined
            ? Number(
                body.subtitle_mobile_size
              )
            : undefined,

        overlay_opacity:
          body.overlay_opacity !==
          undefined
            ? Number(
                body.overlay_opacity
              )
            : undefined,

        content_offset_x:
          body.content_offset_x !==
          undefined
            ? Number(
                body.content_offset_x
              )
            : undefined,

        content_offset_y:
          body.content_offset_y !==
          undefined
            ? Number(
                body.content_offset_y
              )
            : undefined,

        autoplay_duration:
          body.autoplay_duration !==
          undefined
            ? Number(
                body.autoplay_duration
              )
            : undefined,
      })

    res.json({
      hero_banner: banner,
    })
  } catch (error) {
    console.error(
      "UPDATE HERO BANNER ERROR:",
      error
    )

    res.status(500).json({
      message:
        "Failed to update hero banner",
      error:
        error instanceof Error
          ? error.message
          : String(error),
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

    await (service as any).deleteHeroBanners(
      id
    )

    res.status(200).json({
      id,
      deleted: true,
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
