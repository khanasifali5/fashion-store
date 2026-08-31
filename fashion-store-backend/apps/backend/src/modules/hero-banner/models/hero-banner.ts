import { model } from "@medusajs/framework/utils"

export const HeroBanner = model.define("hero_banner", {
  id: model.id().primaryKey(),

  // =========================
  // MEDIA
  // =========================

  media_url: model.text(),

  media_type: model.text().default("image"),

  /*
   * DESKTOP HERO HEIGHT
   *
   * Desktop / narrow-desktop keep this height while width changes.
   * Media crops with object-cover instead of shrinking the whole
   * Hero proportionally.
   */
  hero_height: model.number().default(720),

  /*
   * Optional mobile artwork override.
   * Empty mobile_media_url = reuse desktop media.
   */
  mobile_media_url: model.text().nullable(),

  mobile_media_type: model.text().default("image"),

  /*
   * Mobile frame height used below the mobile breakpoint.
   */
  mobile_height: model.number().default(540),

  // =========================
  // CONTENT
  // =========================

  eyebrow: model.text().nullable(),

  title: model.text().nullable(),

  subtitle: model.text().nullable(),

  // =========================
  // EYEBROW TYPOGRAPHY
  // =========================

  eyebrow_font_family: model.text().default("Inter"),

  eyebrow_font_style: model.text().default("normal"),

  eyebrow_text_transform: model.text().default("uppercase"),

  eyebrow_color: model.text().default("#FFFFFF"),

  eyebrow_size: model.number().default(14),

  eyebrow_weight: model.number().default(600),

  eyebrow_letter_spacing: model.number().default(2),

  eyebrow_line_height: model.number().default(1.2),

  // =========================
  // TITLE TYPOGRAPHY
  // =========================

  title_font_family: model.text().default("Playfair Display"),

  title_font_style: model.text().default("normal"),

  title_text_transform: model.text().default("none"),

  title_color: model.text().default("#FFFFFF"),

  title_size: model.number().default(64),

  /*
   * Legacy field kept for DB/API compatibility.
   * New Admin stores title_size here as well.
   */
  title_mobile_size: model.number().default(38),

  title_weight: model.number().default(700),

  title_letter_spacing: model.number().default(0),

  title_line_height: model.number().default(1),

  // =========================
  // SUBTITLE TYPOGRAPHY
  // =========================

  subtitle_font_family: model.text().default("Inter"),

  subtitle_font_style: model.text().default("normal"),

  subtitle_text_transform: model.text().default("none"),

  subtitle_color: model.text().default("#FFFFFF"),

  subtitle_size: model.number().default(18),

  /*
   * Legacy field kept for DB/API compatibility.
   */
  subtitle_mobile_size: model.number().default(15),

  subtitle_weight: model.number().default(400),

  subtitle_letter_spacing: model.number().default(0),

  subtitle_line_height: model.number().default(1.5),

  // =========================
  // CONTENT POSITION
  // =========================

  text_align: model.text().default("center"),

  vertical_position: model.text().default("center"),

  horizontal_position: model.text().default("center"),

  content_offset_x: model.number().default(0),

  content_offset_y: model.number().default(0),

  // =========================
  // PRIMARY BUTTON
  // =========================

  button_text: model.text().nullable(),

  button_url: model.text().nullable(),

  button_bg_color: model.text().default("#765633"),

  button_text_color: model.text().default("#FFFFFF"),

  button_size: model.number().default(13),

  // =========================
  // SECONDARY BUTTON
  // =========================

  secondary_button_text: model.text().nullable(),

  secondary_button_url: model.text().nullable(),

  secondary_button_bg_color: model.text().default("transparent"),

  secondary_button_text_color: model.text().default("#FFFFFF"),

  // =========================
  // MEDIA DISPLAY
  // =========================

  object_position: model.text().default("center"),

  // =========================
  // OVERLAY
  // =========================

  overlay_color: model.text().default("#000000"),

  overlay_opacity: model.number().default(10),

  // =========================
  // SLIDER
  // =========================

  position: model.number().default(0),

  is_active: model.boolean().default(true),

  autoplay_duration: model.number().default(6000),
})