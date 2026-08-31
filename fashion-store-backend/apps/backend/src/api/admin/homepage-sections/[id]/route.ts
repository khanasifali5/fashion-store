import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { HOMEPAGE_SECTION_MODULE } from "../../../../modules/homepage-section"
import HomepageSectionModuleService from "../../../../modules/homepage-section/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const service =
      req.scope.resolve<HomepageSectionModuleService>(
        HOMEPAGE_SECTION_MODULE
      )

    const { id } = req.params

    const body = req.body as {
      type?: string
      title?: string | null
      position?: number
      is_active?: boolean
      config?: Record<string, unknown> | null
    }

    const section =
      await (service as any).updateHomepageSections({
        id,
        ...body,
      })

    res.json({
      homepage_section: section,
    })
  } catch (error) {
    console.error(
      "UPDATE HOMEPAGE SECTION ERROR:",
      error
    )

    res.status(500).json({
      message: "Failed to update homepage section",
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
      req.scope.resolve<HomepageSectionModuleService>(
        HOMEPAGE_SECTION_MODULE
      )

    const { id } = req.params

    await (service as any).deleteHomepageSections(id)

    res.status(200).json({
      id,
      deleted: true,
    })
  } catch (error) {
    console.error(
      "DELETE HOMEPAGE SECTION ERROR:",
      error
    )

    res.status(500).json({
      message: "Failed to delete homepage section",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })
  }
}