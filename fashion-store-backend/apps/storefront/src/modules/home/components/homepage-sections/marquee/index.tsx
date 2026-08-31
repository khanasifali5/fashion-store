"use client"

import { MarqueeConfig } from "@lib/data/homepage-sections"

type Props = {
  title?: string | null
  config: MarqueeConfig
}

export default function Marquee({
  title,
  config,
}: Props) {
  const items = (
    config.items || []
  ).filter(Boolean)

  const messages =
    items.length
      ? items
      : title
        ? [title]
        : []

  if (!messages.length) {
    return null
  }

  const repeated = [
    ...messages,
    ...messages,
    ...messages,
    ...messages,
  ]

  const animationName =
    config.direction === "right"
      ? "homepage-marquee-right"
      : "homepage-marquee-left"

  const speed = Math.max(
    5,
    config.speed ?? 28
  )

  const itemGap = Math.max(
    0,
    config.item_gap ?? 36
  )

  const verticalPadding =
    Math.max(
      0,
      config.padding_y ?? 16
    )

  return (
    <section
      className={[
        "w-full overflow-hidden",

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
          "#111111",

        color:
          config.text_color ??
          "#FFFFFF",

        paddingTop:
          Math.max(
            0,
            config.top_spacing ?? 0
          ),

        paddingBottom:
          Math.max(
            0,
            config.bottom_spacing ?? 0
          ),
      }}
    >
      <div
        className={[
          "homepage-marquee-track",
          "flex w-max items-center whitespace-nowrap",

          config.pause_on_hover === false
            ? ""
            : "hover:[animation-play-state:paused]",
        ].join(" ")}
        style={{
          animationName,

          animationDuration:
            `${speed}s`,

          animationTimingFunction:
            "linear",

          animationIterationCount:
            "infinite",

          paddingTop:
            verticalPadding,

          paddingBottom:
            verticalPadding,

          fontFamily:
            config.font ??
            "Arial, sans-serif",

          fontWeight:
            config.font_weight ??
            500,

          letterSpacing:
            `${
              config.letter_spacing ??
              2
            }px`,

          textTransform:
            config.text_transform ??
            "uppercase",

          ["--marquee-mobile-size" as string]:
            `${
              config.mobile_font_size ??
              14
            }px`,

          ["--marquee-desktop-size" as string]:
            `${
              config.font_size ??
              18
            }px`,
        }}
      >
        {repeated.map(
          (message, index) => (
            <div
              key={`${message}-${index}`}
              className="flex shrink-0 items-center"
            >
              <span>
                {message}
              </span>

              <span
                aria-hidden="true"
                style={{
                  color:
                    config.separator_color ??
                    config.text_color ??
                    "#FFFFFF",

                  marginLeft:
                    itemGap,

                  marginRight:
                    itemGap,
                }}
              >
                {config.separator ??
                  "✦"}
              </span>
            </div>
          )
        )}
      </div>

      <style>{`
        .homepage-marquee-track {
          font-size:
            var(--marquee-mobile-size);

          will-change:
            transform;
        }

        @media (min-width: 768px) {
          .homepage-marquee-track {
            font-size:
              var(--marquee-desktop-size);
          }
        }

        @keyframes homepage-marquee-left {
          from {
            transform:
              translateX(0);
          }

          to {
            transform:
              translateX(-50%);
          }
        }

        @keyframes homepage-marquee-right {
          from {
            transform:
              translateX(-50%);
          }

          to {
            transform:
              translateX(0);
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .homepage-marquee-track {
            animation-play-state:
              paused !important;
          }
        }
      `}</style>
    </section>
  )
}