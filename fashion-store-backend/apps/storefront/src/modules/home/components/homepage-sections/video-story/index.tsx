import { VideoStoryConfig } from "@lib/data/homepage-sections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HOMEPAGE_WIDTH } from "../spacing"

type Props = {
  title?: string | null
  config: VideoStoryConfig
}

export default function VideoStory({
  title,
  config,
}: Props) {
  if (
    !config.video_url &&
    !config.poster_url
  ) {
    return null
  }

  const heading =
    config.heading || title

  const width =
    config.width ?? "full"

  const horizontal =
    config.content_align === "left"
      ? "items-start text-left"
      : config.content_align === "right"
        ? "items-end text-right"
        : "items-center text-center"

  const vertical =
    config.content_vertical === "top"
      ? "justify-start"
      : config.content_vertical === "bottom"
        ? "justify-end"
        : "justify-center"

  const buttonStyle: React.CSSProperties = {
    color:
      config.button_color ??
      "#FFFFFF",

    textTransform:
      "uppercase",

    letterSpacing:
      "0.12em",

    fontSize:
      12,
  }

  if (
    config.button_style === "filled"
  ) {
    buttonStyle.backgroundColor =
      config.button_bg ??
      "#FFFFFF"

    buttonStyle.padding =
      "14px 24px"
  } else if (
    (config.button_style ??
      "outline") === "outline"
  ) {
    buttonStyle.border = `1px solid ${
      config.button_border ??
      "#FFFFFF"
    }`

    buttonStyle.padding =
      "13px 24px"
  } else if (
    config.button_style ===
    "underline"
  ) {
    buttonStyle.borderBottom = `1px solid ${
      config.button_border ??
      "#FFFFFF"
    }`

    buttonStyle.paddingBottom =
      4
  }

  return (
    <section
      className={[
        config.desktop_visible ===
        false
          ? "md:hidden"
          : "",

        config.mobile_visible ===
        false
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
        <div
          className="relative overflow-hidden"
          style={{
            height: `clamp(
              ${
                config.mobile_height ??
                600
              }px,
              72vw,
              ${
                config.desktop_height ??
                760
              }px
            )`,
          }}
        >
          {config.video_url ? (
            <video
              autoPlay={
                config.autoplay !==
                false
              }
              muted={
                config.muted !==
                false
              }
              loop={
                config.loop !==
                false
              }
              controls={
                config.controls ===
                true
              }
              playsInline
              poster={
                config.poster_url ??
                undefined
              }
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
                  config.video_url
                }
              />
            </video>
          ) : config.poster_url ? (
            <img
              src={
                config.poster_url
              }
              alt={
                heading ??
                "Video story"
              }
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition:
                  config.object_position ??
                  "center",
              }}
            />
          ) : null}

          <div
            className="absolute inset-0"
            style={{
              backgroundColor:
                config.overlay_color ??
                "#000000",

              opacity:
                Math.max(
                  0,
                  Math.min(
                    100,
                    config.overlay_opacity ??
                      25
                  )
                ) / 100,
            }}
          />

          <div
            className={[
              "absolute inset-0 flex flex-col p-7 md:p-14",
              horizontal,
              vertical,
            ].join(" ")}
            style={{
              color:
                config.text_color ??
                "#FFFFFF",
            }}
          >
            <div className="w-full max-w-[760px]">
              {heading && (
                <h2
                  className="leading-[1.02] tracking-[-0.025em]"
                  style={{
                    fontFamily:
                      config.heading_font ??
                      "Georgia, serif",

                    fontSize: `clamp(
                      ${
                        config.mobile_heading_size ??
                        38
                      }px,
                      5vw,
                      ${
                        config.heading_size ??
                        60
                      }px
                    )`,
                  }}
                >
                  {heading}
                </h2>
              )}

              {config.subtitle && (
                <p
                  className="mt-5 leading-7"
                  style={{
                    fontFamily:
                      config.body_font ??
                      "Arial, sans-serif",

                    fontSize:
                      config.subtitle_size ??
                      16,
                  }}
                >
                  {
                    config.subtitle
                  }
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
          </div>
        </div>
      </div>
    </section>
  )
}