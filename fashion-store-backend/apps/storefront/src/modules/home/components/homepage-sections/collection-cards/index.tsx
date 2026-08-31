import {
  CollectionCardConfigItem,
  CollectionCardsConfig,
} from "@lib/data/homepage-sections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HOMEPAGE_WIDTH } from "../spacing"

type CollectionCardsProps = {
  title?: string | null
  config: CollectionCardsConfig
}

const ratioClass = (
  ratio?: CollectionCardsConfig["image_ratio"]
) => {
  switch (ratio) {
    case "square":
      return "aspect-square"

    case "landscape":
      return "aspect-[4/3]"

    case "editorial":
      return "aspect-[3/4]"

    default:
      return "aspect-[2/3]"
  }
}

const contentPositionClass = (
  position?: CollectionCardsConfig["text_position"]
) => {
  switch (position) {
    case "top-left":
      return "items-start justify-start text-left"

    case "top-center":
      return "items-start justify-center text-center"

    case "top-right":
      return "items-start justify-end text-right"

    case "center-left":
      return "items-center justify-start text-left"

    case "center":
      return "items-center justify-center text-center"

    case "center-right":
      return "items-center justify-end text-right"

    case "bottom-right":
      return "items-end justify-end text-right"

    case "bottom-center":
      return "items-end justify-center text-center"

    default:
      return "items-end justify-start text-left"
  }
}

const gridColumnsClass = (
  mobile: number,
  desktop: number
) => {
  const mobileClass =
    mobile === 2
      ? "grid-cols-2"
      : "grid-cols-1"

  const desktopClass =
    desktop === 4
      ? "md:grid-cols-4"
      : desktop === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3"

  return `${mobileClass} ${desktopClass}`
}

const getCardHref = (
  card: CollectionCardConfigItem
) => {
  if (card.custom_url?.trim()) {
    return card.custom_url.trim()
  }

  if (card.collection_handle?.trim()) {
    return `/collections/${card.collection_handle.trim()}`
  }

  return "/"
}

const getButtonStyle = (
  config: CollectionCardsConfig
): React.CSSProperties => {
  const style =
    config.button_style ?? "filled"

  const base: React.CSSProperties = {
    color:
      config.button_text_color ??
      "#111111",

    fontSize:
      config.button_size ?? 12,

    borderRadius:
      config.button_radius ?? 0,
  }

  if (
    style === "filled" ||
    style === "outline"
  ) {
    base.padding = `${
      config.button_padding_y ?? 10
    }px ${
      config.button_padding_x ?? 18
    }px`
  }

  if (style === "filled") {
    base.backgroundColor =
      config.button_bg_color ??
      "#FFFFFF"
  }

  if (style === "outline") {
    base.border = `1px solid ${
      config.button_border_color ??
      "#FFFFFF"
    }`

    base.backgroundColor =
      "transparent"
  }

  if (style === "underline") {
    base.borderBottom = `1px solid ${
      config.button_border_color ??
      config.button_text_color ??
      "#FFFFFF"
    }`

    base.paddingBottom = 3
  }

  return base
}

const CollectionCards = ({
  title,
  config,
}: CollectionCardsProps) => {
  const cards = (config.cards ?? []).filter(
    (card) =>
      Boolean(
        card.image_url ||
          card.collection_handle ||
          card.title
      )
  )

  if (!cards.length) {
    return null
  }

  const desktopColumns = Math.min(
    4,
    Math.max(
      2,
      config.desktop_columns ?? 3
    )
  )

  const mobileColumns = Math.min(
    2,
    Math.max(
      1,
      config.mobile_columns ?? 1
    )
  )

  const gap = Math.max(
    0,
    config.gap ?? 16
  )

  const overlayOpacity = Math.min(
    90,
    Math.max(
      0,
      config.overlay_opacity ?? 12
    )
  )

  const width =
    config.width ?? "full"

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

        backgroundColor:
          config.background ?? "#FFFFFF",
      }}
    >
      <div className={HOMEPAGE_WIDTH[width]}>
        {title && (
          <h2 className="mb-6 text-center text-[20px] font-normal tracking-[-0.01em] text-[#24211e] md:mb-8 md:text-[28px]">
            {title}
          </h2>
        )}

        <div
          className={[
            "grid",

            gridColumnsClass(
              mobileColumns,
              desktopColumns
            ),
          ].join(" ")}
          style={{
            gap,
          }}
        >
          {cards.map(
            (card, index) => (
              <LocalizedClientLink
                key={`${
                  card.collection_handle ??
                  "card"
                }-${index}`}
                href={getCardHref(card)}
                className="group relative block overflow-hidden bg-[#f2f1ef]"
              >
                <div
                  className={[
                    "relative w-full overflow-hidden",

                    ratioClass(
                      config.image_ratio
                    ),
                  ].join(" ")}
                >
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={
                        card.title ||
                        card.collection_handle ||
                        "Collection"
                      }
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}

                  <div
                    className="absolute inset-0 bg-black"
                    style={{
                      opacity:
                        overlayOpacity /
                        100,
                    }}
                  />

                  <div
                    className={[
                      "absolute inset-0 flex p-5 text-white md:p-7",

                      contentPositionClass(
                        config.text_position
                      ),
                    ].join(" ")}
                  >
                    <div
                      className="max-w-[92%]"
                      style={{
                        transform: `translate(${
                          card.content_offset_x ??
                          0
                        }px, ${
                          card.content_offset_y ??
                          0
                        }px)`,
                      }}
                    >
                      {(card.title ||
                        card.collection_handle) && (
                        <h3
                          className="leading-tight tracking-[-0.01em]"
                          style={{
                            color:
                              config.title_color ??
                              "#FFFFFF",

                            fontSize: `clamp(${
                              config.title_mobile_size ??
                              20
                            }px, 2.2vw, ${
                              config.title_size ??
                              30
                            }px)`,

                            fontWeight:
                              config.title_weight ??
                              500,
                          }}
                        >
                          {card.title ||
                            card.collection_handle}
                        </h3>
                      )}

                      {card.subtitle && (
                        <p
                          className="mt-2 max-w-md leading-5"
                          style={{
                            color:
                              config.subtitle_color ??
                              "#FFFFFF",

                            fontSize:
                              config.subtitle_size ??
                              14,
                          }}
                        >
                          {card.subtitle}
                        </p>
                      )}

                      {card.button_text && (
                        <span
                          className="mt-4 inline-flex items-center justify-center uppercase tracking-[0.12em] transition-opacity group-hover:opacity-80"
                          style={getButtonStyle(
                            config
                          )}
                        >
                          {card.button_text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </LocalizedClientLink>
            )
          )}
        </div>
      </div>
    </section>
  )
}

export default CollectionCards