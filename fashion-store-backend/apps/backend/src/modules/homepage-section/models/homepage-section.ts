import { model } from "@medusajs/framework/utils"

export const HomepageSection = model.define("homepage_section", {
  id: model.id().primaryKey(),

  type: model.text(),

  title: model.text().nullable(),

  position: model.number().default(0),

  is_active: model.boolean().default(true),

  config: model.json().nullable(),
})