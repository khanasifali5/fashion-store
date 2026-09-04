"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"

export type HeroBanner = {
  id: string
  media_url: string
  media_type: "image" | "video"

  hero_height?: number
  mobile_media_url?: string | null
  mobile_media_type?: "image" | "video"
  mobile_height?: number

  poster_url?: string | null
  mobile_poster_url?: string | null

  media_alt?: string | null
  mobile_media_alt?: string | null

  desktop_focal_x?: number
  desktop_focal_y?: number
  mobile_focal_x?: number | null
  mobile_focal_y?: number | null

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

  mobile_typography_override?: boolean

  text_align?: "left" | "center" | "right"
  vertical_position?: "top" | "center" | "bottom"
  horizontal_position?: "left" | "center" | "right"

  content_offset_x?: number
  content_offset_y?: number
  content_max_width?: number

  mobile_text_align?: "left" | "center" | "right" | null
  mobile_vertical_position?: "top" | "center" | "bottom" | null
  mobile_horizontal_position?: "left" | "center" | "right" | null
  mobile_content_offset_x?: number | null
  mobile_content_offset_y?: number | null
  mobile_content_max_width?: number

  button_text?: string | null
  button_url?: string | null
  button_bg_color?: string
  button_text_color?: string
  button_size?: number
  button_style?: "filled" | "outline" | "text"

  secondary_button_text?: string | null
  secondary_button_url?: string | null
  secondary_button_bg_color?: string
  secondary_button_text_color?: string
  secondary_button_style?: "filled" | "outline" | "text"

  /* Legacy fallback for banners created before focal points existed. */
  object_position?: string

  overlay_color?: string
  overlay_opacity?: number
  overlay_type?: "none" | "solid" | "gradient"
  overlay_direction?: "full" | "left" | "right" | "bottom"

  position?: number
  is_active?: boolean
  autoplay_duration?: number

  starts_at?: string | null
  ends_at?: string | null
}

type HeroSliderProps = {
  slides: HeroBanner[]
}

const HERO_MASTER_WIDTH = 1440
const MOBILE_MASTER_WIDTH = 390
const MOBILE_BREAKPOINT = 767
const SWIPE_THRESHOLD = 48

const GOOGLE_FONT_FAMILIES = new Set([
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

const loadedHeroFonts = new Set<string>()

const loadHeroFont = (family?: string) => {
  if (
    typeof document === "undefined" ||
    !family ||
    !GOOGLE_FONT_FAMILIES.has(family) ||
    loadedHeroFonts.has(family)
  ) {
    return
  }

  const id = `safafi-hero-font-${family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`

  if (document.getElementById(id)) {
    loadedHeroFonts.add(family)
    return
  }

  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  ).replace(
    /%20/g,
    "+"
  )}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap`

  document.head.appendChild(link)
  loadedHeroFonts.add(family)
}

const toCqw = (
  pixels: number,
  masterWidth = HERO_MASTER_WIDTH
) =>
  `${((pixels / masterWidth) * 100).toFixed(4)}cqw`

const responsiveSize = (
  pixels: number,
  minimum = 0,
  masterWidth = HERO_MASTER_WIDTH
) =>
  `clamp(${minimum}px, ${toCqw(
    pixels,
    masterWidth
  )}, ${pixels}px)`

const hexToRgba = (
  color = "#000000",
  opacity = 0
) => {
  const normalized = color.replace("#", "")

  if (normalized.length !== 6) {
    return `rgba(0,0,0,${opacity / 100})`
  }

  const red = parseInt(normalized.substring(0, 2), 16)
  const green = parseInt(normalized.substring(2, 4), 16)
  const blue = parseInt(normalized.substring(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${opacity / 100})`
}

const getOverlayBackground = (
  type = "solid",
  direction = "full",
  color = "#000000",
  opacity = 10
) => {
  if (type === "none" || opacity <= 0) {
    return "transparent"
  }

  const strong = hexToRgba(color, opacity)
  const soft = hexToRgba(color, 0)

  if (type !== "gradient" || direction === "full") {
    return strong
  }

  if (direction === "left") {
    return `linear-gradient(90deg, ${strong} 0%, ${hexToRgba(
      color,
      Math.round(opacity * 0.7)
    )} 38%, ${soft} 78%)`
  }

  if (direction === "right") {
    return `linear-gradient(270deg, ${strong} 0%, ${hexToRgba(
      color,
      Math.round(opacity * 0.7)
    )} 38%, ${soft} 78%)`
  }

  return `linear-gradient(0deg, ${strong} 0%, ${hexToRgba(
    color,
    Math.round(opacity * 0.65)
  )} 34%, ${soft} 76%)`
}

