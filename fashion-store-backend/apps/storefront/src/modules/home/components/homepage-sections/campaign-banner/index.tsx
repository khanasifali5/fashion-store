import type { CSSProperties } from "react"

import { CampaignBannerConfig } from "@lib/data/homepage-sections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CampaignBannerProps = {
  title?: string | null
  config: CampaignBannerConfig
}

type ExtendedCampaignBannerConfig =
  CampaignBannerConfig & {
    media_fit?: "cover" | "contain"
    focal_x?: number
    focal_y?: number
    media_zoom?: number
    media_background?: string

    mobile_media_url?: string | null
    mobile_media_type?: "image" | "video"
    mobile_height?: number

    content_max_width?: number
    text_align?: "left" | "center" | "right"

    heading_line_height?: number
    heading_letter_spacing?: number
    body_line_height?: number

    divider_enabled?: boolean
    divider_width?: number
    divider_thickness?: number
    divider_color?: string
  }

type CssVars =
  CSSProperties &
  Record<`--${string}`, string | number>

const widthClass = (
  width?: CampaignBannerConfig["width"]
) => {
  if (width === "contained") {
    return "mx-auto w-full max-w-[1440px] px-4 md:px-6"
  }

  if (width === "wide") {
    return "mx-auto w-full max-w-[1800px]"
  }

  return "w-full"
}

const clampNumber = (
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
) => {
  const numeric =
    typeof value === "number" &&
    Number.isFinite(value)
      ? value
      : fallback

  return Math.min(
    max,
    Math.max(min, numeric)
  )
}

/*
 * Campaign Banner has one 1440px-wide master composition.
 * Values saved by Admin are desktop design values; cqw units
 * scale those values against the actual banner width.
 */
const MASTER_CANVAS_WIDTH = 1440

const toCqw = (
  pixels: number
) =>
  `${(
    (pixels / MASTER_CANVAS_WIDTH) *
    100
  ).toFixed(4)}cqw`

const responsiveSize = (
  pixels: number,
  minimum: number
) =>
  `clamp(${minimum}px, ${toCqw(
    pixels
  )}, ${pixels}px)`

const makeButtonStyle = (
  mode: string | undefined,
  bg: string | undefined,
  color: string | undefined,
  border: string | undefined,
  config: ExtendedCampaignBannerConfig
): CssVars => {
  const style =
    mode ?? "filled"

  const result: CssVars = {
    color:
      color ?? "#FFFFFF",
    fontFamily:
      config.button_font ??
      '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize:
      responsiveSize(
        config.button_size ?? 12,
        9
      ),
    borderRadius:
      responsiveSize(
        config.button_radius ?? 0,
        0
      ),
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    transition:
      "background-color 180ms ease, color 180ms ease, border-color 180ms ease, opacity 180ms ease",
  }

  if (
    style === "filled" ||
    style === "outline"
  ) {
    result.padding =
      `${responsiveSize(
        config.button_padding_y ?? 14,
        6
      )} ${responsiveSize(
        config.button_padding_x ?? 24,
        10
      )}`
  }

  if (style === "filled") {
    result.backgroundColor =
      bg ?? "#FFFFFF"
    result.border =
      `1px solid ${border ?? bg ?? "#FFFFFF"}`
  }

  if (style === "outline") {
    result.border =
      `1px solid ${border ?? "#FFFFFF"}`
    result.backgroundColor =
      "transparent"
  }

  if (style === "underline") {
    result.borderBottom =
      `1px solid ${border ?? color ?? "#FFFFFF"}`
    result.paddingBottom = 4
  }

  return result
}

