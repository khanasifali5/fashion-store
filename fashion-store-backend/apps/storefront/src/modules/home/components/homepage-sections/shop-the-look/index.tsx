import { ShopTheLookConfig } from "@lib/data/homepage-sections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HOMEPAGE_WIDTH } from "../spacing"

type ShopTheLookProps = {
  title?: string | null
  config: ShopTheLookConfig
}

const ShopTheLook = ({
  title,
  config,
}: ShopTheLookProps) => {
  const hotspots = (config.hotspots || []).filter(
    (item) =>
      typeof item.x === "number" &&
      typeof item.y === "number"
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
          config.background ??
          "#FFFFFF",
      }}
    >
      <div className={HOMEPAGE_WIDTH[width]}>
        {title && (
          <div className="pb-5">
            <h2 className="px-4 text-2xl font-medium tracking-tight md:px-6 md:text-3xl">
              {title}
            </h2>
          </div>
        )}

        <div
          className="relative overflow-hidden bg-gray-100"
          style={{
            height: `clamp(
              ${
                config.mobile_height ??
                560
              }px,
              72vw,
              ${
                config.desktop_height ??
                760
              }px
            )`,
          }}
        >
          {config.image_url ? (
            <img
              src={
                config.image_url
              }
              alt={
                config.image_alt ??
                title ??
                "Shop the look"
              }
              draggable={false}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition:
                  config.image_position ??
                  "center",
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Shop the Look image
            </div>
          )}

          {hotspots.map(
            (hotspot, index) => {
              const hasProduct =
                Boolean(
                  hotspot.product_handle
                )

              const content = (
                <>
                  <span
                    className="relative z-10 block rounded-full shadow-md transition-transform duration-200 group-hover:scale-110"
                    style={{
                      width:
                        config.hotspot_size ??
                        22,

                      height:
                        config.hotspot_size ??
                        22,

                      backgroundColor:
                        config.hotspot_color ??
                        "#FFFFFF",

                      border: `2px solid ${
                        config.hotspot_ring_color ??
                        "#111111"
                      }`,
                    }}
                  />

                  {config.show_product_card !==
                    false &&
                    hotspot.product_title && (
                      <span
                        className={[
                          "pointer-events-none absolute left-1/2 top-full z-20 mt-3 hidden w-[190px] -translate-x-1/2",
                          "rounded-md bg-white p-3 text-left text-black shadow-xl md:group-hover:block",
                        ].join(" ")}
                      >
                        {hotspot.product_thumbnail && (
                          <img
                            src={
                              hotspot.product_thumbnail
                            }
                            alt=""
                            className="mb-2 aspect-[4/5] w-full object-cover"
                            loading="lazy"
                          />
                        )}

                        <span className="block text-xs font-medium">
                          {hotspot.label ||
                            hotspot.product_title}
                        </span>

                        {hotspot.price_label && (
                          <span className="mt-1 block text-xs text-gray-500">
                            {
                              hotspot.price_label
                            }
                          </span>
                        )}
                      </span>
                    )}

                  <span className="sr-only">
                    {hotspot.label ||
                      hotspot.product_title ||
                      `Shop look item ${
                        index + 1
                      }`}
                  </span>
                </>
              )

              const commonClass =
                "group absolute z-10 -translate-x-1/2 -translate-y-1/2"

              const style = {
                left: `${Math.max(
                  0,
                  Math.min(
                    100,
                    hotspot.x ?? 50
                  )
                )}%`,

                top: `${Math.max(
                  0,
                  Math.min(
                    100,
                    hotspot.y ?? 50
                  )
                )}%`,
              }

              return hasProduct ? (
                <LocalizedClientLink
                  key={
                    hotspot.id ??
                    `${index}`
                  }
                  href={`/products/${hotspot.product_handle}`}
                  className={
                    commonClass
                  }
                  style={style}
                >
                  {content}
                </LocalizedClientLink>
              ) : (
                <span
                  key={
                    hotspot.id ??
                    `${index}`
                  }
                  className={
                    commonClass
                  }
                  style={style}
                >
                  {content}
                </span>
              )
            }
          )}
        </div>
      </div>
    </section>
  )
}

export default ShopTheLook