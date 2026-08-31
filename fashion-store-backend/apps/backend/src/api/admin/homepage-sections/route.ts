import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { HOMEPAGE_SECTION_MODULE } from "../../../modules/homepage-section"
import HomepageSectionModuleService from "../../../modules/homepage-section/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<HomepageSectionModuleService>(
        HOMEPAGE_SECTION_MODULE
      )

    const sections =
      await (service as any).listHomepageSections()

    res.json({
      homepage_sections: sections,
    })
  } catch (error) {
    console.error(
      "ADMIN HOMEPAGE SECTIONS GET ERROR:",
      error
    )

    res.status(500).json({
      message: "Failed to load homepage sections",
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
      req.scope.resolve<HomepageSectionModuleService>(
        HOMEPAGE_SECTION_MODULE
      )

    const body = req.body as {
      type: string
      title?: string | null
      position?: number
      is_active?: boolean
      config?: Record<string, unknown> | null
    }

    if (!body.type) {
      return res.status(400).json({
        message: "type is required",
      })
    }

    const section =
      await (service as any).createHomepageSections({
        type: body.type,
        title: body.title ?? null,
        position: body.position ?? 0,
        is_active: body.is_active ?? true,
        config: body.config ?? null,
      })

    res.status(201).json({
      homepage_section: section,
    })
  } catch (error) {
    console.error(
      "ADMIN HOMEPAGE SECTIONS POST ERROR:",
      error
    )

    res.status(500).json({
      message: "Failed to create homepage section",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}