"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useRef, useState } from "react"
import { sdk } from "../../lib/sdk"

type HeroBanner = {
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

type Option = {
  label: string
  value: string
}

type Viewport = "desktop" | "tablet" | "mobile"

const HERO_MASTER_WIDTH = 1440
const MOBILE_MASTER_WIDTH = 390

const fonts = [
  "Inter",
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
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
].map((value) => ({
  label: value,
  value,
}))

const sizes = [
  10, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32,
  36, 38, 40, 44, 48, 56, 64, 72, 80, 88, 96, 110, 128,
].map((value) => ({
  label: `${value} px`,
  value: String(value),
}))

const weights: Option[] = [
  ["Light", 300],
  ["Regular", 400],
  ["Medium", 500],
  ["Semi Bold", 600],
  ["Bold", 700],
  ["Extra Bold", 800],
  ["Black", 900],
].map(([label, value]) => ({
  label: `${label} — ${value}`,
  value: String(value),
}))

const styles: Option[] = [
  { label: "Normal", value: "normal" },
  { label: "Italic", value: "italic" },
]

const transforms: Option[] = [
  { label: "Normal", value: "none" },
  { label: "UPPERCASE", value: "uppercase" },
  { label: "lowercase", value: "lowercase" },
  { label: "Capitalize", value: "capitalize" },
]

const spacings: Option[] = [
  { label: "Tight", value: "-1" },
  { label: "Normal", value: "0" },
  { label: "Slightly Wide", value: "1" },
  { label: "Wide", value: "2" },
  { label: "Extra Wide", value: "4" },
  { label: "Editorial", value: "6" },
]

const lines: Option[] = [
  { label: "Very Tight", value: "0.9" },
  { label: "Tight", value: "1" },
  { label: "Compact", value: "1.1" },
  { label: "Normal", value: "1.2" },
  { label: "Relaxed", value: "1.5" },
  { label: "Loose", value: "1.8" },
]

const align: Option[] = ["left", "center", "right"].map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}))

const alignWithInherit: Option[] = [
  { label: "Inherit Desktop", value: "" },
  ...align,
]

const vertical: Option[] = ["top", "center", "bottom"].map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}))

const verticalWithInherit: Option[] = [
  { label: "Inherit Desktop", value: "" },
  ...vertical,
]

const overlayOpacity: Option[] = Array.from({ length: 11 }, (_, index) => ({
  label: `${index * 10}%`,
  value: String(index * 10),
}))

const autoplay: Option[] = [
  3000, 4000, 5000, 6000, 7000, 8000, 10000,
].map((value) => ({
  label: `${value / 1000} seconds`,
  value: String(value),
}))

const overlayTypes: Option[] = [
  { label: "None", value: "none" },
  { label: "Solid", value: "solid" },
  { label: "Gradient", value: "gradient" },
]

const overlayDirections: Option[] = [
  { label: "Full", value: "full" },
  { label: "Left Fade", value: "left" },
  { label: "Right Fade", value: "right" },
  { label: "Bottom Fade", value: "bottom" },
]

const buttonStyles: Option[] = [
  { label: "Filled", value: "filled" },
  { label: "Outline", value: "outline" },
  { label: "Text Link", value: "text" },
]

const defaultSwatches = [
  "#FFFFFF",
  "#F8F5EF",
  "#E8DCC8",
  "#D9B47A",
  "#C69C6D",
  "#9A7651",
  "#765633",
  "#5F4326",
  "#000000",
  "#222222",
  "#666666",
  "#B91C1C",
  "#BE123C",
  "#7E22CE",
  "#1D4ED8",
  "#0369A1",
  "#047857",
  "#4D7C0F",
  "#CA8A04",
]

const SAVED_COLORS_KEY = "safafi-hero-saved-colors"

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

const loadedFontFamilies = new Set<string>()

