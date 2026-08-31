import { EditorialTextConfig } from "@lib/data/homepage-sections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HOMEPAGE_WIDTH } from "../spacing"

type Props = {
  title?: string | null
  config: EditorialTextConfig
}

export default function EditorialText({
  title,
  config,
}: Props) {
  const heading =
    config.heading || title

  if (
    !config.eyebrow &&
    !heading &&
    !config.body &&
    !config.quote
  ) {
    return null
  }

  const width =
    config.width ?? "contained"

  const align =
    config.align === "left"
      ? "text-left"
      : config.align === "right"
        ? "text-right"
        : "text-center"

  const contentMargin =
    config.align === "left"
      ? ""
      : config.align === "right"
        ? "ml-auto"
        : "mx-auto"

  const buttonStyle: React.CSSProperties = {
    color:
      config.button_color ??
      "#111111",
  }

  if (
    config.button_style === "filled"
  ) {
    buttonStyle.backgroundColor =
      config.button_bg ??
      "#111111"

    buttonStyle.padding =
      "14px 24px"
  } else if (
    config.button_style === "outline"
  ) {
    buttonStyle.border = `1px solid ${
      config.button_border ??
      "#111111"
    }`

    buttonStyle.padding =
      "13px 24px"
  } else if (
    (config.button_style ??
      "underline") === "underline"
  ) {
    buttonStyle.borderBottom = `1px solid ${
      config.button_border ??
      "#111111"
    }`

    buttonStyle.paddingBottom =
      4
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
        backgroundColor:
          config.background ??
          "#FFFFFF",

        color:
          config.text_color ??
          "#111111",

        paddingTop:
          config.top_spacing ??
          72,

        paddingBottom:
          config.bottom_spacing ??
          72,
      }}
    >
      <div className={HOMEPAGE_WIDTH[width]}>
        <div
          className={[
            align,
            contentMargin,

            width === "full"
              ? "px-4 md:px-8"
              : width === "wide"
                ? "px-4 md:px-6"
                : "",
          ].join(" ")}
          style={{
            maxWidth:
              config.max_width ??
              900,
          }}
        >
          {config.eyebrow && (
            <p
              className="uppercase tracking-[0.16em]"
              style={{
                color:
                  config.accent_color ??
                  "#9A7446",

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
              className="mt-4 leading-[1.08] tracking-[-0.025em]"
              style={{
                fontFamily:
                  config.heading_font ??
                  "Georgia, serif",

                fontWeight:
                  config.heading_weight ??
                  500,

                fontSize: `clamp(
                  ${
                    config.mobile_heading_size ??
                    34
                  }px,
                  4.5vw,
                  ${
                    config.heading_size ??
                    52
                  }px
                )`,
              }}
            >
              {heading}
            </h2>
          )}

          {config.body && (
            <p
              className="mt-6 whitespace-pre-line leading-8"
              style={{
                fontFamily:
                  config.body_font ??
                  "Arial, sans-serif",

                fontSize:
                  config.body_size ??
                  17,
              }}
            >
              {config.body}
            </p>
          )}

          {config.quote && (
            <blockquote
              className={[
                "mt-8 italic leading-snug",

                config.align ===
                "center"
                  ? "border-y py-6"
                  : "border-l-2 pl-6",
              ].join(" ")}
              style={{
                borderColor:
                  config.accent_color ??
                  "#9A7446",

                fontFamily:
                  config.heading_font ??
                  "Georgia, serif",

                fontSize:
                  config.quote_size ??
                  28,
              }}
            >
              {config.quote}
            </blockquote>
          )}

          {config.button_text &&
            config.button_url && (
              <LocalizedClientLink
                href={
                  config.button_url
                }
                className="mt-8 inline-flex items-center justify-center uppercase tracking-[0.12em] transition-opacity hover:opacity-75"
                style={{
                  ...buttonStyle,

                  fontFamily:
                    config.body_font ??
                    "Arial, sans-serif",

                  fontSize: 12,
                }}
              >
                {
                  config.button_text
                }
              </LocalizedClientLink>
            )}
        </div>
      </div>
    </section>
  )
}