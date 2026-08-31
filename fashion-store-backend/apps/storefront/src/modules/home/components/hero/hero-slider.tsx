"use client"

import {
  useEffect,
  useState,
} from "react"

export type HeroBanner = {
  id: string
  media_url: string
  media_type: "image" | "video"

  hero_height?: number
  mobile_media_url?: string | null
  mobile_media_type?: "image" | "video"
  mobile_height?: number

  eyebrow?: string | null
  title?: string | null
  subtitle?: string | null

  eyebrow_font_family?: string
  eyebrow_font_style?: string
  eyebrow_text_transform?: string
  eyebrow_color?: string
  eyebrow_size?: number
  eyebrow_weight?: number
  eyebrow_letter_spacing?: number
  eyebrow_line_height?: number

  title_font_family?: string
  title_font_style?: string
  title_text_transform?: string
  title_color?: string
  title_size?: number

  /*
   * Legacy DB fields can still exist.
   * Storefront intentionally ignores them:
   * Hero now has ONE responsive master.
   */
  title_mobile_size?: number

  title_weight?: number
  title_letter_spacing?: number
  title_line_height?: number

  subtitle_font_family?: string
  subtitle_font_style?: string
  subtitle_text_transform?: string
  subtitle_color?: string
  subtitle_size?: number
  subtitle_mobile_size?: number
  subtitle_weight?: number
  subtitle_letter_spacing?: number
  subtitle_line_height?: number

  text_align?:
    | "left"
    | "center"
    | "right"

  vertical_position?:
    | "top"
    | "center"
    | "bottom"

  horizontal_position?:
    | "left"
    | "center"
    | "right"

  content_offset_x?: number
  content_offset_y?: number

  button_text?: string | null
  button_url?: string | null
  button_bg_color?: string
  button_text_color?: string
  button_size?: number

  secondary_button_text?:
    | string
    | null

  secondary_button_url?:
    | string
    | null

  secondary_button_bg_color?: string
  secondary_button_text_color?: string

  object_position?: string

  overlay_color?: string
  overlay_opacity?: number

  position?: number
  is_active?: boolean
  autoplay_duration?: number
}

type HeroSliderProps = {
  slides: HeroBanner[]
}

/*
 * ONE MASTER CANVAS
 *
 * This is the reference composition.
 * Every viewport keeps the same aspect ratio,
 * image crop, focal position and content position.
 */
const HERO_MASTER_WIDTH = 1440

const toCqw = (
  pixels: number
) =>
  `${(
    (pixels /
      HERO_MASTER_WIDTH) *
    100
  ).toFixed(4)}cqw`

const responsiveSize = (
  pixels: number,
  minimum = 0
) =>
  `clamp(${minimum}px, ${toCqw(
    pixels
  )}, ${pixels}px)`

const GOOGLE_FONT_FAMILIES =
  new Set([
    "Inter",
    "Playfair Display",
    "Cormorant Garamond",
    "Bodoni Moda",
    "DM Sans",
    "Montserrat",
    "Poppins",
    "Lora",
    "Raleway",
    "Oswald",
    "Manrope",
  ])

const loadedHeroFonts =
  new Set<string>()