const loadGoogleFont = (family: string) => {
  if (
    typeof document === "undefined" ||
    !GOOGLE_FONT_FAMILIES.has(family) ||
    loadedFontFamilies.has(family)
  ) {
    return
  }

  const id = `hero-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

  if (document.getElementById(id)) {
    loadedFontFamilies.add(family)
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
  loadedFontFamilies.add(family)
}

const normalizeColor = (color: string) => color.toUpperCase()

const toCqw = (pixels: number, masterWidth = HERO_MASTER_WIDTH) =>
  `${((pixels / masterWidth) * 100).toFixed(4)}cqw`

const responsiveSize = (
  pixels: number,
  minimum = 0,
  masterWidth = HERO_MASTER_WIDTH
) => `clamp(${minimum}px, ${toCqw(pixels, masterWidth)}, ${pixels}px)`

const getPreviewDimensions = (
  viewport: Viewport,
  desktopHeight: number,
  mobileHeight: number
) => {
  if (viewport === "mobile") {
    return {
      width: MOBILE_MASTER_WIDTH,
      height: mobileHeight,
    }
  }

  if (viewport === "tablet") {
    const width = 900
    return {
      width,
      height: Math.max(
        500,
        Math.min(
          desktopHeight,
          Math.round((desktopHeight * width) / HERO_MASTER_WIDTH)
        )
      ),
    }
  }

  return {
    width: HERO_MASTER_WIDTH,
    height: desktopHeight,
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

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const pad = (number: number) => String(number).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const hexToRgba = (color = "#000000", opacity = 0) => {
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
  type: string,
  direction: string,
  color: string,
  opacity: number
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
  style: string,
  background: string,
  textColor: string
): React.CSSProperties => {
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

const HeroBannersPage = () => {
  const desktopMediaRef = useRef<HTMLInputElement>(null)
  const mobileMediaRef = useRef<HTMLInputElement>(null)
  const posterRef = useRef<HTMLInputElement>(null)
  const mobilePosterRef = useRef<HTMLInputElement>(null)

  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingDesktop, setUploadingDesktop] = useState(false)
  const [uploadingMobile, setUploadingMobile] = useState(false)
  const [uploadingPoster, setUploadingPoster] = useState(false)
  const [uploadingMobilePoster, setUploadingMobilePoster] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [previewViewport, setPreviewViewport] = useState<Viewport>("desktop")
  const [savedColors, setSavedColors] = useState<string[]>([])

  const [mediaUrl, setMediaUrl] = useState("")
  const [mediaType, setMediaType] = useState<"image" | "video">("image")
  const [mobileMediaUrl, setMobileMediaUrl] = useState("")
  const [mobileMediaType, setMobileMediaType] =
    useState<"image" | "video">("image")
  const [posterUrl, setPosterUrl] = useState("")
  const [mobilePosterUrl, setMobilePosterUrl] = useState("")
  const [mediaAlt, setMediaAlt] = useState("")
  const [mobileMediaAlt, setMobileMediaAlt] = useState("")

  const [heroHeight, setHeroHeight] = useState("720")
  const [mobileHeight, setMobileHeight] = useState("540")

  const [desktopFocalX, setDesktopFocalX] = useState("50")
  const [desktopFocalY, setDesktopFocalY] = useState("50")
  const [mobileFocalX, setMobileFocalX] = useState("")
  const [mobileFocalY, setMobileFocalY] = useState("")

  const [eyebrow, setEyebrow] = useState("")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")

  const [ef, setEf] = useState("Inter")
  const [efs, setEfs] = useState("normal")
  const [et, setEt] = useState("uppercase")
  const [ec, setEc] = useState("#FFFFFF")
  const [esz, setEsz] = useState("14")
  const [ew, setEw] = useState("600")
  const [esp, setEsp] = useState("2")
  const [elh, setElh] = useState("1.2")

  const [tf, setTf] = useState("Playfair Display")
  const [tfs, setTfs] = useState("normal")
  const [tt, setTt] = useState("none")
  const [tc, setTc] = useState("#FFFFFF")
  const [tsz, setTsz] = useState("64")
  const [tmob, setTmob] = useState("38")
  const [tw, setTw] = useState("700")
  const [tsp, setTsp] = useState("0")
  const [tlh, setTlh] = useState("1")

  const [sf, setSf] = useState("Inter")
  const [sfs, setSfs] = useState("normal")
  const [st, setSt] = useState("none")
  const [sc, setSc] = useState("#FFFFFF")
  const [ssz, setSsz] = useState("18")
  const [smob, setSmob] = useState("15")
  const [sw, setSw] = useState("400")
  const [ssp, setSsp] = useState("0")
  const [slh, setSlh] = useState("1.5")
  const [mobileTypographyOverride, setMobileTypographyOverride] =
    useState(false)

  const [ta, setTa] = useState("center")
  const [vp, setVp] = useState("center")
  const [hp, setHp] = useState("center")
  const [ox, setOx] = useState("0")
  const [oy, setOy] = useState("0")
  const [contentMaxWidth, setContentMaxWidth] = useState("620")

  const [mta, setMta] = useState("")
  const [mvp, setMvp] = useState("")
  const [mhp, setMhp] = useState("")
  const [mox, setMox] = useState("")
  const [moy, setMoy] = useState("")
  const [mobileContentMaxWidth, setMobileContentMaxWidth] = useState("340")

  const [bt, setBt] = useState("Shop Now")
  const [bu, setBu] = useState("/")
  const [bbc, setBbc] = useState("#765633")
  const [btc, setBtc] = useState("#FFFFFF")
  const [buttonSize, setButtonSize] = useState("13")
  const [buttonStyle, setButtonStyle] = useState("filled")

  const [sbt, setSbt] = useState("")
  const [sbu, setSbu] = useState("")
  const [sbg, setSbg] = useState("transparent")
  const [sbtc, setSbtc] = useState("#FFFFFF")
  const [secondaryButtonStyle, setSecondaryButtonStyle] = useState("outline")

  const [oc, setOc] = useState("#000000")
  const [oo, setOo] = useState("10")
  const [overlayType, setOverlayType] = useState("solid")
  const [overlayDirection, setOverlayDirection] = useState("full")

  const [pos, setPos] = useState("0")
  const [active, setActive] = useState(true)
  const [auto, setAuto] = useState("6000")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")

  useEffect(() => {
    loadGoogleFont(ef)
    loadGoogleFont(tf)
    loadGoogleFont(sf)
  }, [ef, tf, sf])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_COLORS_KEY)

      if (stored) {
        const parsed = JSON.parse(stored)

        if (Array.isArray(parsed)) {
          setSavedColors(parsed)
        }
      }
    } catch (error) {
      console.error("Could not load saved colors:", error)
    }
  }, [])

  const saveCustomColor = (color: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return

    const normalized = normalizeColor(color)

    if (
      defaultSwatches.some(
        (candidate) => normalizeColor(candidate) === normalized
      )
    ) {
      return
    }

    setSavedColors((current) => {
      if (
        current.some(
          (candidate) => normalizeColor(candidate) === normalized
        )
      ) {
        return current
      }

      const next = [...current, normalized]

      try {
        window.localStorage.setItem(
          SAVED_COLORS_KEY,
          JSON.stringify(next)
        )
      } catch (error) {
        console.error("Could not save color:", error)
      }

      return next
    })
  }

  const removeSavedColor = (color: string) => {
    setSavedColors((current) => {
      const next = current.filter(
        (candidate) =>
          normalizeColor(candidate) !== normalizeColor(color)
      )

      try {
        window.localStorage.setItem(
          SAVED_COLORS_KEY,
          JSON.stringify(next)
        )
      } catch (error) {
        console.error("Could not remove color:", error)
      }

      return next
    })
  }

  const load = async () => {
    try {
      setLoading(true)

      const response = await sdk.client.fetch<{
        hero_banners: HeroBanner[]
      }>("/admin/hero-banners", {
        method: "GET",
      })

      setBanners(response.hero_banners || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const reset = () => {
    setEditingId(null)

    setMediaUrl("")
    setMediaType("image")
    setMobileMediaUrl("")
    setMobileMediaType("image")
    setPosterUrl("")
    setMobilePosterUrl("")
    setMediaAlt("")
    setMobileMediaAlt("")

    setHeroHeight("720")
    setMobileHeight("540")

    setDesktopFocalX("50")
    setDesktopFocalY("50")
    setMobileFocalX("")
    setMobileFocalY("")

    setEyebrow("")
    setTitle("")
    setSubtitle("")

    setEf("Inter")
    setEfs("normal")
    setEt("uppercase")
    setEc("#FFFFFF")
    setEsz("14")
    setEw("600")
    setEsp("2")
    setElh("1.2")

    setTf("Playfair Display")
    setTfs("normal")
    setTt("none")
    setTc("#FFFFFF")
    setTsz("64")
    setTmob("38")
    setTw("700")
    setTsp("0")
    setTlh("1")

    setSf("Inter")
    setSfs("normal")
    setSt("none")
    setSc("#FFFFFF")
    setSsz("18")
    setSmob("15")
    setSw("400")
    setSsp("0")
    setSlh("1.5")
    setMobileTypographyOverride(false)

    setTa("center")
    setVp("center")
    setHp("center")
    setOx("0")
    setOy("0")
    setContentMaxWidth("620")

    setMta("")
    setMvp("")
    setMhp("")
    setMox("")
    setMoy("")
    setMobileContentMaxWidth("340")

    setBt("Shop Now")
    setBu("/")
    setBbc("#765633")
    setBtc("#FFFFFF")
    setButtonSize("13")
    setButtonStyle("filled")

    setSbt("")
    setSbu("")
    setSbg("transparent")
    setSbtc("#FFFFFF")
    setSecondaryButtonStyle("outline")

    setOc("#000000")
    setOo("10")
    setOverlayType("solid")
    setOverlayDirection("full")

    setPos("0")
    setActive(true)
    setAuto("6000")
    setStartsAt("")
    setEndsAt("")

    setPreviewViewport("desktop")
  }

  const uploadFile = async (
    files: FileList | null,
    target: "desktop" | "mobile" | "poster" | "mobile-poster"
  ) => {
    if (!files?.length) return

    const file = files[0]
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (
      (target === "poster" || target === "mobile-poster") &&
      !isImage
    ) {
      alert("Poster must be an image.")
      return
    }

    if (
      target !== "poster" &&
      target !== "mobile-poster" &&
      !isImage &&
      !isVideo
    ) {
      alert("Please upload an image or video.")
      return
    }

    const setUploading =
      target === "desktop"
        ? setUploadingDesktop
        : target === "mobile"
          ? setUploadingMobile
          : target === "poster"
            ? setUploadingPoster
            : setUploadingMobilePoster

    try {
      setUploading(true)

      const response = await sdk.admin.upload.create({
        files: [file],
      })

      const uploaded = response.files?.[0] as
        | { url?: string }
        | undefined

      if (!uploaded?.url) {
        throw new Error("Upload returned no URL.")
      }

      if (target === "desktop") {
        setMediaUrl(uploaded.url)
        setMediaType(isVideo ? "video" : "image")
      } else if (target === "mobile") {
        setMobileMediaUrl(uploaded.url)
        setMobileMediaType(isVideo ? "video" : "image")
      } else if (target === "poster") {
        setPosterUrl(uploaded.url)
      } else {
        setMobilePosterUrl(uploaded.url)
      }
    } catch (error) {
      console.error(error)
      alert("Media upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const body = () => ({
    media_url: mediaUrl,
    media_type: mediaType,

    mobile_media_url: mobileMediaUrl || null,
    mobile_media_type: mobileMediaType,

    poster_url: posterUrl || null,
    mobile_poster_url: mobilePosterUrl || null,

    media_alt: mediaAlt || null,
    mobile_media_alt: mobileMediaAlt || null,

    hero_height: Math.max(360, Number(heroHeight) || 720),
    mobile_height: Math.max(400, Number(mobileHeight) || 540),

    desktop_focal_x: Math.max(
      0,
      Math.min(100, Number(desktopFocalX) || 0)
    ),
    desktop_focal_y: Math.max(
      0,
      Math.min(100, Number(desktopFocalY) || 0)
    ),
    mobile_focal_x: mobileFocalX === "" ? null : Number(mobileFocalX),
    mobile_focal_y: mobileFocalY === "" ? null : Number(mobileFocalY),

    /*
     * Once a banner is saved through the refined editor,
     * focal X/Y become the source of truth.
     */
    object_position: "center",

    eyebrow: eyebrow || null,
    title: title || null,
    subtitle: subtitle || null,

    eyebrow_font_family: ef,
    eyebrow_font_style: efs,
    eyebrow_text_transform: et,
    eyebrow_color: ec,
    eyebrow_size: Number(esz),
    eyebrow_weight: Number(ew),
    eyebrow_letter_spacing: Number(esp),
    eyebrow_line_height: Number(elh),

    title_font_family: tf,
    title_font_style: tfs,
    title_text_transform: tt,
    title_color: tc,
    title_size: Number(tsz),
    title_mobile_size: Number(tmob),
    title_weight: Number(tw),
    title_letter_spacing: Number(tsp),
    title_line_height: Number(tlh),

    subtitle_font_family: sf,
    subtitle_font_style: sfs,
    subtitle_text_transform: st,
    subtitle_color: sc,
    subtitle_size: Number(ssz),
    subtitle_mobile_size: Number(smob),
    subtitle_weight: Number(sw),
    subtitle_letter_spacing: Number(ssp),
    subtitle_line_height: Number(slh),

    mobile_typography_override: mobileTypographyOverride,

    text_align: ta,
    vertical_position: vp,
    horizontal_position: hp,
    content_offset_x: Number(ox) || 0,
    content_offset_y: Number(oy) || 0,
    content_max_width: Math.max(240, Number(contentMaxWidth) || 620),

    mobile_text_align: mta || null,
    mobile_vertical_position: mvp || null,
    mobile_horizontal_position: mhp || null,
    mobile_content_offset_x: mox === "" ? null : Number(mox),
    mobile_content_offset_y: moy === "" ? null : Number(moy),
    mobile_content_max_width: Math.max(
      220,
      Number(mobileContentMaxWidth) || 340
    ),

    button_text: bt || null,
    button_url: bu || null,
    button_bg_color: bbc,
    button_text_color: btc,
    button_size: Math.max(8, Number(buttonSize) || 13),
    button_style: buttonStyle,

    secondary_button_text: sbt || null,
    secondary_button_url: sbu || null,
    secondary_button_bg_color: sbg,
    secondary_button_text_color: sbtc,
    secondary_button_style: secondaryButtonStyle,

    overlay_color: oc,
    overlay_opacity: Number(oo) || 0,
    overlay_type: overlayType,
    overlay_direction: overlayDirection,

    position: Number(pos) || 0,
    is_active: active,
    autoplay_duration: Number(auto) || 6000,

    starts_at: startsAt || null,
    ends_at: endsAt || null,
  })

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!mediaUrl) {
      alert("Please upload desktop media.")
      return
    }

    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      alert("Publish end time must be after publish start time.")
      return
    }

    try {
      setSaving(true)

      await sdk.client.fetch(
        editingId
          ? `/admin/hero-banners/${editingId}`
          : "/admin/hero-banners",
        {
          method: "POST",
          body: body(),
        }
      )

      alert(editingId ? "Hero banner updated." : "Hero banner created.")

      reset()
      await load()
    } catch (error) {
      console.error(error)
      alert("Hero banner could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  const edit = (banner: HeroBanner) => {
    setEditingId(banner.id)

    setMediaUrl(banner.media_url)
    setMediaType(banner.media_type)
    setMobileMediaUrl(banner.mobile_media_url || "")
    setMobileMediaType(banner.mobile_media_type || "image")
    setPosterUrl(banner.poster_url || "")
    setMobilePosterUrl(banner.mobile_poster_url || "")
    setMediaAlt(banner.media_alt || "")
    setMobileMediaAlt(banner.mobile_media_alt || "")

    setHeroHeight(String(banner.hero_height ?? 720))
    setMobileHeight(String(banner.mobile_height ?? 540))

    const legacyFocal = legacyObjectPositionToFocal(banner.object_position)

    const hasLegacyFocus =
      (banner.desktop_focal_x ?? 50) === 50 &&
      (banner.desktop_focal_y ?? 50) === 50 &&
      banner.object_position &&
      banner.object_position !== "center"

    setDesktopFocalX(
      String(
        hasLegacyFocus
          ? legacyFocal.x
          : banner.desktop_focal_x ?? 50
      )
    )
    setDesktopFocalY(
      String(
        hasLegacyFocus
          ? legacyFocal.y
          : banner.desktop_focal_y ?? 50
      )
    )
    setMobileFocalX(
      banner.mobile_focal_x === null ||
        banner.mobile_focal_x === undefined
        ? ""
        : String(banner.mobile_focal_x)
    )
    setMobileFocalY(
      banner.mobile_focal_y === null ||
        banner.mobile_focal_y === undefined
        ? ""
        : String(banner.mobile_focal_y)
    )

    setEyebrow(banner.eyebrow || "")
    setTitle(banner.title || "")
    setSubtitle(banner.subtitle || "")

    setEf(banner.eyebrow_font_family || "Inter")
    setEfs(banner.eyebrow_font_style || "normal")
    setEt(banner.eyebrow_text_transform || "uppercase")
    setEc(banner.eyebrow_color || "#FFFFFF")
    setEsz(String(banner.eyebrow_size ?? 14))
    setEw(String(banner.eyebrow_weight ?? 600))
    setEsp(String(banner.eyebrow_letter_spacing ?? 2))
    setElh(String(banner.eyebrow_line_height ?? 1.2))

    setTf(banner.title_font_family || "Playfair Display")
    setTfs(banner.title_font_style || "normal")
    setTt(banner.title_text_transform || "none")
    setTc(banner.title_color || "#FFFFFF")
    setTsz(String(banner.title_size ?? 64))
    setTmob(String(banner.title_mobile_size ?? 38))
    setTw(String(banner.title_weight ?? 700))
    setTsp(String(banner.title_letter_spacing ?? 0))
    setTlh(String(banner.title_line_height ?? 1))

    setSf(banner.subtitle_font_family || "Inter")
    setSfs(banner.subtitle_font_style || "normal")
    setSt(banner.subtitle_text_transform || "none")
    setSc(banner.subtitle_color || "#FFFFFF")
    setSsz(String(banner.subtitle_size ?? 18))
    setSmob(String(banner.subtitle_mobile_size ?? 15))
    setSw(String(banner.subtitle_weight ?? 400))
    setSsp(String(banner.subtitle_letter_spacing ?? 0))
    setSlh(String(banner.subtitle_line_height ?? 1.5))
    setMobileTypographyOverride(Boolean(banner.mobile_typography_override))

    setTa(banner.text_align || "center")
    setVp(banner.vertical_position || "center")
    setHp(banner.horizontal_position || "center")
    setOx(String(banner.content_offset_x ?? 0))
    setOy(String(banner.content_offset_y ?? 0))
    setContentMaxWidth(String(banner.content_max_width ?? 620))

    setMta(banner.mobile_text_align || "")
    setMvp(banner.mobile_vertical_position || "")
    setMhp(banner.mobile_horizontal_position || "")
    setMox(
      banner.mobile_content_offset_x === null ||
        banner.mobile_content_offset_x === undefined
        ? ""
        : String(banner.mobile_content_offset_x)
    )
    setMoy(
      banner.mobile_content_offset_y === null ||
        banner.mobile_content_offset_y === undefined
        ? ""
        : String(banner.mobile_content_offset_y)
    )
    setMobileContentMaxWidth(
      String(banner.mobile_content_max_width ?? 340)
    )

    setBt(banner.button_text || "")
    setBu(banner.button_url || "/")
    setBbc(banner.button_bg_color || "#765633")
    setBtc(banner.button_text_color || "#FFFFFF")
    setButtonSize(String(banner.button_size ?? 13))
    setButtonStyle(banner.button_style || "filled")

    setSbt(banner.secondary_button_text || "")
    setSbu(banner.secondary_button_url || "")
    setSbg(banner.secondary_button_bg_color || "transparent")
    setSbtc(banner.secondary_button_text_color || "#FFFFFF")
    setSecondaryButtonStyle(
      banner.secondary_button_style || "outline"
    )

    setOc(banner.overlay_color || "#000000")
    setOo(String(banner.overlay_opacity ?? 10))
    setOverlayType(banner.overlay_type || "solid")
    setOverlayDirection(banner.overlay_direction || "full")

    setPos(String(banner.position ?? 0))
    setActive(banner.is_active !== false)
    setAuto(String(banner.autoplay_duration ?? 6000))
    setStartsAt(toDateTimeLocal(banner.starts_at))
    setEndsAt(toDateTimeLocal(banner.ends_at))

    setPreviewViewport("desktop")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const del = async (banner: HeroBanner) => {
    if (!confirm(`Delete ${banner.title || "this banner"}?`)) {
      return
    }

    try {
      await sdk.client.fetch(`/admin/hero-banners/${banner.id}`, {
        method: "DELETE",
      })

      if (editingId === banner.id) {
        reset()
      }

      await load()
    } catch (error) {
      console.error(error)
      alert("Delete failed.")
    }
  }

  const previewDimensions = getPreviewDimensions(
    previewViewport,
    Math.max(360, Number(heroHeight) || 720),
    Math.max(400, Number(mobileHeight) || 540)
  )

  const previewUsesMobile = previewViewport === "mobile"
  const previewMediaUrl =
    previewUsesMobile && mobileMediaUrl ? mobileMediaUrl : mediaUrl
  const previewMediaType =
    previewUsesMobile && mobileMediaUrl ? mobileMediaType : mediaType
  const previewPosterUrl =
    previewUsesMobile && mobilePosterUrl ? mobilePosterUrl : posterUrl

  const previewFocalX = previewUsesMobile
    ? mobileFocalX === ""
      ? Number(desktopFocalX) || 50
      : Number(mobileFocalX)
    : Number(desktopFocalX) || 50

  const previewFocalY = previewUsesMobile
    ? mobileFocalY === ""
      ? Number(desktopFocalY) || 50
      : Number(mobileFocalY)
    : Number(desktopFocalY) || 50

  const previewTextAlign = previewUsesMobile ? mta || ta : ta
  const previewVertical = previewUsesMobile ? mvp || vp : vp
  const previewHorizontal = previewUsesMobile ? mhp || hp : hp

  const previewOffsetX = previewUsesMobile
    ? mox === ""
      ? Number(ox) || 0
      : Number(mox) || 0
    : Number(ox) || 0

  const previewOffsetY = previewUsesMobile
    ? moy === ""
      ? Number(oy) || 0
      : Number(moy) || 0
    : Number(oy) || 0

  const previewContentWidth = previewUsesMobile
    ? Number(mobileContentMaxWidth) || 340
    : Number(contentMaxWidth) || 620

  const previewTitleSize =
    previewUsesMobile && mobileTypographyOverride
      ? Number(tmob) || 38
      : Number(tsz) || 64

  const previewSubtitleSize =
    previewUsesMobile && mobileTypographyOverride
      ? Number(smob) || 15
      : Number(ssz) || 18

  const previewMasterWidth =
    previewUsesMobile && mobileTypographyOverride
      ? MOBILE_MASTER_WIDTH
      : HERO_MASTER_WIDTH

  const handleFocalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()

    const x = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)
    )

    const y = Math.max(
      0,
      Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)
    )

    if (previewUsesMobile) {
      setMobileFocalX(x.toFixed(1))
      setMobileFocalY(y.toFixed(1))
    } else {
      setDesktopFocalX(x.toFixed(1))
      setDesktopFocalY(y.toFixed(1))
    }
  }

  const disabled =
    saving ||
    uploadingDesktop ||
    uploadingMobile ||
    uploadingPoster ||
    uploadingMobilePoster ||
    !mediaUrl

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D3AD79]">
            SAFAFI Content Studio
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Hero Banner Builder</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            Build one responsive fashion Hero with desktop and mobile art
            direction, focal points, typography, CTA controls and publishing
            rules.
          </p>
        </div>

        {editingId && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-gray-600 px-4 py-2 text-sm transition hover:bg-white/5"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={submit} className="mt-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
          <div className="min-w-0 space-y-4">
            <Panel
              title="Media"
              subtitle="Desktop artwork is required. Mobile artwork is an optional art-direction override."
              open
            >
              <MediaUploader
                label="Desktop Image / Video"
                description="Primary Hero artwork. Images and videos use the optimized upload provider."
                inputRef={desktopMediaRef}
                accept="image/*,video/*"
                url={mediaUrl}
                mediaType={mediaType}
                uploading={uploadingDesktop}
                onFiles={(files) => uploadFile(files, "desktop")}
                onRemove={() => setMediaUrl("")}
              />

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Field
                  l="Desktop Alt Text"
                  v={mediaAlt}
                  s={setMediaAlt}
                  placeholder="Describe the image for accessibility"
                />

                <Num
                  l="Desktop Reference Height"
                  v={heroHeight}
                  s={setHeroHeight}
                  min={360}
                  max={1200}
                />
              </div>

              <div className="mt-6 rounded-xl border border-gray-700 bg-[#111114] p-4">
                <div>
                  <p className="text-sm font-semibold">Mobile Artwork Override</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Leave empty to reuse desktop artwork. A dedicated portrait
                    crop is recommended for campaign photography.
                  </p>
                </div>

                <div className="mt-4">
                  <MediaUploader
                    label="Mobile Image / Video"
                    description="Optional mobile artwork."
                    inputRef={mobileMediaRef}
                    accept="image/*,video/*"
                    url={mobileMediaUrl}
                    mediaType={mobileMediaType}
                    uploading={uploadingMobile}
                    onFiles={(files) => uploadFile(files, "mobile")}
                    onRemove={() => setMobileMediaUrl("")}
                    compact
                  />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <Field
                    l="Mobile Alt Text"
                    v={mobileMediaAlt}
                    s={setMobileMediaAlt}
                    placeholder="Optional mobile-specific alt text"
                  />

                  <Num
                    l="Mobile Height"
                    v={mobileHeight}
                    s={setMobileHeight}
                    min={400}
                    max={900}
                  />
                </div>
              </div>

              {(mediaType === "video" || mobileMediaType === "video") && (
                <div className="mt-6 rounded-xl border border-[#A97838]/35 bg-[#A97838]/[0.05] p-4">
                  <p className="text-sm font-semibold">Video Posters</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Poster images prevent a black frame while video is loading.
                  </p>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <MediaUploader
                      label="Desktop Poster"
                      description="Image only."
                      inputRef={posterRef}
                      accept="image/*"
                      url={posterUrl}
                      mediaType="image"
                      uploading={uploadingPoster}
                      onFiles={(files) => uploadFile(files, "poster")}
                      onRemove={() => setPosterUrl("")}
                      compact
                    />

                    <MediaUploader
                      label="Mobile Poster"
                      description="Optional mobile poster."
                      inputRef={mobilePosterRef}
                      accept="image/*"
                      url={mobilePosterUrl}
                      mediaType="image"
                      uploading={uploadingMobilePoster}
                      onFiles={(files) => uploadFile(files, "mobile-poster")}
                      onRemove={() => setMobilePosterUrl("")}
                      compact
                    />
                  </div>
                </div>
              )}
            </Panel>

            <Panel
              title="Content"
              subtitle="Keep fashion Hero copy short: eyebrow, one strong title, optional subtitle."
              open
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <Field l="Eyebrow" v={eyebrow} s={setEyebrow} />
                <Field l="Title" v={title} s={setTitle} />
              </div>

              <div className="mt-4">
                <Field l="Subtitle" v={subtitle} s={setSubtitle} />
              </div>
            </Panel>

            <Panel
              title="Layout & Focal Point"
              subtitle="Click directly on the live artwork to place the focal point."
              open
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <Select l="Text Align" v={ta} s={setTa} o={align} />
                <Select l="Horizontal" v={hp} s={setHp} o={align} />
                <Select l="Vertical" v={vp} s={setVp} o={vertical} />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <Num l="Fine Tune X" v={ox} s={setOx} />
                <Num l="Fine Tune Y" v={oy} s={setOy} />
                <Num
                  l="Content Max Width"
                  v={contentMaxWidth}
                  s={setContentMaxWidth}
                  min={240}
                  max={1100}
                />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Num
                  l="Desktop Focal X %"
                  v={desktopFocalX}
                  s={setDesktopFocalX}
                  min={0}
                  max={100}
                  step="0.1"
                />
                <Num
                  l="Desktop Focal Y %"
                  v={desktopFocalY}
                  s={setDesktopFocalY}
                  min={0}
                  max={100}
                  step="0.1"
                />
              </div>

              <div className="mt-6 rounded-xl border border-gray-700 bg-[#111114] p-4">
                <p className="text-sm font-semibold">Mobile Composition Override</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Empty values inherit Desktop. Use overrides only when the mobile
                  crop needs a different composition.
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <Select
                    l="Mobile Text Align"
                    v={mta}
                    s={setMta}
                    o={alignWithInherit}
                  />
                  <Select
                    l="Mobile Horizontal"
                    v={mhp}
                    s={setMhp}
                    o={alignWithInherit}
                  />
                  <Select
                    l="Mobile Vertical"
                    v={mvp}
                    s={setMvp}
                    o={verticalWithInherit}
                  />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <Num
                    l="Mobile Fine Tune X"
                    v={mox}
                    s={setMox}
                    placeholder="Inherit"
                  />
                  <Num
                    l="Mobile Fine Tune Y"
                    v={moy}
                    s={setMoy}
                    placeholder="Inherit"
                  />
                  <Num
                    l="Mobile Content Width"
                    v={mobileContentMaxWidth}
                    s={setMobileContentMaxWidth}
                    min={220}
                    max={390}
                  />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <Num
                    l="Mobile Focal X %"
                    v={mobileFocalX}
                    s={setMobileFocalX}
                    min={0}
                    max={100}
                    step="0.1"
                    placeholder="Inherit Desktop"
                  />
                  <Num
                    l="Mobile Focal Y %"
                    v={mobileFocalY}
                    s={setMobileFocalY}
                    min={0}
                    max={100}
                    step="0.1"
                    placeholder="Inherit Desktop"
                  />
                </div>
              </div>
            </Panel>

            <Panel
              title="Buttons"
              subtitle="Use one primary CTA and an optional secondary CTA."
              open
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <Field l="Primary Text" v={bt} s={setBt} />
                <Field l="Primary URL" v={bu} s={setBu} />
                <Select
                  l="Primary Style"
                  v={buttonStyle}
                  s={setButtonStyle}
                  o={buttonStyles}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Color
                  l="Primary Background"
                  v={bbc}
                  s={setBbc}
                  savedColors={savedColors}
                  saveCustomColor={saveCustomColor}
                  removeSavedColor={removeSavedColor}
                />

                <Color
                  l="Primary Text"
                  v={btc}
                  s={setBtc}
                  savedColors={savedColors}
                  saveCustomColor={saveCustomColor}
                  removeSavedColor={removeSavedColor}
                />

                <Num
                  l="Button Size"
                  v={buttonSize}
                  s={setButtonSize}
                  min={8}
                  max={24}
                />
              </div>

              <div className="my-6 border-t border-gray-700" />

              <div className="grid gap-4 lg:grid-cols-3">
                <Field l="Secondary Text" v={sbt} s={setSbt} />
                <Field l="Secondary URL" v={sbu} s={setSbu} />
                <Select
                  l="Secondary Style"
                  v={secondaryButtonStyle}
                  s={setSecondaryButtonStyle}
                  o={buttonStyles}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Field
                  l="Secondary Background"
                  v={sbg}
                  s={setSbg}
                  placeholder="transparent or #HEX"
                />

                <Color
                  l="Secondary Text"
                  v={sbtc}
                  s={setSbtc}
                  savedColors={savedColors}
                  saveCustomColor={saveCustomColor}
                  removeSavedColor={removeSavedColor}
                />
              </div>
            </Panel>

            <Panel
              title="Overlay"
              subtitle="Use a gradient when text sits over detailed photography."
              open
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <Select
                  l="Overlay Type"
                  v={overlayType}
                  s={setOverlayType}
                  o={overlayTypes}
                />

                <Select
                  l="Direction"
                  v={overlayDirection}
                  s={setOverlayDirection}
                  o={overlayDirections}
                />

                <Select
                  l="Darkness"
                  v={oo}
                  s={setOo}
                  o={overlayOpacity}
                />
              </div>

              <Color
                l="Overlay Color"
                v={oc}
                s={setOc}
                savedColors={savedColors}
                saveCustomColor={saveCustomColor}
                removeSavedColor={removeSavedColor}
              />
            </Panel>

            <Panel
              title="Typography"
              subtitle="Advanced controls. Mobile typography stays automatic unless override is enabled."
            >
              <TypographyBlock
                title="Eyebrow"
                font={[ef, setEf]}
                size={[esz, setEsz]}
                weight={[ew, setEw]}
                style={[efs, setEfs]}
                transform={[et, setEt]}
                spacing={[esp, setEsp]}
                line={[elh, setElh]}
                color={[ec, setEc]}
                savedColors={savedColors}
                saveCustomColor={saveCustomColor}
                removeSavedColor={removeSavedColor}
              />

              <div className="my-6 border-t border-gray-700" />

              <TypographyBlock
                title="Title"
                font={[tf, setTf]}
                size={[tsz, setTsz]}
                weight={[tw, setTw]}
                style={[tfs, setTfs]}
                transform={[tt, setTt]}
                spacing={[tsp, setTsp]}
                line={[tlh, setTlh]}
                color={[tc, setTc]}
                savedColors={savedColors}
                saveCustomColor={saveCustomColor}
                removeSavedColor={removeSavedColor}
              />

              <div className="my-6 border-t border-gray-700" />

              <TypographyBlock
                title="Subtitle"
                font={[sf, setSf]}
                size={[ssz, setSsz]}
                weight={[sw, setSw]}
                style={[sfs, setSfs]}
                transform={[st, setSt]}
                spacing={[ssp, setSsp]}
                line={[slh, setSlh]}
                color={[sc, setSc]}
                savedColors={savedColors}
                saveCustomColor={saveCustomColor}
                removeSavedColor={removeSavedColor}
              />

              <div className="mt-6 rounded-xl border border-gray-700 bg-[#111114] p-4">
                <Toggle
                  label="Mobile Typography Override"
                  description="Off = typography scales automatically from the desktop master."
                  checked={mobileTypographyOverride}
                  onChange={setMobileTypographyOverride}
                />

                {mobileTypographyOverride && (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <Select
                      l="Mobile Title Size"
                      v={tmob}
                      s={setTmob}
                      o={sizes}
                    />
                    <Select
                      l="Mobile Subtitle Size"
                      v={smob}
                      s={setSmob}
                      o={sizes}
                    />
                  </div>
                )}
              </div>
            </Panel>

            <Panel
              title="Slider & Publishing"
              subtitle="Control order, autoplay and optional campaign schedule."
              open
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <Num l="Position / Order" v={pos} s={setPos} />
                <Select l="Slide Duration" v={auto} s={setAuto} o={autoplay} />
                <Toggle
                  label="Active"
                  description={active ? "Visible when schedule allows." : "Hidden."}
                  checked={active}
                  onChange={setActive}
                />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <DateTimeField
                  l="Publish From"
                  v={startsAt}
                  s={setStartsAt}
                />
                <DateTimeField
                  l="Publish Until"
                  v={endsAt}
                  s={setEndsAt}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-500">
                Empty dates mean no schedule restriction. The Store API will be
                updated in the storefront phase to enforce these dates.
              </p>
            </Panel>

            <div className="sticky bottom-3 z-40 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-700 bg-[#111114]/95 p-4 shadow-2xl backdrop-blur">
              <div>
                <p className="text-sm font-semibold">
                  {editingId ? "Editing existing Hero" : "New Hero Banner"}
                </p>
                <p className="text-xs text-gray-500">
                  Preview Desktop, Tablet and Mobile before saving.
                </p>
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-md border border-gray-600 px-4 py-2 text-sm transition hover:bg-white/5"
                  >
                    Cancel
                  </button>
                )}

                <button
                  disabled={disabled}
                  className="rounded-md bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Banner"
                      : "Create Banner"}
                </button>
              </div>
            </div>
          </div>

          <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-2xl border border-gray-700 bg-[#0d0d0f] shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 bg-[#151518] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Live Storefront Preview</p>
                  <p className="text-xs text-gray-500">
                    Click artwork to move the focal point.
                  </p>
                </div>

                <div className="flex rounded-md border border-gray-700 p-0.5">
                  {(
                    [
                      ["desktop", "Desktop"],
                      ["tablet", "Tablet"],
                      ["mobile", "Mobile"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPreviewViewport(value)}
                      className={`rounded px-2.5 py-1.5 text-[11px] transition ${
                        previewViewport === value
                          ? "bg-white text-black"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3">
                <div
                  className="relative mx-auto overflow-hidden bg-[#111111]"
                  onClick={handleFocalClick}
                  title="Click to set focal point"
                  style={{
                    width: "100%",
                    maxWidth: `${previewDimensions.width}px`,
                    aspectRatio: `${previewDimensions.width} / ${previewDimensions.height}`,
                    containerType: "inline-size",
                    cursor: previewMediaUrl ? "crosshair" : "default",
                  }}
                >
                  {previewMediaUrl ? (
                    previewMediaType === "video" ? (
                      <video
                        key={previewMediaUrl}
                        src={previewMediaUrl}
                        poster={previewPosterUrl || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{
                          objectPosition: `${previewFocalX}% ${previewFocalY}%`,
                        }}
                      />
                    ) : (
                      <img
                        src={previewMediaUrl}
                        alt={mediaAlt || "Hero preview"}
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{
                          objectPosition: `${previewFocalX}% ${previewFocalY}%`,
                        }}
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-gray-500">
                      Upload desktop media to start designing the Hero.
                    </div>
                  )}

                  {previewMediaUrl && (
                    <div
                      className="pointer-events-none absolute z-30 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/30 shadow"
                      style={{
                        left: `${previewFocalX}%`,
                        top: `${previewFocalY}%`,
                      }}
                    >
                      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                    </div>
                  )}

                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: getOverlayBackground(
                        overlayType,
                        overlayDirection,
                        oc,
                        Math.max(0, Math.min(100, Number(oo) || 0))
                      ),
                    }}
                  />

                  <div
                    className={`pointer-events-none absolute inset-0 z-20 flex ${
                      previewVertical === "top"
                        ? "items-start"
                        : previewVertical === "bottom"
                          ? "items-end"
                          : "items-center"
                    } ${
                      previewHorizontal === "left"
                        ? "justify-start"
                        : previewHorizontal === "right"
                          ? "justify-end"
                          : "justify-center"
                    }`}
                    style={{
                      padding: previewUsesMobile
                        ? "18px"
                        : responsiveSize(48, 8),
                    }}
                  >
                    <div
                      className="w-full"
                      style={{
                        maxWidth: `${Math.min(
                          100,
                          (previewContentWidth /
                            (previewUsesMobile
                              ? MOBILE_MASTER_WIDTH
                              : HERO_MASTER_WIDTH)) *
                            100
                        )}%`,
                        textAlign: previewTextAlign as
                          | "left"
                          | "center"
                          | "right",
                        transform: `translate(
                          ${toCqw(
                            previewOffsetX,
                            previewUsesMobile
                              ? MOBILE_MASTER_WIDTH
                              : HERO_MASTER_WIDTH
                          )},
                          ${toCqw(
                            previewOffsetY,
                            previewUsesMobile
                              ? MOBILE_MASTER_WIDTH
                              : HERO_MASTER_WIDTH
                          )}
                        )`,
                      }}
                    >
                      {eyebrow && (
                        <div
                          style={{
                            color: ec,
                            fontFamily: ef,
                            fontSize: responsiveSize(
                              Number(esz) || 14,
                              8
                            ),
                            fontWeight: Number(ew) || 600,
                            fontStyle: efs,
                            textTransform: et as React.CSSProperties["textTransform"],
                            letterSpacing: responsiveSize(
                              Number(esp) || 0,
                              0
                            ),
                            lineHeight: Number(elh) || 1.2,
                          }}
                        >
                          {eyebrow}
                        </div>
                      )}

                      {title && (
                        <div
                          style={{
                            marginTop: responsiveSize(12, 3),
                            color: tc,
                            fontFamily: tf,
                            fontSize: responsiveSize(
                              previewTitleSize,
                              previewUsesMobile ? 22 : 26,
                              previewMasterWidth
                            ),
                            fontWeight: Number(tw) || 700,
                            fontStyle: tfs,
                            textTransform: tt as React.CSSProperties["textTransform"],
                            letterSpacing: responsiveSize(
                              Number(tsp) || 0,
                              0,
                              previewMasterWidth
                            ),
                            lineHeight: Number(tlh) || 1,
                          }}
                        >
                          {title}
                        </div>
                      )}

                      {subtitle && (
                        <div
                          style={{
                            marginTop: responsiveSize(16, 5),
                            color: sc,
                            fontFamily: sf,
                            fontSize: responsiveSize(
                              previewSubtitleSize,
                              previewUsesMobile ? 12 : 10,
                              previewMasterWidth
                            ),
                            fontWeight: Number(sw) || 400,
                            fontStyle: sfs,
                            textTransform: st as React.CSSProperties["textTransform"],
                            letterSpacing: responsiveSize(
                              Number(ssp) || 0,
                              0,
                              previewMasterWidth
                            ),
                            lineHeight: Number(slh) || 1.5,
                          }}
                        >
                          {subtitle}
                        </div>
                      )}

                      {(bt || sbt) && (
                        <div
                          className={`flex flex-wrap ${
                            previewTextAlign === "left"
                              ? "justify-start"
                              : previewTextAlign === "right"
                                ? "justify-end"
                                : "justify-center"
                          }`}
                          style={{
                            marginTop: responsiveSize(28, 8),
                            gap: responsiveSize(12, 5),
                          }}
                        >
                          {bt && (
                            <span
                              className="inline-flex items-center justify-center text-center"
                              style={{
                                padding: `${responsiveSize(
                                  14,
                                  6
                                )} ${responsiveSize(24, 10)}`,
                                borderRadius: 0,
                                fontFamily:
                                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
                                fontSize: responsiveSize(
                                  Number(buttonSize) || 13,
                                  9,
                                  previewUsesMobile
                                    ? MOBILE_MASTER_WIDTH
                                    : HERO_MASTER_WIDTH
                                ),
                                fontWeight: 400,
                                textTransform: "uppercase",
                                letterSpacing: "0.12em",
                                ...getButtonStyle(
                                  buttonStyle,
                                  bbc,
                                  btc
                                ),
                              }}
                            >
                              {bt}
                            </span>
                          )}

                          {sbt && (
                            <span
                              className="inline-flex items-center justify-center text-center"
                              style={{
                                padding: `${responsiveSize(
                                  14,
                                  6
                                )} ${responsiveSize(24, 10)}`,
                                borderRadius: 0,
                                fontFamily:
                                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
                                fontSize: responsiveSize(
                                  Number(buttonSize) || 13,
                                  9,
                                  previewUsesMobile
                                    ? MOBILE_MASTER_WIDTH
                                    : HERO_MASTER_WIDTH
                                ),
                                fontWeight: 400,
                                textTransform: "uppercase",
                                letterSpacing: "0.12em",
                                ...getButtonStyle(
                                  secondaryButtonStyle,
                                  sbg,
                                  sbtc
                                ),
                              }}
                            >
                              {sbt}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                  <div className="rounded-md border border-gray-800 px-2.5 py-2">
                    Frame: {previewDimensions.width} × {previewDimensions.height}
                  </div>
                  <div className="rounded-md border border-gray-800 px-2.5 py-2">
                    Focus: {previewFocalX.toFixed(1)}% / {previewFocalY.toFixed(1)}%
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-[#A97838]/25 bg-[#A97838]/[0.05] px-3 py-2 text-[11px] leading-5 text-[#D3AD79]">
                  Tablet preview uses the target fluid Hero height. The storefront
                  component will be updated next to use the same rule.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>

      <div className="mt-12 border-t border-gray-800 pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Library
          </p>
          <h2 className="mt-1 text-lg font-semibold">Existing Hero Banners</h2>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {loading ? (
            <p>Loading...</p>
          ) : banners.length === 0 ? (
            <p className="text-sm text-gray-500">No Hero banners created yet.</p>
          ) : (
            [...banners]
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((banner) => (
                <div
                  key={banner.id}
                  className="overflow-hidden rounded-xl border border-gray-700 bg-[#111114]"
                >
                  <div className="grid min-h-[160px] grid-cols-[180px_minmax(0,1fr)]">
                    <div className="relative overflow-hidden bg-black">
                      {banner.media_type === "video" ? (
                        <video
                          src={banner.media_url}
                          poster={banner.poster_url || undefined}
                          muted
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={banner.media_url}
                          className="absolute inset-0 h-full w-full object-cover"
                          alt={banner.media_alt || banner.title || "Hero Banner"}
                        />
                      )}
                    </div>

                    <div className="min-w-0 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge active={banner.is_active !== false} />
                        <span className="rounded-full border border-gray-700 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400">
                          Position {banner.position ?? 0}
                        </span>
                        {banner.mobile_media_url && (
                          <span className="rounded-full border border-gray-700 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400">
                            Mobile Artwork
                          </span>
                        )}
                      </div>

                      <p className="mt-3 truncate text-base font-semibold">
                        {banner.title || "Untitled Hero"}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                        {banner.subtitle ||
                          banner.eyebrow ||
                          "No supporting copy"}
                      </p>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => edit(banner)}
                          className="rounded-md border border-gray-600 px-3 py-1.5 text-xs transition hover:bg-white/5"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => del(banner)}
                          className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}

const Panel = ({
  title,
  subtitle,
  open = false,
  children,
}: {
  title: string
  subtitle?: string
  open?: boolean
  children: React.ReactNode
}) => (
  <details
    open={open}
    className="group overflow-visible rounded-xl border border-gray-700 bg-[#0f0f12]"
  >
    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && (
          <p className="mt-1 text-xs leading-5 text-gray-500">{subtitle}</p>
        )}
      </div>
      <span className="mt-0.5 text-xs text-gray-500 transition group-open:rotate-180">
        ▾
      </span>
    </summary>

    <div className="border-t border-gray-800 px-5 pb-5 pt-5">
      {children}
    </div>
  </details>
)

const MediaUploader = ({
  label,
  description,
  inputRef,
  accept,
  url,
  mediaType,
  uploading,
  onFiles,
  onRemove,
  compact = false,
}: {
  label: string
  description?: string
  inputRef: React.RefObject<HTMLInputElement>
  accept: string
  url: string
  mediaType: "image" | "video"
  uploading: boolean
  onFiles: (files: FileList | null) => void
  onRemove: () => void
  compact?: boolean
}) => (
  <div>
    <div className="mb-2">
      <p className="text-sm font-medium">{label}</p>
      {description && (
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      )}
    </div>

    <input
      ref={inputRef}
      hidden
      type="file"
      accept={accept}
      onChange={(event) => {
        onFiles(event.target.files)
        event.currentTarget.value = ""
      }}
    />

    <button
      type="button"
      disabled={uploading}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        onFiles(event.dataTransfer.files)
      }}
      className={`flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-600 bg-black/20 transition hover:border-gray-400 ${
        compact ? "min-h-[150px]" : "min-h-[240px]"
      }`}
    >
      {url ? (
        mediaType === "video" ? (
          <video
            src={url}
            muted
            controls
            className={`${compact ? "max-h-[220px]" : "max-h-[330px]"} w-full object-contain`}
          />
        ) : (
          <img
            src={url}
            alt=""
            className={`${compact ? "max-h-[220px]" : "max-h-[330px]"} w-full object-contain`}
          />
        )
      ) : (
        <span className="px-6 text-center text-sm text-gray-400">
          {uploading ? "Uploading..." : "Click or drag media here"}
        </span>
      )}
    </button>

    {url && (
      <div className="mt-2 flex gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-gray-300 underline"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-400 underline"
        >
          Remove
        </button>
      </div>
    )}
  </div>
)

const Field = ({
  l,
  v,
  s,
  placeholder,
}: {
  l: string
  v: string
  s: (value: string) => void
  placeholder?: string
}) => (
  <label className="block text-sm">
    <span>{l}</span>
    <input
      value={v}
      placeholder={placeholder}
      onChange={(event) => s(event.target.value)}
      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white outline-none transition placeholder:text-gray-600 focus:border-gray-400"
    />
  </label>
)

const Num = ({
  l,
  v,
  s,
  min,
  max,
  step,
  placeholder,
}: {
  l: string
  v: string
  s: (value: string) => void
  min?: number
  max?: number
  step?: string
  placeholder?: string
}) => (
  <label className="block text-sm">
    <span>{l}</span>
    <input
      type="number"
      value={v}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(event) => s(event.target.value)}
      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white outline-none transition placeholder:text-gray-600 focus:border-gray-400"
    />
  </label>
)

const DateTimeField = ({
  l,
  v,
  s,
}: {
  l: string
  v: string
  s: (value: string) => void
}) => (
  <label className="block text-sm">
    <span>{l}</span>
    <input
      type="datetime-local"
      value={v}
      onChange={(event) => s(event.target.value)}
      className="mt-2 w-full rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-white outline-none transition focus:border-gray-400"
    />
  </label>
)

const Toggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-700 bg-[#151518] px-3 py-3">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && (
        <p className="mt-1 text-[11px] leading-4 text-gray-500">
          {description}
        </p>
      )}
    </div>

    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4"
    />
  </label>
)

