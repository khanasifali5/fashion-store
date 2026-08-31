import { SpacerConfig } from "@lib/data/homepage-sections"
import { HOMEPAGE_WIDTH } from "../spacing"

type Props = {
  config: SpacerConfig
}

export default function Spacer({
  config,
}: Props) {
  const dividerWidth = Math.max(
    1,
    Math.min(
      100,
      config.divider_width ?? 100
    )
  )

  const thickness = Math.max(
    1,
    config.divider_thickness ?? 1
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
        backgroundColor:
          config.background ??
          "#FFFFFF",

        paddingTop:
          config.top_spacing ??
          0,

        paddingBottom:
          config.bottom_spacing ??
          0,
      }}
      aria-hidden="true"
    >
      <div className={HOMEPAGE_WIDTH[width]}>
        <div
          className="relative flex items-center justify-center"
          style={{
            height: `clamp(
              ${
                config.mobile_height ??
                40
              }px,
              6vw,
              ${
                config.height ??
                64
              }px
            )`,
          }}
        >
          {config.show_divider && (
            <div
              style={{
                width:
                  `${dividerWidth}%`,

                borderTopWidth:
                  `${thickness}px`,

                borderTopStyle:
                  config.divider_style ??
                  "solid",

                borderTopColor:
                  config.divider_color ??
                  "#D9D9D9",
              }}
            />
          )}
        </div>
      </div>
    </section>
  )
}