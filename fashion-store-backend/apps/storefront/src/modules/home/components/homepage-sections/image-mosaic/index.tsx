import {
  ImageMosaicConfig,
  ImageMosaicItem,
} from "@lib/data/homepage-sections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HOMEPAGE_WIDTH } from "../spacing"

type Props = {
  title?: string | null
  config: ImageMosaicConfig
}

const desktopSpan = (
  size?: ImageMosaicItem["size"]
) => {
  if (size === "large") {
    return "md:col-span-2 md:row-span-2"
  }

  if (size === "wide") {
    return "md:col-span-2 md:row-span-1"
  }

  if (size === "tall") {
    return "md:col-span-1 md:row-span-2"
  }

  return "md:col-span-1 md:row-span-1"
}

export default function ImageMosaic({
  title,
  config,
}: Props) {
  const items = (
    config.items ?? []
  ).filter(
    (item) => item.image_url
  )

  if (!items.length) {
    return null
  }

  const desktopColumns = Math.min(
    6,
    Math.max(
      2,
      config.desktop_columns ?? 4
    )
  )

  const mobileColumns = Math.min(
    2,
    Math.max(
      1,
      config.mobile_columns ?? 2
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
          config.background ??
          "#FFFFFF",
      }}
    >
      <div className={HOMEPAGE_WIDTH[width]}>
        {title && (
          <h2 className="mb-6 px-4 text-center text-2xl font-medium md:px-0 md:text-3xl">
            {title}
          </h2>
        )}

        <div
          className="homepage-image-mosaic-grid grid grid-flow-row-dense"
          style={{
            gap: `${
              config.gap ?? 12
            }px`,

            gridTemplateColumns: `repeat(
              ${mobileColumns},
              minmax(0, 1fr)
            )`,

            gridAutoRows: `${
              config.mobile_row_height ??
              180
            }px`,

            ["--mosaic-desktop-columns" as string]:
              desktopColumns,

            ["--mosaic-desktop-row-height" as string]:
              `${
                config.row_height ??
                240
              }px`,
          }}
        >
          {items.map(
            (item, index) => {
              const media = (
                <img
                  src={
                    item.image_url!
                  }
                  alt={
                    item.image_alt ??
                    ""
                  }
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                  style={{
                    objectPosition:
                      item.image_position ??
                      "center",
                  }}
                />
              )

              return (
                <div
                  key={`${
                    item.image_url
                  }-${index}`}
                  className={`mosaic-tile overflow-hidden bg-gray-100 ${desktopSpan(
                    item.size
                  )}`}
                >
                  {item.link_url ? (
                    <LocalizedClientLink
                      href={
                        item.link_url
                      }
                      className="block h-full w-full"
                    >
                      {media}
                    </LocalizedClientLink>
                  ) : (
                    media
                  )}
                </div>
              )
            }
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mosaic-tile {
            min-height: 0;
          }

          .homepage-image-mosaic-grid {
            grid-template-columns:
              repeat(
                var(--mosaic-desktop-columns),
                minmax(0, 1fr)
              ) !important;

            grid-auto-rows:
              var(--mosaic-desktop-row-height)
              !important;
          }
        }
      `}</style>
    </section>
  )
}