const Select = ({
  l,
  v,
  s,
  o,
}: {
  l: string
  v: string
  s: (value: string) => void
  o: Option[]
}) => {
  const [open, setOpen] = useState(false)
  const [committedValue, setCommittedValue] = useState(v)
  const hoveringRef = useRef(false)

  const finalOptions = o.some((option) => option.value === v)
    ? o
    : [{ label: v || "Inherit", value: v }, ...o]

  const selectedOption =
    finalOptions.find((option) => option.value === v) || finalOptions[0]

  useEffect(() => {
    if (!hoveringRef.current) {
      setCommittedValue(v)
    }
  }, [v])

  const previewOption = (value: string) => {
    hoveringRef.current = true

    if (l === "Font") {
      loadGoogleFont(value)
    }

    s(value)
  }

  const commitOption = (value: string) => {
    hoveringRef.current = false
    setCommittedValue(value)

    if (l === "Font") {
      loadGoogleFont(value)
    }

    s(value)
    setOpen(false)
  }

  const restoreCommittedValue = () => {
    if (hoveringRef.current) {
      hoveringRef.current = false
      s(committedValue)
    }
  }

  return (
    <div
      className="relative text-sm"
      onMouseLeave={() => {
        restoreCommittedValue()
        setOpen(false)
      }}
    >
      <div className="mb-2">{l}</div>

      <button
        type="button"
        onClick={() => {
          restoreCommittedValue()
          setOpen((current) => !current)
        }}
        className="flex w-full items-center justify-between gap-3 rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-left text-white outline-none transition hover:border-gray-400"
        style={{
          fontFamily: l === "Font" ? v : undefined,
        }}
      >
        <span className="min-w-0 truncate">{selectedOption?.label || v}</span>
        <span
          className={`shrink-0 text-xs transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[120] mt-1 max-h-72 min-w-full overflow-y-auto rounded-md border border-gray-600 bg-[#1b1b1f] py-1 shadow-2xl">
          {finalOptions.map((option) => {
            const isCommitted = option.value === committedValue
            const isPreviewed = option.value === v

            return (
              <button
                key={`${option.label}-${option.value}`}
                type="button"
                onMouseEnter={() => previewOption(option.value)}
                onFocus={() => previewOption(option.value)}
                onClick={() => commitOption(option.value)}
                className={`block w-full whitespace-nowrap px-3 py-2 text-left text-white transition ${
                  isPreviewed
                    ? "bg-[#3a3a42]"
                    : "hover:bg-[#2a2a30] focus:bg-[#2a2a30]"
                }`}
                style={{
                  fontFamily: l === "Font" ? option.value : undefined,
                }}
              >
                <span className="flex items-center justify-between gap-6">
                  <span>{option.label}</span>
                  {isCommitted && (
                    <span className="text-xs text-gray-400">✓</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

type ColorProps = {
  l: string
  v: string
  s: (value: string) => void
  savedColors: string[]
  saveCustomColor: (color: string) => void
  removeSavedColor: (color: string) => void
}

const Color = ({
  l,
  v,
  s,
  savedColors,
  saveCustomColor,
  removeSavedColor,
}: ColorProps) => {
  const safeColor = /^#[0-9a-f]{6}$/i.test(v) ? v : "#FFFFFF"

  const handleColorChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newColor = event.target.value.toUpperCase()
    s(newColor)
    saveCustomColor(newColor)
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium">{l}</p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={safeColor}
          onChange={handleColorChange}
          title="Choose custom color"
          className="h-10 w-14 cursor-pointer rounded border border-gray-600 bg-transparent"
        />

        {defaultSwatches.map((color) => {
          const selected =
            normalizeColor(v) === normalizeColor(color)

          return (
            <button
              type="button"
              key={color}
              onClick={() => s(color)}
              title={color}
              className={`h-7 w-7 rounded-full border-2 transition ${
                selected
                  ? "scale-110 border-white"
                  : "border-gray-600"
              }`}
              style={{
                backgroundColor: color,
              }}
            />
          )
        })}
      </div>

      {savedColors.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-700 bg-[#151518] p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-300">
            Saved Colors
          </p>

          <div className="flex flex-wrap gap-3">
            {savedColors.map((color) => {
              const selected =
                normalizeColor(v) === normalizeColor(color)

              return (
                <div
                  key={color}
                  className="group flex flex-col items-center gap-1"
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => s(color)}
                      title={`Use ${color}`}
                      className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
                        selected
                          ? "scale-110 border-white"
                          : "border-gray-600"
                      }`}
                      style={{
                        backgroundColor: color,
                      }}
                    />

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        removeSavedColor(color)
                      }}
                      title={`Remove ${color}`}
                      className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold leading-none text-white opacity-0 shadow transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>

                  <span className="text-[9px] text-gray-500">{color}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const TypographyBlock = ({
  title,
  font,
  size,
  weight,
  style,
  transform,
  spacing,
  line,
  color,
  savedColors,
  saveCustomColor,
  removeSavedColor,
}: {
  title: string
  font: [string, (value: string) => void]
  size: [string, (value: string) => void]
  weight: [string, (value: string) => void]
  style: [string, (value: string) => void]
  transform: [string, (value: string) => void]
  spacing: [string, (value: string) => void]
  line: [string, (value: string) => void]
  color: [string, (value: string) => void]
  savedColors: string[]
  saveCustomColor: (color: string) => void
  removeSavedColor: (color: string) => void
}) => (
  <div>
    <p className="mb-4 text-sm font-semibold">{title}</p>

    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Select l="Font" v={font[0]} s={font[1]} o={fonts} />
      <Select l="Master Size" v={size[0]} s={size[1]} o={sizes} />
      <Select l="Weight" v={weight[0]} s={weight[1]} o={weights} />
      <Select l="Style" v={style[0]} s={style[1]} o={styles} />
      <Select l="Text Case" v={transform[0]} s={transform[1]} o={transforms} />
      <Select l="Spacing" v={spacing[0]} s={spacing[1]} o={spacings} />
      <Select l="Line Height" v={line[0]} s={line[1]} o={lines} />
    </div>

    <Color
      l={`${title} Color`}
      v={color[0]}
      s={color[1]}
      savedColors={savedColors}
      saveCustomColor={saveCustomColor}
      removeSavedColor={removeSavedColor}
    />
  </div>
)

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
      active
        ? "border-emerald-800 bg-emerald-950/30 text-emerald-400"
        : "border-gray-700 bg-gray-900 text-gray-500"
    }`}
  >
    {active ? "Active" : "Inactive"}
  </span>
)

export const config = defineRouteConfig({
  label: "Hero Banners",
})

export default HeroBannersPage