const loadHeroFont = (
  family?: string
) => {
  if (
    typeof document ===
      "undefined" ||
    !family ||
    !GOOGLE_FONT_FAMILIES.has(
      family
    ) ||
    loadedHeroFonts.has(family)
  ) {
    return
  }

  const id =
    `safafi-hero-font-${family
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )}`

  if (
    document.getElementById(id)
  ) {
    loadedHeroFonts.add(
      family
    )
    return
  }

  const link =
    document.createElement(
      "link"
    )

  link.id = id
  link.rel = "stylesheet"
  link.href =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    ).replace(
      /%20/g,
      "+"
    )}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap`

  document.head.appendChild(
    link
  )

  loadedHeroFonts.add(
    family
  )
}

const hexToRgba = (
  color = "#000000",
  opacity = 0
) => {
  const normalized =
    color.replace("#", "")

  if (
    normalized.length !== 6
  ) {
    return `rgba(0,0,0,${
      opacity / 100
    })`
  }

  const r =
    parseInt(
      normalized.substring(
        0,
        2
      ),
      16
    )

  const g =
    parseInt(
      normalized.substring(
        2,
        4
      ),
      16
    )

  const b =
    parseInt(
      normalized.substring(
        4,
        6
      ),
      16
    )

  return `rgba(${r}, ${g}, ${b}, ${
    opacity / 100
  })`
}

const getHorizontalClass = (
  slide: HeroBanner
) => {
  switch (
    slide.horizontal_position
  ) {
    case "left":
      return "justify-start"

    case "right":
      return "justify-end"

    default:
      return "justify-center"
  }
}

const getVerticalClass = (
  slide: HeroBanner
) => {
  switch (
    slide.vertical_position
  ) {
    case "top":
      return "items-start"

    case "bottom":
      return "items-end"

    default:
      return "items-center"
  }
}

const getTextAlignClass = (
  slide: HeroBanner
) => {
  switch (slide.text_align) {
    case "left":
      return "text-left"

    case "right":
      return "text-right"

    default:
      return "text-center"
  }
}

export default function HeroSlider({
  slides,
}: HeroSliderProps) {
  const [
    activeSlide,
    setActiveSlide,
  ] = useState(0)

  /*
   * Fonts are the only thing loaded
   * after hydration. Hero DATA itself
   * already arrived from the server.
   */
  useEffect(() => {
    const families =
      new Set<string>()

    slides.forEach(
      (slide) => {
        if (
          slide.eyebrow_font_family
        ) {
          families.add(
            slide.eyebrow_font_family
          )
        }

        if (
          slide.title_font_family
        ) {
          families.add(
            slide.title_font_family
          )
        }

        if (
          slide.subtitle_font_family
        ) {
          families.add(
            slide.subtitle_font_family
          )
        }
      }
    )

    families.forEach(
      (family) =>
        loadHeroFont(family)
    )
  }, [slides])

  useEffect(() => {
    if (
      activeSlide >=
      slides.length
    ) {
      setActiveSlide(0)
    }
  }, [
    slides.length,
    activeSlide,
  ])

  useEffect(() => {
    if (
      slides.length <= 1
    ) {
      return
    }

    const duration =
      slides[activeSlide]
        ?.autoplay_duration ??
      7000

    const timer =
      window.setTimeout(() => {
        setActiveSlide(
          (current) =>
            (current + 1) %
            slides.length
        )
      }, duration)

    return () =>
      window.clearTimeout(
        timer
      )
  }, [
    activeSlide,
    slides,
  ])

  if (!slides.length) {
    return null
  }

  /*
   * Slider height is controlled by the first active slide.
   * Keep the same saved Hero Master Height across slides
   * for a perfectly stable carousel.
   */
  const heroMasterHeight =
    Math.max(
      360,
      Number(
        slides[0]
          ?.hero_height
      ) || 720
    )

  const heroMobileHeight =
    Math.max(
      400,
      Number(
        slides[0]
          ?.mobile_height
      ) || 540
    )

  const goToPrevious = () => {
    setActiveSlide(
      (current) =>
        (current -
          1 +
          slides.length) %
        slides.length
    )
  }

  const goToNext = () => {
    setActiveSlide(
      (current) =>
        (current + 1) %
        slides.length
    )
  }

  return (
    <section
      className="
        safafi-smart-hero
        relative
        w-full
        overflow-hidden
        bg-black
      "
      style={{
        /*
         * Admin controls ONE desktop/master height.
         * CSS below derives small-desktop, tablet and
         * mobile heights automatically.
         */
        "--hero-desktop-height":
          `${heroMasterHeight}px`,

        "--hero-mobile-height":
          `${heroMobileHeight}px`,

        /*
         * Enables cqw units for typography and offsets.
         */
        containerType:
          "inline-size",
      } as React.CSSProperties}
    >
      {slides.map(
        (
          slide,
          index
        ) => {
          const isActive =
            index ===
            activeSlide

          const overlayBackground =
            hexToRgba(
              slide.overlay_color,
              slide.overlay_opacity ??
                20
            )

          const titleSize =
            slide.title_size ??
            88

          const subtitleSize =
            slide.subtitle_size ??
            16

          const eyebrowSize =
            slide.eyebrow_size ??
            14

          const buttonSize =
            slide.button_size ??
            14

          return (
            <div
              key={slide.id}
              className={`
                absolute
                inset-0
                transition-opacity
                duration-700
                ${
                  isActive
                    ? "z-10 opacity-100"
                    : "pointer-events-none z-0 opacity-0"
                }
              `}
            >
              {/*
               * Desktop artwork. If a mobile override exists,
               * hide this media below md.
               */}
              {slide.media_type ===
              "video" ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload={
                    index === 0
                      ? "auto"
                      : "metadata"
                  }
                  className={`
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    ${
                      slide.mobile_media_url
                        ? "hidden md:block"
                        : ""
                    }
                  `}
                  style={{
                    objectPosition:
                      slide.object_position ||
                      "center",
                  }}
                >
                  <source
                    src={
                      slide.media_url
                    }
                  />
                </video>
              ) : (
                <img
                  src={
                    slide.media_url
                  }
                  alt={
                    slide.title ||
                    "Safafi Hero Banner"
                  }
                  loading={
                    index === 0
                      ? "eager"
                      : "lazy"
                  }
                  fetchPriority={
                    index === 0
                      ? "high"
                      : "auto"
                  }
                  decoding="async"
                  draggable={
                    false
                  }
                  className={`
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    ${
                      slide.mobile_media_url
                        ? "hidden md:block"
                        : ""
                    }
                  `}
                  style={{
                    objectPosition:
                      slide.object_position ||
                      "center",
                  }}
                />
              )}

              {slide.mobile_media_url &&
                (
                  slide.mobile_media_type ===
                  "video" ? (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload={
                        index === 0
                          ? "auto"
                          : "metadata"
                      }
                      className="
                        absolute
                        inset-0
                        block
                        h-full
                        w-full
                        object-cover
                        md:hidden
                      "
                      style={{
                        objectPosition:
                          slide.object_position ||
                          "center",
                      }}
                    >
                      <source
                        src={
                          slide.mobile_media_url
                        }
                      />
                    </video>
                  ) : (
                    <img
                      src={
                        slide.mobile_media_url
                      }
                      alt={
                        slide.title ||
                        "Safafi Hero Banner"
                      }
                      loading={
                        index === 0
                          ? "eager"
                          : "lazy"
                      }
                      fetchPriority={
                        index === 0
                          ? "high"
                          : "auto"
                      }
                      decoding="async"
                      draggable={false}
                      className="
                        absolute
                        inset-0
                        block
                        h-full
                        w-full
                        object-cover
                        md:hidden
                      "
                      style={{
                        objectPosition:
                          slide.object_position ||
                          "center",
                      }}
                    />
                  )
                )}

              <div
                className="absolute inset-0"
                style={{
                  background:
                    overlayBackground,
                }}
              />

              <div
                className={`
                  safafi-hero-content
                  absolute
                  inset-0
                  z-20
                  flex
                  ${getVerticalClass(
                    slide
                  )}
                  ${getHorizontalClass(
                    slide
                  )}
                `}
                style={{
                  padding:
                    responsiveSize(
                      48,
                      8
                    ),
                }}
              >
                <div
                  className={`
                    safafi-hero-copy
                    w-full
                    ${getTextAlignClass(
                      slide
                    )}
                  `}
                  style={{
                    maxWidth:
                      `${
                        (896 /
                          HERO_MASTER_WIDTH) *
                        100
                      }%`,

                    transform:
                      `translate(
                        ${toCqw(
                          slide.content_offset_x ??
                            0
                        )},
                        ${toCqw(
                          slide.content_offset_y ??
                            0
                        )}
                      )`,
                  }}
                >
                  {slide.eyebrow && (
                    <p
                      style={{
                        color:
                          slide.eyebrow_color ||
                          "#FFFFFF",

                        fontFamily:
                          slide.eyebrow_font_family ||
                          "Inter, Arial, sans-serif",

                        fontSize:
                          responsiveSize(
                            eyebrowSize,
                            8
                          ),

                        fontWeight:
                          slide.eyebrow_weight ??
                          600,

                        fontStyle:
                          slide.eyebrow_font_style ===
                          "italic"
                            ? "italic"
                            : "normal",

                        textTransform:
                          (slide.eyebrow_text_transform as React.CSSProperties["textTransform"]) ||
                          "uppercase",

                        letterSpacing:
                          responsiveSize(
                            slide.eyebrow_letter_spacing ??
                              2,
                            0
                          ),

                        lineHeight:
                          slide.eyebrow_line_height ??
                          1.2,
                      }}
                    >
                      {
                        slide.eyebrow
                      }
                    </p>
                  )}

                  {slide.title && (
                    <h1
                      style={{
                        marginTop:
                          responsiveSize(
                            12,
                            3
                          ),

                        fontSize:
                          responsiveSize(
                            titleSize,
                            26
                          ),

                        color:
                          slide.title_color ||
                          "#FFFFFF",

                        fontFamily:
                          slide.title_font_family ||
                          "'Playfair Display', 'Times New Roman', serif",

                        fontWeight:
                          slide.title_weight ??
                          500,

                        fontStyle:
                          slide.title_font_style ===
                          "italic"
                            ? "italic"
                            : "normal",

                        textTransform:
                          (slide.title_text_transform as React.CSSProperties["textTransform"]) ||
                          "none",

                        letterSpacing:
                          responsiveSize(
                            slide.title_letter_spacing ??
                              0,
                            0
                          ),

                        lineHeight:
                          slide.title_line_height ??
                          0.95,
                      }}
                    >
                      {slide.title}
                    </h1>
                  )}

                  {slide.subtitle && (
                    <p
                      style={{
                        marginTop:
                          responsiveSize(
                            16,
                            5
                          ),

                        fontSize:
                          responsiveSize(
                            subtitleSize,
                            12
                          ),

                        color:
                          slide.subtitle_color ||
                          "#FFFFFF",

                        fontFamily:
                          slide.subtitle_font_family ||
                          "Inter, Arial, sans-serif",

                        fontWeight:
                          slide.subtitle_weight ??
                          400,

                        fontStyle:
                          slide.subtitle_font_style ===
                          "italic"
                            ? "italic"
                            : "normal",

                        textTransform:
                          (slide.subtitle_text_transform as React.CSSProperties["textTransform"]) ||
                          "none",

                        letterSpacing:
                          responsiveSize(
                            slide.subtitle_letter_spacing ??
                              0,
                            0
                          ),

                        lineHeight:
                          slide.subtitle_line_height ??
                          1.5,
                      }}
                    >
                      {
                        slide.subtitle
                      }
                    </p>
                  )}

                  {(slide.button_text ||
                    slide.secondary_button_text) && (
                    <div
                      className={`
                        flex
                        flex-wrap
                        ${
                          slide.text_align ===
                          "left"
                            ? "justify-start"
                            : slide.text_align ===
                                "right"
                              ? "justify-end"
                              : "justify-center"
                        }
                      `}
                      style={{
                        marginTop:
                          responsiveSize(
                            28,
                            8
                          ),

                        gap:
                          responsiveSize(
                            12,
                            5
                          ),
                      }}
                    >
                      {slide.button_text && (
                        <a
                          href={
                            slide.button_url ||
                            "/"
                          }
                          className="
                            inline-flex
                            items-center
                            justify-center
                            text-center
                            hover:opacity-75
                          "
                          style={{
                            padding:
                              `${responsiveSize(
                                14,
                                6
                              )} ${responsiveSize(
                                24,
                                10
                              )}`,

                            backgroundColor:
                              slide.button_bg_color ||
                              "#FFFFFF",

                            color:
                              slide.button_text_color ||
                              "#000000",

                            border:
                              `1px solid ${
                                slide.button_bg_color ||
                                "#FFFFFF"
                              }`,

                            borderRadius: 0,

                            fontFamily:
                              '"Helvetica Neue", Helvetica, Arial, sans-serif',

                            fontSize:
                              responsiveSize(
                                12,
                                9
                              ),

                            fontWeight: 400,

                            textTransform:
                              "uppercase",

                            letterSpacing:
                              "0.12em",

                            transition:
                              "background-color 180ms ease, color 180ms ease, border-color 180ms ease, opacity 180ms ease",
                          }}
                        >
                          {
                            slide.button_text
                          }
                        </a>
                      )}

                      {slide.secondary_button_text && (
                        <a
                          href={
                            slide.secondary_button_url ||
                            "/"
                          }
                          className="
                            inline-flex
                            items-center
                            justify-center
                            text-center
                            hover:opacity-75
                          "
                          style={{
                            padding:
                              `${responsiveSize(
                                14,
                                6
                              )} ${responsiveSize(
                                24,
                                10
                              )}`,

                            backgroundColor:
                              slide.secondary_button_bg_color ||
                              "transparent",

                            color:
                              slide.secondary_button_text_color ||
                              "#FFFFFF",

                            border:
                              `1px solid ${
                                slide.secondary_button_text_color ||
                                "#FFFFFF"
                              }`,

                            borderRadius: 0,

                            fontFamily:
                              '"Helvetica Neue", Helvetica, Arial, sans-serif',

                            fontSize:
                              responsiveSize(
                                12,
                                9
                              ),

                            fontWeight: 400,

                            textTransform:
                              "uppercase",

                            letterSpacing:
                              "0.12em",

                            transition:
                              "background-color 180ms ease, color 180ms ease, border-color 180ms ease, opacity 180ms ease",
                          }}
                        >
                          {
                            slide.secondary_button_text
                          }
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }
      )}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={
              goToPrevious
            }
            aria-label="Previous slide"
            className="
              absolute
              left-3
              top-1/2
              z-30
              hidden
              -translate-y-1/2
              rounded-full
              bg-black/20
              p-3
              text-2xl
              text-white
              backdrop-blur-sm
              transition
              hover:bg-black/40
              sm:block
            "
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className="
              absolute
              right-3
              top-1/2
              z-30
              hidden
              -translate-y-1/2
              rounded-full
              bg-black/20
              p-3
              text-2xl
              text-white
              backdrop-blur-sm
              transition
              hover:bg-black/40
              sm:block
            "
          >
            ›
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div
          className="
            absolute
            bottom-3
            left-1/2
            z-30
            flex
            -translate-x-1/2
            items-center
            gap-2
            sm:bottom-5
          "
        >
          {slides.map(
            (
              slide,
              index
            ) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${
                  index + 1
                }`}
                onClick={() =>
                  setActiveSlide(
                    index
                  )
                }
                className={`
                  h-2
                  w-2
                  rounded-full
                  border
                  border-white
                  transition-all
                  ${
                    index ===
                    activeSlide
                      ? "scale-110 bg-white"
                      : "bg-transparent"
                  }
                `}
              />
            )
          )}
        </div>
      )}
      <style>{`
        /*
         * SMART RESPONSIVE MASTER
         *
         * Large desktop:
         *   use the exact Admin master height.
         *
         * Small desktop:
         *   slightly reduce height but keep a substantial hero.
         *
         * Tablet:
         *   portrait-ish / cinematic frame, not a thin scaled strip.
         *
         * Phone:
         *   keep enough height for fashion imagery + readable copy.
         *
         * There is still only ONE Admin design.
         */
        /*
         * Desktop / narrow desktop:
         * width changes but Hero height stays stable.
         */
        .safafi-smart-hero {
          height:
            var(--hero-desktop-height);
        }

        /*
         * Mobile breakpoint:
         * switch once to the mobile height and optional artwork.
         */
        @media (max-width: 767px) {
          .safafi-smart-hero {
            height:
              var(--hero-mobile-height);
          }

          .safafi-hero-content {
            padding: 18px !important;
          }

          .safafi-hero-copy {
            max-width: 86% !important;
          }
        }
      `}</style>
    </section>
  )
}