const CampaignBanner = ({
  title,
  config: baseConfig,
}: CampaignBannerProps) => {
  const config =
    baseConfig as ExtendedCampaignBannerConfig

  /*
   * Position of the content block and alignment of text INSIDE
   * that block are separate controls.
   *
   * Example:
   * content_align = right
   * text_align = center
   */
  const horizontal =
    config.content_align === "left"
      ? "justify-start"
      : config.content_align === "right"
        ? "justify-end"
        : "justify-center"

  const textAlignment =
    (config.text_align ??
      config.content_align ??
      "center") === "left"
      ? "text-left"
      : (config.text_align ??
          config.content_align ??
          "center") === "right"
        ? "text-right"
        : "text-center"

  const effectiveTextAlign =
    config.text_align ??
    config.content_align ??
    "center"

  const vertical =
    config.content_vertical === "top"
      ? "items-start"
      : config.content_vertical === "bottom"
        ? "items-end"
        : "items-center"

  const bodyWidthClass =
    effectiveTextAlign === "center"
      ? "mx-auto"
      : effectiveTextAlign === "right"
        ? "ml-auto"
        : ""

  const dividerAlignClass =
    effectiveTextAlign === "center"
      ? "mx-auto"
      : effectiveTextAlign === "right"
        ? "ml-auto"
        : ""

  const focalX =
    clampNumber(
      config.focal_x,
      0,
      100,
      50
    )

  const focalY =
    clampNumber(
      config.focal_y,
      0,
      100,
      50
    )

  const zoom =
    clampNumber(
      config.media_zoom,
      1,
      2,
      1
    )

  const mediaFit =
    config.media_fit === "contain"
      ? "contain"
      : "cover"

  const masterHeight =
    Math.max(
      280,
      config.height ?? 620
    )

  const mobileHeight =
    Math.max(
      380,
      config.mobile_height ?? 500
    )

  const hasMobileMedia =
    Boolean(
      config.mobile_media_url
    )

  /*
   * SAME COMPOSITION AT EVERY SIZE
   *
   * A fixed master aspect ratio means:
   * - image crop remains the same
   * - focal point remains the same
   * - content stays in the same relative position
   *
   * The banner simply becomes proportionally smaller as its width shrinks.
   */
  const frameStyle: CssVars = {
    "--campaign-desktop-aspect":
      `${MASTER_CANVAS_WIDTH} / ${masterHeight}`,
    "--campaign-mobile-height":
      `${mobileHeight}px`,
    containerType:
      "inline-size",
    backgroundColor:
      config.media_background ??
      "#F8F4EC",
  }

  const mediaStyle: CSSProperties = {
    objectFit: mediaFit,
    objectPosition:
      `${focalX}% ${focalY}%`,
    transform:
      `scale(${zoom})`,
    transformOrigin:
      `${focalX}% ${focalY}%`,
  }

  return (
    <section
      className={[
        config.desktop_visible === false
          ? "md:hidden"
          : "",
        config.mobile_visible === false
          ? "hidden md:block"
          : "",
      ].join(" ")}
      style={{
        paddingTop:
          config.top_spacing ?? 0,
        paddingBottom:
          config.bottom_spacing ?? 0,
      }}
    >
      <div
        className={
          widthClass(
            config.width
          )
        }
      >
        <div
          className="campaign-banner-frame relative w-full overflow-hidden"
          style={frameStyle}
        >
          {config.media_url ? (
            config.media_type ===
            "video" ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className={`absolute inset-0 h-full w-full ${
                  hasMobileMedia
                    ? "hidden md:block"
                    : ""
                }`}
                style={mediaStyle}
              >
                <source
                  src={
                    config.media_url
                  }
                />
              </video>
            ) : (
              <img
                src={
                  config.media_url
                }
                alt={
                  config.media_alt ??
                  ""
                }
                loading="lazy"
                draggable={false}
                className={`absolute inset-0 h-full w-full ${
                  hasMobileMedia
                    ? "hidden md:block"
                    : ""
                }`}
                style={mediaStyle}
              />
            )
          ) : (
            <div className="absolute inset-0 bg-gray-200" />
          )}

          {hasMobileMedia &&
            (
              config.mobile_media_type === "video" ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 block h-full w-full md:hidden"
                  style={mediaStyle}
                >
                  <source
                    src={
                      config.mobile_media_url ??
                      ""
                    }
                  />
                </video>
              ) : (
                <img
                  src={
                    config.mobile_media_url ??
                    ""
                  }
                  alt={
                    config.media_alt ??
                    ""
                  }
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 block h-full w-full md:hidden"
                  style={mediaStyle}
                />
              )
            )}

          <div
            className="absolute inset-0"
            style={{
              backgroundColor:
                config.overlay_color ??
                "#000000",
              opacity:
                clampNumber(
                  config.overlay_opacity,
                  0,
                  100,
                  28
                ) / 100,
            }}
          />

          <div
            className={[
              "absolute inset-0 flex",
              horizontal,
              textAlignment,
              vertical,
            ].join(" ")}
            style={{
              padding:
                responsiveSize(
                  config.content_padding ?? 40,
                  8
                ),
              color:
                config.text_color ??
                "#FFFFFF",
            }}
          >
            <div
              className="w-full"
              style={{
                maxWidth:
                  `${Math.min(
                    92,
                    Math.max(
                      15,
                      ((config.content_max_width ?? 560) /
                        MASTER_CANVAS_WIDTH) *
                        100
                    )
                  )}%`,
              }}
            >
              {config.eyebrow && (
                <p
                  className="uppercase tracking-[0.16em]"
                  style={{
                    color:
                      config.eyebrow_color ??
                      "#FFFFFF",
                    fontFamily:
                      config.body_font ??
                      '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize:
                      responsiveSize(
                        12,
                        8
                      ),
                  }}
                >
                  {config.eyebrow}
                </p>
              )}

              {(config.heading ||
                title) && (
                <h2
                  className="whitespace-pre-line"
                  style={{
                    marginTop:
                      responsiveSize(
                        16,
                        5
                      ),
                    color:
                      config.text_color ??
                      "#FFFFFF",
                    fontFamily:
                      config.heading_font ??
                      "Georgia, serif",
                    fontWeight:
                      config.heading_weight ??
                      500,
                    fontSize:
                      responsiveSize(
                        config.heading_size ?? 64,
                        20
                      ),
                    lineHeight:
                      config.heading_line_height ??
                      0.98,
                    letterSpacing:
                      `${config.heading_letter_spacing ?? -0.03}em`,
                  }}
                >
                  {config.heading ||
                    title}
                </h2>
              )}

              {config.divider_enabled !==
                false && (
                <div
                  className={[
                    dividerAlignClass,
                  ].join(" ")}
                  style={{
                    marginTop:
                      responsiveSize(
                        28,
                        8
                      ),
                    width:
                      responsiveSize(
                        config.divider_width ??
                          88,
                        24
                      ),
                    height:
                      responsiveSize(
                        Math.max(
                          1,
                          config.divider_thickness ??
                            2
                        ),
                        1
                      ),
                    backgroundColor:
                      config.divider_color ??
                      "#A97838",
                  }}
                  aria-hidden="true"
                />
              )}

              {config.body && (
                <p
                  className={[
                    "max-w-[700px] whitespace-pre-line",
                    bodyWidthClass,
                  ].join(" ")}
                  style={{
                    marginTop:
                      responsiveSize(
                        28,
                        8
                      ),
                    color:
                      config.text_color ??
                      "#FFFFFF",
                    fontFamily:
                      config.body_font ??
                      '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize:
                      responsiveSize(
                        config.body_size ??
                          16,
                        10
                      ),
                    lineHeight:
                      config.body_line_height ??
                      1.55,
                  }}
                >
                  {config.body}
                </p>
              )}

              {(config.primary_text ||
                config.secondary_text) && (
                <div
                  className={[
                    "flex flex-wrap",
                    effectiveTextAlign ===
                    "left"
                      ? "justify-start"
                      : effectiveTextAlign ===
                          "right"
                        ? "justify-end"
                        : "justify-center",
                  ].join(" ")}
                  style={{
                    marginTop:
                      responsiveSize(
                        32,
                        10
                      ),
                    gap:
                      responsiveSize(
                        12,
                        6
                      ),
                  }}
                >
                  {config.primary_text &&
                    config.primary_url && (
                      <LocalizedClientLink
                        href={
                          config.primary_url
                        }
                        className="inline-flex items-center justify-center hover:opacity-75"
                        style={makeButtonStyle(
                          config.primary_style,
                          config.primary_bg,
                          config.primary_color,
                          config.primary_border,
                          config
                        )}
                      >
                        {
                          config.primary_text
                        }
                      </LocalizedClientLink>
                    )}

                  {config.secondary_text &&
                    config.secondary_url && (
                      <LocalizedClientLink
                        href={
                          config.secondary_url
                        }
                        className="inline-flex items-center justify-center hover:opacity-75"
                        style={makeButtonStyle(
                          config.secondary_style,
                          "transparent",
                          config.secondary_color,
                          config.secondary_border,
                          config
                        )}
                      >
                        {
                          config.secondary_text
                        }
                      </LocalizedClientLink>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /*
         * Desktop/tablet preserve the proportional master.
         * Mobile switches to a taller frame and optional artwork.
         */
        .campaign-banner-frame {
          aspect-ratio:
            var(--campaign-desktop-aspect);
        }

        @media (max-width: 767px) {
          .campaign-banner-frame {
            aspect-ratio: auto;
            height:
              var(--campaign-mobile-height);
          }
        }
      `}</style>
    </section>
  )
}

export default CampaignBanner