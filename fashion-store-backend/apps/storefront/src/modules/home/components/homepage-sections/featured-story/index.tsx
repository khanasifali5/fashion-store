import { FeaturedStoryConfig } from "@lib/data/homepage-sections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HOMEPAGE_WIDTH } from "../spacing"

type FeaturedStoryProps = {
  title?: string | null
  config: FeaturedStoryConfig
}

const FeaturedStory = ({
  title,
  config,
}: FeaturedStoryProps) => {
  const heading =
    config.heading || title

  const isSplit =
    config.layout === "split"

  const width =
    config.width ?? "full"

  const vertical =
    config.content_vertical === "top"
      ? "justify-start"
      : config.content_vertical === "bottom"
        ? "justify-end"
        : "justify-center"

  const horizontal =
    config.content_align === "center"
      ? "items-center text-center"
      : config.content_align === "right"
        ? "items-end text-right"
        : "items-start text-left"

  const buttonStyle: React.CSSProperties = {
    color:
      config.button_color ??
      "#111111",

    fontFamily:
      config.button_font ??
      "Arial, sans-serif",

    fontSize:
      config.button_size ?? 12,

    borderRadius:
      config.button_radius ?? 0,

    textTransform:
      "uppercase",

    letterSpacing:
      "0.12em",
  }

  const buttonMode =
    config.button_style ??
    "filled"

  if (
    buttonMode === "filled" ||
    buttonMode === "outline"
  ) {
    buttonStyle.padding = `${
      config.button_padding_y ??
      14
    }px ${
      config.button_padding_x ??
      24
    }px`
  }

  if (buttonMode === "filled") {
    buttonStyle.backgroundColor =
      config.button_bg ??
      "#FFFFFF"
  }

  if (buttonMode === "outline") {
    buttonStyle.backgroundColor =
      "transparent"

    buttonStyle.border = `1px solid ${
      config.button_border ??
      "#FFFFFF"
    }`
  }

  if (buttonMode === "underline") {
    buttonStyle.borderBottom = `1px solid ${
      config.button_border ??
      config.button_color ??
      "#FFFFFF"
    }`

    buttonStyle.paddingBottom =
      4
  }

  const media =
    config.media_url ? (
      config.media_type ===
      "video" ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition:
              config.object_position ??
              "center",
          }}
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
            heading ??
            "Featured story"
          }
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition:
              config.object_position ??
              "center",
          }}
        />
      )
    ) : (
      <div className="absolute inset-0 bg-gray-200" />
    )

  const content = (
    <div
      className="w-full"
      style={{
        maxWidth:
          config.content_max_width ??
          620,
      }}
    >
      {config.eyebrow && (
        <p
          className="uppercase tracking-[0.16em]"
          style={{
            color:
              config.eyebrow_color ??
              (isSplit
                ? "#765633"
                : "#FFFFFF"),

            fontFamily:
              config.body_font ??
              "Arial, sans-serif",

            fontSize: 12,
          }}
        >
          {config.eyebrow}
        </p>
      )}

      {heading && (
        <h2
          className="mt-4 leading-[1.02] tracking-[-0.025em]"
          style={{
            color:
              config.text_color ??
              (isSplit
                ? "#111111"
                : "#FFFFFF"),

            fontFamily:
              config.heading_font ??
              "Georgia, serif",

            fontWeight:
              config.heading_weight ??
              500,

            fontSize: `clamp(
              ${
                config.heading_mobile_size ??
                36
              }px,
              4.8vw,
              ${
                config.heading_size ??
                58
              }px
            )`,
          }}
        >
          {heading}
        </h2>
      )}

      {config.body && (
        <p
          className="mt-6 leading-7"
          style={{
            color:
              config.text_color ??
              (isSplit
                ? "#111111"
                : "#FFFFFF"),

            fontFamily:
              config.body_font ??
              "Arial, sans-serif",

            fontSize:
              config.body_size ??
              16,
          }}
        >
          {config.body}
        </p>
      )}

      {config.button_text &&
        config.button_url && (
          <LocalizedClientLink
            href={
              config.button_url
            }
            className="mt-8 inline-flex items-center justify-center transition-opacity hover:opacity-75"
            style={
              buttonStyle
            }
          >
            {
              config.button_text
            }
          </LocalizedClientLink>
        )}
    </div>
  )

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
          config.top_spacing ??
          48,

        paddingBottom:
          config.bottom_spacing ??
          48,
      }}
    >
      <div className={HOMEPAGE_WIDTH[width]}>
        {isSplit ? (
          <div
            className="grid grid-cols-1 overflow-hidden md:grid-cols-2"
            style={{
              minHeight: `clamp(
                ${
                  config.mobile_height ??
                  560
                }px,
                65vw,
                ${
                  config.desktop_height ??
                  720
                }px
              )`,
            }}
          >
            <div
              className={[
                "relative min-h-[380px]",

                config.content_side ===
                "left"
                  ? "md:order-2"
                  : "md:order-1",
              ].join(" ")}
            >
              {media}
            </div>

            <div
              className={[
                "flex flex-col",

                vertical,

                horizontal,

                config.content_side ===
                "left"
                  ? "md:order-1"
                  : "md:order-2",
              ].join(" ")}
              style={{
                backgroundColor:
                  config.panel_background ??
                  "#F4F0EA",

                padding: `clamp(
                  28px,
                  5vw,
                  ${
                    config.content_padding ??
                    56
                  }px
                )`,
              }}
            >
              {content}
            </div>
          </div>
        ) : (
          <div
            className="relative overflow-hidden"
            style={{
              height: `clamp(
                ${
                  config.mobile_height ??
                  560
                }px,
                72vw,
                ${
                  config.desktop_height ??
                  720
                }px
              )`,
            }}
          >
            {media}

            <div
              className="absolute inset-0"
              style={{
                backgroundColor:
                  config.overlay_color ??
                  "#000000",

                opacity:
                  Math.min(
                    100,
                    Math.max(
                      0,
                      config.overlay_opacity ??
                        28
                    )
                  ) / 100,
              }}
            />

            <div
              className={[
                "absolute inset-0 flex flex-col",
                vertical,
                horizontal,
              ].join(" ")}
              style={{
                padding: `clamp(
                  28px,
                  5vw,
                  ${
                    config.content_padding ??
                    56
                  }px
                )`,
              }}
            >
              {content}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedStory