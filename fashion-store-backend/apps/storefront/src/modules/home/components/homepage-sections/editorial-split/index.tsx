import { EditorialSplitConfig } from "@lib/data/homepage-sections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HOMEPAGE_WIDTH } from "../spacing"

type EditorialSplitProps = {
  title?: string | null
  config: EditorialSplitConfig
}

const EditorialSplit = ({
  title,
  config,
}: EditorialSplitProps) => {
  const imageRight =
    config.layout === "image-right"

  const contentFirstMobile =
    config.mobile_order === "content-first"

  const width =
    config.width ?? "full"

  const buttonStyle: React.CSSProperties = {
    color:
      config.button_color ??
      "#FFFFFF",

    backgroundColor:
      config.button_style === "filled"
        ? config.button_bg ??
          "#111111"
        : "transparent",

    border:
      config.button_style === "outline"
        ? `1px solid ${
            config.button_border ??
            "#111111"
          }`
        : undefined,

    borderBottom:
      config.button_style === "underline"
        ? `1px solid ${
            config.button_border ??
            "#111111"
          }`
        : undefined,

    borderRadius:
      config.button_radius ?? 0,

    padding:
      config.button_style === "filled" ||
      config.button_style === "outline"
        ? `${
            config.button_padding_y ??
            14
          }px ${
            config.button_padding_x ??
            24
          }px`
        : "4px 0",

    fontFamily:
      config.button_font ??
      "Arial, sans-serif",

    fontSize:
      config.button_size ?? 12,
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
          config.top_spacing ?? 48,

        paddingBottom:
          config.bottom_spacing ?? 48,
      }}
    >
      <div className={HOMEPAGE_WIDTH[width]}>
        <div
          className="grid grid-cols-1 overflow-hidden md:grid-cols-2"
          style={{
            backgroundColor:
              config.background ??
              "#F7F4EF",
          }}
        >
          <div
            className={[
              contentFirstMobile
                ? "order-2"
                : "order-1",

              imageRight
                ? "md:order-2"
                : "md:order-1",

              "min-h-[360px]",
            ].join(" ")}
          >
            {config.image_url ? (
              <img
                src={config.image_url}
                alt={
                  config.image_alt ??
                  ""
                }
                draggable={false}
                loading="lazy"
                className="h-full min-h-[360px] w-full"
                style={{
                  objectFit:
                    config.image_fit ??
                    "cover",

                  objectPosition:
                    config.image_position ??
                    "center",
                }}
              />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center bg-gray-100 text-sm text-gray-400">
                Editorial image
              </div>
            )}
          </div>

          <div
            className={[
              contentFirstMobile
                ? "order-1"
                : "order-2",

              imageRight
                ? "md:order-1"
                : "md:order-2",

              "flex flex-col",

              config.content_vertical ===
              "top"
                ? "justify-start"
                : config.content_vertical ===
                    "bottom"
                  ? "justify-end"
                  : "justify-center",

              config.content_align ===
              "center"
                ? "items-center text-center"
                : config.content_align ===
                    "right"
                  ? "items-end text-right"
                  : "items-start text-left",
            ].join(" ")}
            style={{
              minHeight: `${
                config.min_height ??
                620
              }px`,

              padding: `clamp(
                28px,
                5vw,
                ${
                  config.content_padding ??
                  64
                }px
              )`,

              color:
                config.text_color ??
                "#111111",
            }}
          >
            <div className="w-full max-w-[620px]">
              {config.eyebrow && (
                <p
                  className="uppercase tracking-[0.16em]"
                  style={{
                    color:
                      config.eyebrow_color ??
                      "#B48A52",

                    fontFamily:
                      config.body_font ??
                      "Arial, sans-serif",

                    fontSize: 12,
                  }}
                >
                  {config.eyebrow}
                </p>
              )}

              {(config.heading ||
                title) && (
                <h2
                  className="mt-4 leading-[1.05] tracking-[-0.025em]"
                  style={{
                    color:
                      config.text_color ??
                      "#111111",

                    fontFamily:
                      config.heading_font ??
                      "Georgia, serif",

                    fontWeight:
                      config.heading_weight ??
                      500,

                    fontSize: `clamp(
                      ${
                        config.heading_mobile_size ??
                        34
                      }px,
                      4vw,
                      ${
                        config.heading_size ??
                        52
                      }px
                    )`,
                  }}
                >
                  {config.heading ||
                    title}
                </h2>
              )}

              {config.body && (
                <p
                  className="mt-6 max-w-[560px] leading-7"
                  style={{
                    color:
                      config.text_color ??
                      "#111111",

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
                    className="mt-8 inline-flex items-center justify-center uppercase tracking-[0.12em] transition-opacity hover:opacity-75"
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

export default EditorialSplit