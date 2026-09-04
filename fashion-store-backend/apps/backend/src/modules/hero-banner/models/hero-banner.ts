import { model } from "@medusajs/framework/utils"

export const HeroBanner = model.define("hero_banner", {
  id: model.id().primaryKey(),

  // =========================================================
  // MEDIA
  // =========================================================

  media_url: model.text(),

  media_type: model.text().default("image"),

  /*
   * Optional dedicated mobile artwork.
   * Empty = storefront reuses desktop media.
   */
  mobile_media_url: model.text().nullable(),

  mobile_media_type: model.text().default("image"),

  /*
   * Video poster / loading fallback.
   */
  poster_url: model.text().nullable(),

  mobile_poster_url: model.text().nullable(),

  /*
   * Accessibility text.
   */
  media_alt: model.text().nullable(),

  mobile_media_alt: model.text().nullable(),

  // =========================================================
  // HERO HEIGHT
  // =========================================================

  /*
   * Reference / maximum desktop Hero height.
   *
   * Storefront will later derive intermediate desktop/tablet
   * heights fluidly instead of keeping this exact height at
   * every width.
   */
  hero_height: model.number().default(720),

  /*
   * Mobile Hero reference height.
   */
  mobile_height: model.number().default(540),

  // =========================================================
  // MEDIA FOCAL POINT
  // =========================================================

  /*
   * Desktop focal point percentages.
   *
   * 50 / 50 = center.
   * Storefront converts these to:
   * object-position: X% Y%
   */
  desktop_focal_x: model.number().default(50),

  desktop_focal_y: model.number().default(50),

  /*
   * Null means:
   * use the desktop focal point on mobile.
   */
  mobile_focal_x: model.number().nullable(),

  mobile_focal_y: model.number().nullable(),

  /*
   * Legacy field retained for old banners / API compatibility.
   *
   * New Admin will primarily use focal X/Y.
   */
  object_position: model.text().default("center"),

  // =========================================================
  // CONTENT
  // =========================================================

  eyebrow: model.text().nullable(),

  title: model.text().nullable(),

  subtitle: model.text().nullable(),

  // =========================================================
  // EYEBROW TYPOGRAPHY
  // =========================================================

  eyebrow_font_family: model.text().default("Inter"),

  eyebrow_font_style: model.text().default("normal"),

  eyebrow_text_transform: model.text().default("uppercase"),

  eyebrow_color: model.text().default("#FFFFFF"),

  eyebrow_size: model.number().default(14),

  eyebrow_weight: model.number().default(600),

  eyebrow_letter_spacing: model.number().default(2),

  eyebrow_line_height: model.number().default(1.2),

  // =========================================================
  // TITLE TYPOGRAPHY
  // =========================================================

  title_font_family: model.text().default("Playfair Display"),

  title_font_style: model.text().default("normal"),

  title_text_transform: model.text().default("none"),

  title_color: model.text().default("#FFFFFF"),

  title_size: model.number().default(64),

  /*
   * Existing legacy field retained.
   *
   * It will become an OPTIONAL mobile override instead of
   * always mirroring title_size.
   */
  title_mobile_size: model.number().default(38),

  title_weight: model.number().default(700),

  title_letter_spacing: model.number().default(0),

  title_line_height: model.number().default(1),

  // =========================================================
  // SUBTITLE TYPOGRAPHY
  // =========================================================

  subtitle_font_family: model.text().default("Inter"),

  subtitle_font_style: model.text().default("normal"),

  subtitle_text_transform: model.text().default("none"),

  subtitle_color: model.text().default("#FFFFFF"),

  subtitle_size: model.number().default(18),

  /*
   * Existing legacy field retained as an optional
   * mobile typography override.
   */
  subtitle_mobile_size: model.number().default(15),

  subtitle_weight: model.number().default(400),

  subtitle_letter_spacing: model.number().default(0),

  subtitle_line_height: model.number().default(1.5),

  /*
   * IMPORTANT:
   *
   * Existing banners currently have mobile title/subtitle
   * values synchronized with desktop values.
   *
   * This flag prevents us from accidentally treating those
   * legacy values as intentional mobile overrides.
   */
  mobile_typography_override: model.boolean().default(false),

  // =========================================================
  // DESKTOP CONTENT POSITION
  // =========================================================

  text_align: model.text().default("center"),

  vertical_position: model.text().default("center"),

  horizontal_position: model.text().default("center"),

  content_offset_x: model.number().default(0),

  content_offset_y: model.number().default(0),

  /*
   * Keeps large titles from spreading across the whole Hero.
   */
  content_max_width: model.number().default(620),

  // =========================================================
  // MOBILE CONTENT POSITION OVERRIDE
  // =========================================================

  /*
   * Null = inherit desktop setting.
   */
  mobile_text_align: model.text().nullable(),

  mobile_vertical_position: model.text().nullable(),

  mobile_horizontal_position: model.text().nullable(),

  mobile_content_offset_x: model.number().nullable(),

  mobile_content_offset_y: model.number().nullable(),

  mobile_content_max_width: model.number().default(340),

  // =========================================================
  // PRIMARY BUTTON
  // =========================================================

  button_text: model.text().nullable(),

  button_url: model.text().nullable(),

  button_bg_color: model.text().default("#765633"),

  button_text_color: model.text().default("#FFFFFF"),

  button_size: model.number().default(13),

  /*
   * filled | outline | text
   */
  button_style: model.text().default("filled"),

  // =========================================================
  // SECONDARY BUTTON
  // =========================================================

  secondary_button_text: model.text().nullable(),

  secondary_button_url: model.text().nullable(),

  secondary_button_bg_color: model.text().default("transparent"),

  secondary_button_text_color: model.text().default("#FFFFFF"),

  /*
   * filled | outline | text
   */
  secondary_button_style: model.text().default("outline"),

  // =========================================================
  // OVERLAY
  // =========================================================

  overlay_color: model.text().default("#000000"),

  overlay_opacity: model.number().default(10),

  /*
   * none
   * solid
   * gradient
   */
  overlay_type: model.text().default("solid"),

  /*
   * full
   * left
   * right
   * bottom
   */
  overlay_direction: model.text().default("full"),

  // =========================================================
  // SLIDER
  // =========================================================

  position: model.number().default(0),

  is_active: model.boolean().default(true),

  autoplay_duration: model.number().default(6000),

  // =========================================================
  // PUBLISHING / CAMPAIGN SCHEDULING
  // =========================================================

  /*
   * Null means no scheduled start/end restriction.
   *
   * Store API will later use these together with is_active.
   */
  starts_at: model.dateTime().nullable(),

  ends_at: model.dateTime().nullable(),
})