const getButtonStyle = (
  style = "filled",
  background = "#FFFFFF",
  textColor = "#000000"
): CSSProperties => {
  if (style === "outline") {
    return {
      backgroundColor: "transparent",
      color: textColor,
      border: `1px solid ${textColor}`,
    }
  }

  if (style === "text") {
    return {
      backgroundColor: "transparent",
      color: textColor,
      border: "1px solid transparent",
      borderBottomColor: textColor,
      paddingLeft: 0,
      paddingRight: 0,
    }
  }

  return {
    backgroundColor: background,
    color: textColor,
    border: `1px solid ${background}`,
  }
}

const legacyObjectPositionToFocal = (position?: string) => {
  switch (position) {
    case "left":
      return { x: 0, y: 50 }
    case "right":
      return { x: 100, y: 50 }
    case "top":
      return { x: 50, y: 0 }
    case "bottom":
      return { x: 50, y: 100 }
    default:
      return { x: 50, y: 50 }
  }
}

const clampPercent = (value: unknown, fallback: number) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.min(100, Math.max(0, number))
}

const positionToAlignItems = (
  value?: "top" | "center" | "bottom" | null
) => {
  if (value === "top") return "flex-start"
  if (value === "bottom") return "flex-end"
  return "center"
}

const positionToJustifyContent = (
  value?: "left" | "center" | "right" | null
) => {
  if (value === "left") return "flex-start"
  if (value === "right") return "flex-end"
  return "center"
}

const textAlignToJustifyContent = (
  value?: "left" | "center" | "right" | null
) => {
  if (value === "left") return "flex-start"
  if (value === "right") return "flex-end"
  return "center"
}

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    )

    const update = () => setReduced(media.matches)
    update()

    media.addEventListener?.("change", update)

    return () => {
      media.removeEventListener?.("change", update)
    }
  }, [])

  return reduced
}

