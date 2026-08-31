import { model } from "@medusajs/framework/utils"

export const MegaMenuPromo = model.define("mega_menu_promo", {
  id: model.id().primaryKey(),

  // MENU
  menu_key: model.text(),

  // CONTENT
  title: model.text().nullable(),
  subtitle: model.text().nullable(),

  // IMAGE
  image_url: model.text(),
  object_position: model.text().default("center"),
  image_focus_x: model.number().default(50),
  image_focus_y: model.number().default(50),

  // TITLE STYLE
  title_font_family: model.text().default("Inter"),
  title_font_style: model.text().default("normal"),
  title_text_transform: model.text().default("none"),
  title_color: model.text().default("#FFFFFF"),
  title_size: model.number().default(24),
  title_weight: model.number().default(600),
  title_letter_spacing: model.number().default(0),
  title_line_height: model.number().default(1.1),
  title_offset_x: model.number().default(0),
  title_offset_y: model.number().default(0),

  // SUBTITLE / EYEBROW STYLE
  subtitle_font_family: model.text().default("Inter"),
  subtitle_font_style: model.text().default("normal"),
  subtitle_text_transform: model.text().default("none"),
  subtitle_color: model.text().default("#FFFFFF"),
  subtitle_size: model.number().default(14),
  subtitle_weight: model.number().default(400),
  subtitle_letter_spacing: model.number().default(0),
  subtitle_line_height: model.number().default(1.4),
  subtitle_offset_x: model.number().default(0),
  subtitle_offset_y: model.number().default(0),

  // WHOLE CONTENT POSITION
  text_align: model.text().default("center"),
  horizontal_position: model.text().default("center"),
  vertical_position: model.text().default("bottom"),
  content_offset_x: model.number().default(0),
  content_offset_y: model.number().default(0),

  // OVERLAY
  overlay_color: model.text().default("#000000"),
  overlay_opacity: model.number().default(15),

  // BUTTON
  button_text: model.text().nullable(),
  button_url: model.text().nullable(),
  button_bg_color: model.text().default("#FFFFFF"),
  button_text_color: model.text().default("#000000"),
  button_size: model.number().default(12),
  button_offset_x: model.number().default(0),
  button_offset_y: model.number().default(0),

  // ORDER / STATUS
  position: model.number().default(0),
  is_active: model.boolean().default(true),
})