const useMobileViewport = () => {
  const [mobile, setMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const media = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT}px)`
    )

    const update = () => setMobile(media.matches)
    update()

    media.addEventListener?.("change", update)

    return () => {
      media.removeEventListener?.("change", update)
    }
  }, [])

  return mobile
}

type HeroVideoProps = {
  src: string
  poster?: string
  active: boolean
  reducedMotion: boolean
  shouldLoad: boolean
  objectPosition: string
  className: string
}

const HeroVideo = ({
  src,
  poster,
  active,
  reducedMotion,
  shouldLoad,
  objectPosition,
  className,
}: HeroVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    if (active && !reducedMotion && shouldLoad) {
      const promise = video.play()
      promise?.catch(() => undefined)
      return
    }

    video.pause()
  }, [active, reducedMotion, shouldLoad, src])

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      poster={poster || undefined}
      preload={shouldLoad ? (active ? "auto" : "metadata") : "none"}
      className={className}
      style={{ objectPosition }}
      aria-hidden="true"
    >
      <source src={src} />
    </video>
  )
}

export default function HeroSlider({
  slides,
}: HeroSliderProps) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const reducedMotion = usePrefersReducedMotion()
  const mobileViewport = useMobileViewport()

  useEffect(() => {
    const families = new Set<string>()

    slides.forEach((slide) => {
      if (slide.eyebrow_font_family) {
        families.add(slide.eyebrow_font_family)
      }

      if (slide.title_font_family) {
        families.add(slide.title_font_family)
      }

      if (slide.subtitle_font_family) {
        families.add(slide.subtitle_font_family)
      }
    })

    families.forEach((family) => loadHeroFont(family))
  }, [slides])

  useEffect(() => {
    if (activeSlide >= slides.length) {
      setActiveSlide(0)
    }
  }, [slides.length, activeSlide])

  useEffect(() => {
    if (
      slides.length <= 1 ||
      interactionPaused ||
      reducedMotion
    ) {
      return
    }

    const duration = Math.max(
      1000,
      Number(slides[activeSlide]?.autoplay_duration) || 6000
    )

    const timer = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, duration)

    return () => window.clearTimeout(timer)
  }, [
    activeSlide,
    slides,
    interactionPaused,
    reducedMotion,
  ])

  if (!slides.length) {
    return null
  }

  /*
   * Keep carousel height stable between slides.
   * The first ordered slide remains the shared height master.
   */
  const heroMasterHeight = Math.max(
    360,
    Number(slides[0]?.hero_height) || 720
  )

  const heroMobileHeight = Math.max(
    400,
    Number(slides[0]?.mobile_height) || 540
  )

  /*
   * At 1440px the Hero reaches the exact Admin master height.
   * Below that it scales with the same 1440 reference until a
   * 500px cinematic minimum is reached.
   */
  const desktopMinimumHeight = Math.min(500, heroMasterHeight)
  const desktopFluidHeight =
    (heroMasterHeight / HERO_MASTER_WIDTH) * 100

  const goToPrevious = () => {
    setActiveSlide(
      (current) =>
        (current - 1 + slides.length) % slides.length
    )
  }

  const goToNext = () => {
    setActiveSlide((current) => (current + 1) % slides.length)
  }

  const handleTouchStart = (
    event: React.TouchEvent<HTMLElement>
  ) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (
    event: React.TouchEvent<HTMLElement>
  ) => {
    if (touchStartX.current === null || slides.length <= 1) {
      touchStartX.current = null
      return
    }

    const endX = event.changedTouches[0]?.clientX

    if (endX === undefined) {
      touchStartX.current = null
      return
    }

    const delta = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      return
    }

    if (delta < 0) {
      goToNext()
    } else {
      goToPrevious()
    }
  }

  return (
    <section
      className="safafi-smart-hero relative w-full overflow-hidden bg-black"
      aria-label="Featured collections"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setInteractionPaused(false)
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={
        {
          "--hero-desktop-height": `${heroMasterHeight}px`,
          "--hero-desktop-min-height": `${desktopMinimumHeight}px`,
          "--hero-desktop-fluid-height": `${desktopFluidHeight.toFixed(4)}vw`,
          "--hero-mobile-height": `${heroMobileHeight}px`,
          containerType: "inline-size",
        } as CSSProperties
      }
    >
      {slides.map((slide, index) => {
        const isActive = index === activeSlide

        const legacyFocal = legacyObjectPositionToFocal(
          slide.object_position
        )

        const desktopFocalX = clampPercent(
          slide.desktop_focal_x,
          legacyFocal.x
        )
        const desktopFocalY = clampPercent(
          slide.desktop_focal_y,
          legacyFocal.y
        )

        const mobileFocalX = clampPercent(
          slide.mobile_focal_x,
          desktopFocalX
        )
        const mobileFocalY = clampPercent(
          slide.mobile_focal_y,
          desktopFocalY
        )

        const desktopObjectPosition = `${desktopFocalX}% ${desktopFocalY}%`
        const mobileObjectPosition = `${mobileFocalX}% ${mobileFocalY}%`

        const desktopTextAlign = slide.text_align || "center"
        const mobileTextAlign =
          slide.mobile_text_align || desktopTextAlign

        const desktopVertical = slide.vertical_position || "center"
        const mobileVertical =
          slide.mobile_vertical_position || desktopVertical

        const desktopHorizontal = slide.horizontal_position || "center"
        const mobileHorizontal =
          slide.mobile_horizontal_position || desktopHorizontal

        const desktopOffsetX = slide.content_offset_x ?? 0
        const desktopOffsetY = slide.content_offset_y ?? 0

        const mobileOffsetX =
          slide.mobile_content_offset_x ?? desktopOffsetX
        const mobileOffsetY =
          slide.mobile_content_offset_y ?? desktopOffsetY

        const desktopContentWidth = Math.max(
          240,
          Number(slide.content_max_width) || 620
        )

        const mobileContentWidth = Math.max(
          220,
          Number(slide.mobile_content_max_width) || 340
        )

        const titleSize = Number(slide.title_size) || 64
        const subtitleSize = Number(slide.subtitle_size) || 18
        const eyebrowSize = Number(slide.eyebrow_size) || 14
        const buttonSize = Number(slide.button_size) || 13

        const useMobileTypography =
          slide.mobile_typography_override === true

        const mobileTitleSize = useMobileTypography
          ? Number(slide.title_mobile_size) || 38
          : titleSize

        const mobileSubtitleSize = useMobileTypography
          ? Number(slide.subtitle_mobile_size) || 15
          : subtitleSize

        const mobileTypographyMaster = useMobileTypography
          ? MOBILE_MASTER_WIDTH
          : HERO_MASTER_WIDTH

        const overlayBackground = getOverlayBackground(
          slide.overlay_type || "solid",
          slide.overlay_direction || "full",
          slide.overlay_color || "#000000",
          Math.max(
            0,
            Math.min(100, Number(slide.overlay_opacity) || 0)
          )
        )

        const hasMobileMedia = Boolean(slide.mobile_media_url)
        const desktopShouldLoad =
          mobileViewport === null
            ? false
            : mobileViewport === false || !hasMobileMedia
        const mobileShouldLoad =
          mobileViewport === true && hasMobileMedia

        const contentStyle = {
          "--hero-desktop-align-items": positionToAlignItems(
            desktopVertical
          ),
          "--hero-mobile-align-items": positionToAlignItems(
            mobileVertical
          ),
          "--hero-desktop-justify-content": positionToJustifyContent(
            desktopHorizontal
          ),
          "--hero-mobile-justify-content": positionToJustifyContent(
            mobileHorizontal
          ),
        } as CSSProperties

        const copyStyle = {
          "--hero-desktop-copy-width": toCqw(
            desktopContentWidth,
            HERO_MASTER_WIDTH
          ),
          "--hero-mobile-copy-width": toCqw(
            mobileContentWidth,
            MOBILE_MASTER_WIDTH
          ),
          "--hero-desktop-text-align": desktopTextAlign,
          "--hero-mobile-text-align": mobileTextAlign,
          "--hero-desktop-actions-justify": textAlignToJustifyContent(
            desktopTextAlign
          ),
          "--hero-mobile-actions-justify": textAlignToJustifyContent(
            mobileTextAlign
          ),
          "--hero-desktop-offset-x": toCqw(
            desktopOffsetX,
            HERO_MASTER_WIDTH
          ),
          "--hero-desktop-offset-y": toCqw(
            desktopOffsetY,
            HERO_MASTER_WIDTH
          ),
          "--hero-mobile-offset-x": toCqw(
            mobileOffsetX,
            MOBILE_MASTER_WIDTH
          ),
          "--hero-mobile-offset-y": toCqw(
            mobileOffsetY,
            MOBILE_MASTER_WIDTH
          ),
        } as CSSProperties

        const titleStyle = {
          color: slide.title_color || "#FFFFFF",
          fontFamily:
            slide.title_font_family ||
            "'Playfair Display', 'Times New Roman', serif",
          fontWeight: slide.title_weight ?? 700,
          fontStyle:
            slide.title_font_style === "italic" ? "italic" : "normal",
          textTransform:
            (slide.title_text_transform as CSSProperties["textTransform"]) ||
            "none",
          letterSpacing: responsiveSize(
            Number(slide.title_letter_spacing) || 0,
            0
          ),
          lineHeight: slide.title_line_height ?? 1,
          "--hero-title-size-desktop": responsiveSize(
            titleSize,
            26,
            HERO_MASTER_WIDTH
          ),
          "--hero-title-size-mobile": responsiveSize(
            mobileTitleSize,
            useMobileTypography ? 22 : 26,
            mobileTypographyMaster
          ),
        } as CSSProperties

        const subtitleStyle = {
          color: slide.subtitle_color || "#FFFFFF",
          fontFamily:
            slide.subtitle_font_family || "Inter, Arial, sans-serif",
          fontWeight: slide.subtitle_weight ?? 400,
          fontStyle:
            slide.subtitle_font_style === "italic" ? "italic" : "normal",
          textTransform:
            (slide.subtitle_text_transform as CSSProperties["textTransform"]) ||
            "none",
          letterSpacing: responsiveSize(
            Number(slide.subtitle_letter_spacing) || 0,
            0
          ),
          lineHeight: slide.subtitle_line_height ?? 1.5,
          "--hero-subtitle-size-desktop": responsiveSize(
            subtitleSize,
            12,
            HERO_MASTER_WIDTH
          ),
          "--hero-subtitle-size-mobile": responsiveSize(
            mobileSubtitleSize,
            12,
            mobileTypographyMaster
          ),
        } as CSSProperties

        return (
          <div
            key={slide.id}
            className={`safafi-hero-slide absolute inset-0 transition-opacity duration-700 ${
              isActive
                ? "z-10 opacity-100"
                : "pointer-events-none z-0 opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            {/* Desktop / fallback media */}
            {slide.media_type === "video" ? (
              <HeroVideo
                src={slide.media_url}
                poster={slide.poster_url || undefined}
                active={isActive}
                reducedMotion={reducedMotion}
                shouldLoad={desktopShouldLoad}
                objectPosition={desktopObjectPosition}
                className={`absolute inset-0 h-full w-full object-cover ${
                  hasMobileMedia ? "hidden md:block" : ""
                }`}
              />
            ) : (
              <img
                src={slide.media_url}
                alt={
                  slide.media_alt ||
                  slide.title ||
                  "Safafi Hero Banner"
                }
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
                draggable={false}
                className={`absolute inset-0 h-full w-full object-cover ${
                  hasMobileMedia ? "hidden md:block" : ""
                }`}
                style={{ objectPosition: desktopObjectPosition }}
              />
            )}

            {/* Optional dedicated mobile media */}
            {slide.mobile_media_url &&
              (slide.mobile_media_type === "video" ? (
                <HeroVideo
                  src={slide.mobile_media_url}
                  poster={
                    slide.mobile_poster_url ||
                    slide.poster_url ||
                    undefined
                  }
                  active={isActive}
                  reducedMotion={reducedMotion}
                  shouldLoad={mobileShouldLoad}
                  objectPosition={mobileObjectPosition}
                  className="absolute inset-0 block h-full w-full object-cover md:hidden"
                />
              ) : (
                <img
                  src={slide.mobile_media_url}
                  alt={
                    slide.mobile_media_alt ||
                    slide.media_alt ||
                    slide.title ||
                    "Safafi Hero Banner"
                  }
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 block h-full w-full object-cover md:hidden"
                  style={{ objectPosition: mobileObjectPosition }}
                />
              ))}

            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: overlayBackground }}
            />

            <div
              className="safafi-hero-content absolute inset-0 z-20 flex"
              style={contentStyle}
            >
              <div
                className="safafi-hero-copy w-full"
                style={copyStyle}
              >
                {slide.eyebrow && (
                  <p
                    style={{
                      color: slide.eyebrow_color || "#FFFFFF",
                      fontFamily:
                        slide.eyebrow_font_family ||
                        "Inter, Arial, sans-serif",
                      fontSize: responsiveSize(
                        eyebrowSize,
                        8,
                        HERO_MASTER_WIDTH
                      ),
                      fontWeight: slide.eyebrow_weight ?? 600,
                      fontStyle:
                        slide.eyebrow_font_style === "italic"
                          ? "italic"
                          : "normal",
                      textTransform:
                        (slide.eyebrow_text_transform as CSSProperties["textTransform"]) ||
                        "uppercase",
                      letterSpacing: responsiveSize(
                        Number(slide.eyebrow_letter_spacing) || 0,
                        0,
                        HERO_MASTER_WIDTH
                      ),
                      lineHeight: slide.eyebrow_line_height ?? 1.2,
                    }}
                  >
                    {slide.eyebrow}
                  </p>
                )}

                {slide.title && (
                  <h1
                    className="safafi-hero-title"
                    style={titleStyle}
                  >
                    {slide.title}
                  </h1>
                )}

                {slide.subtitle && (
                  <p
                    className="safafi-hero-subtitle"
                    style={subtitleStyle}
                  >
                    {slide.subtitle}
                  </p>
                )}

                {(slide.button_text ||
                  slide.secondary_button_text) && (
                  <div className="safafi-hero-actions flex flex-wrap">
                    {slide.button_text && (
                      <a
                        href={slide.button_url || "/"}
                        className="safafi-hero-button inline-flex items-center justify-center text-center hover:opacity-75"
                        style={
                          {
                            "--hero-button-size-desktop": responsiveSize(
                            buttonSize,
                            9,
                            HERO_MASTER_WIDTH
                          ),
                          "--hero-button-size-mobile": responsiveSize(
                            buttonSize,
                            9,
                            MOBILE_MASTER_WIDTH
                          ),
                            ...getButtonStyle(
                              slide.button_style || "filled",
                              slide.button_bg_color || "#765633",
                              slide.button_text_color || "#FFFFFF"
                            ),
                          } as CSSProperties
                        }
                      >
                        {slide.button_text}
                      </a>
                    )}

                    {slide.secondary_button_text && (
                      <a
                        href={slide.secondary_button_url || "/"}
                        className="safafi-hero-button inline-flex items-center justify-center text-center hover:opacity-75"
                        style={
                          {
                            "--hero-button-size-desktop": responsiveSize(
                            buttonSize,
                            9,
                            HERO_MASTER_WIDTH
                          ),
                          "--hero-button-size-mobile": responsiveSize(
                            buttonSize,
                            9,
                            MOBILE_MASTER_WIDTH
                          ),
                            ...getButtonStyle(
                              slide.secondary_button_style || "outline",
                              slide.secondary_button_bg_color || "transparent",
                              slide.secondary_button_text_color || "#FFFFFF"
                            ),
                          } as CSSProperties
                        }
                      >
                        {slide.secondary_button_text}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous hero slide"
            className="absolute left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/20 p-3 text-2xl text-white backdrop-blur-sm transition hover:bg-black/40 sm:block"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next hero slide"
            className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/20 p-3 text-2xl text-white backdrop-blur-sm transition hover:bg-black/40 sm:block"
          >
            ›
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:bottom-5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to hero slide ${index + 1}`}
              aria-current={index === activeSlide ? "true" : undefined}
              onClick={() => setActiveSlide(index)}
              className={`h-2 w-2 rounded-full border border-white transition-all ${
                index === activeSlide
                  ? "scale-110 bg-white"
                  : "bg-transparent"
              }`}
            />
          ))}
        </div>
      )}

      <style>{`
        /*
         * DESKTOP RESPONSIVE HEIGHT
         *
         * 1440px+  -> exact Admin master height
         * narrower -> scales from the same 1440 reference
         * tablet    -> stops at a cinematic 500px minimum
         */
        .safafi-smart-hero {
          height: clamp(
            var(--hero-desktop-min-height),
            var(--hero-desktop-fluid-height),
            var(--hero-desktop-height)
          );
          touch-action: pan-y;
        }

        .safafi-hero-content {
          align-items: var(--hero-desktop-align-items);
          justify-content: var(--hero-desktop-justify-content);
          padding: ${responsiveSize(48, 8, HERO_MASTER_WIDTH)};
        }

        .safafi-hero-copy {
          max-width: min(100%, var(--hero-desktop-copy-width));
          text-align: var(--hero-desktop-text-align);
          transform: translate(
            var(--hero-desktop-offset-x),
            var(--hero-desktop-offset-y)
          );
        }

        .safafi-hero-title {
          margin-top: ${responsiveSize(12, 3, HERO_MASTER_WIDTH)};
          font-size: var(--hero-title-size-desktop);
        }

        .safafi-hero-subtitle {
          margin-top: ${responsiveSize(16, 5, HERO_MASTER_WIDTH)};
          font-size: var(--hero-subtitle-size-desktop);
        }

        .safafi-hero-actions {
          margin-top: ${responsiveSize(28, 8, HERO_MASTER_WIDTH)};
          gap: ${responsiveSize(12, 5, HERO_MASTER_WIDTH)};
          justify-content: var(--hero-desktop-actions-justify);
        }

        .safafi-hero-button {
          padding: ${responsiveSize(14, 6, HERO_MASTER_WIDTH)} ${responsiveSize(
            24,
            10,
            HERO_MASTER_WIDTH
          )};
          border-radius: 0;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: var(--hero-button-size-desktop);
          transition: background-color 180ms ease, color 180ms ease,
            border-color 180ms ease, opacity 180ms ease;
        }

        @media (max-width: ${MOBILE_BREAKPOINT}px) {
          .safafi-smart-hero {
            height: var(--hero-mobile-height);
          }

          .safafi-hero-content {
            align-items: var(--hero-mobile-align-items);
            justify-content: var(--hero-mobile-justify-content);
            padding: 18px;
          }

          .safafi-hero-copy {
            max-width: min(100%, var(--hero-mobile-copy-width));
            text-align: var(--hero-mobile-text-align);
            transform: translate(
              var(--hero-mobile-offset-x),
              var(--hero-mobile-offset-y)
            );
          }

          .safafi-hero-title {
            font-size: var(--hero-title-size-mobile);
          }

          .safafi-hero-subtitle {
            font-size: var(--hero-subtitle-size-mobile);
          }

          .safafi-hero-actions {
            margin-top: ${responsiveSize(28, 8, MOBILE_MASTER_WIDTH)};
            gap: ${responsiveSize(12, 5, MOBILE_MASTER_WIDTH)};
            justify-content: var(--hero-mobile-actions-justify);
          }

          .safafi-hero-button {
            padding: ${responsiveSize(14, 6, MOBILE_MASTER_WIDTH)} ${responsiveSize(
              24,
              10,
              MOBILE_MASTER_WIDTH
            )};
            font-size: var(--hero-button-size-mobile);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .safafi-hero-slide,
          .safafi-hero-button {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  )
}
