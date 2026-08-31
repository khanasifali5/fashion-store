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

  eyebrow?: string | null
  title?: string | null
  subtitle?: string | null

  eyebrow_font_family?: string
  eyebrow_font_style?: string
  eyebrow_text_transform?: string
  eyebrow_color: string
  eyebrow_size: number
  eyebrow_weight: number
  eyebrow_letter_spacing: number
  eyebrow_line_height?: number

  title_font_family?: string
  title_font_style?: string
  title_text_transform?: string
  title_color: string
  title_size: number
  title_mobile_size: number
  title_weight: number
  title_letter_spacing: number
  title_line_height: number

  subtitle_font_family?: string
  subtitle_font_style?: string
  subtitle_text_transform?: string
  subtitle_color: string
  subtitle_size: number
  subtitle_mobile_size: number
  subtitle_weight: number
  subtitle_letter_spacing: number
  subtitle_line_height?: number

  text_align: string
  vertical_position: string
  horizontal_position: string
  content_offset_x: number
  content_offset_y: number

  button_text?: string | null
  button_url?: string | null
  button_bg_color: string
  button_text_color: string
  button_size: number

  secondary_button_text?: string | null
  secondary_button_url?: string | null
  secondary_button_bg_color: string
  secondary_button_text_color: string

  object_position: string
  overlay_color: string
  overlay_opacity: number

  position: number
  is_active: boolean
  autoplay_duration: number
}

type Option = {
  label: string
  value: string
}

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
].map((v) => ({
  label: v,
  value: v,
}))

const sizes = [
  10, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32,
  36, 40, 44, 48, 56, 64, 72, 80, 88, 96, 110, 128,
].map((v) => ({
  label: `${v} px`,
  value: String(v),
}))

const weights: Option[] = [
  ["Light", 300],
  ["Regular", 400],
  ["Medium", 500],
  ["Semi Bold", 600],
  ["Bold", 700],
  ["Extra Bold", 800],
  ["Black", 900],
].map(([a, b]) => ({
  label: `${a} — ${b}`,
  value: String(b),
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

const align: Option[] = ["left", "center", "right"].map((v) => ({
  label: v[0].toUpperCase() + v.slice(1),
  value: v,
}))

const vertical: Option[] = ["top", "center", "bottom"].map((v) => ({
  label: v[0].toUpperCase() + v.slice(1),
  value: v,
}))

const overlay = Array.from({ length: 11 }, (_, i) => ({
  label: `${i * 10}%`,
  value: String(i * 10),
}))

const autoplay: Option[] = [
  3000,
  4000,
  5000,
  6000,
  7000,
  8000,
  10000,
].map((v) => ({
  label: `${v / 1000} seconds`,
  value: String(v),
}))

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
  ).replace(/%20/g, "+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap`

  document.head.appendChild(link)
  loadedFontFamilies.add(family)
}

const normalizeColor = (color: string) => color.toUpperCase()

const HERO_MASTER_WIDTH = 1440

const heroCqw = (
  pixels: number
) =>
  `${(
    (pixels / HERO_MASTER_WIDTH) *
    100
  ).toFixed(4)}cqw`

const heroResponsiveSize = (
  pixels: number,
  minimum = 0
) =>
  `clamp(${minimum}px, ${heroCqw(
    pixels
  )}, ${pixels}px)`

const getHeroPreviewDimensions = (
  viewport: "desktop" | "tablet" | "mobile",
  desktopHeight: number,
  mobileHeight: number
) => {
  if (viewport === "mobile") {
    return {
      width: 390,
      height: mobileHeight,
    }
  }

  if (viewport === "tablet") {
    return {
      width: 900,
      height: desktopHeight,
    }
  }

  return {
    width: 1440,
    height: desktopHeight,
  }
}

const HeroBannersPage = () => {
  const fileRef = useRef<HTMLInputElement>(null)
  const mobileFileRef = useRef<HTMLInputElement>(null)

  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingMobile, setUploadingMobile] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [previewExpanded, setPreviewExpanded] = useState(false)

  /*
   * Preview only — NOT separate designs.
   * All three views render the same master settings.
   */
  const [previewViewport, setPreviewViewport] =
    useState<"desktop" | "tablet" | "mobile">("desktop")

  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const [isDraggingPreview, setIsDraggingPreview] = useState(false)
  const previewDragOffsetRef = useRef({ x: 0, y: 0 })

  // SAVED CUSTOM COLORS
  const [savedColors, setSavedColors] = useState<string[]>([])

  const [mediaUrl, setMediaUrl] = useState("")
  const [mediaType, setMediaType] =
    useState<"image" | "video">("image")

  const [mobileMediaUrl, setMobileMediaUrl] = useState("")
  const [mobileMediaType, setMobileMediaType] =
    useState<"image" | "video">("image")
  const [mobileHeight, setMobileHeight] = useState("540")
  const [mobileOverrideOpen, setMobileOverrideOpen] = useState(false)

  /*
   * Hero slider height is part of the responsive master.
   * Default 720 gives a more premium/full fashion hero than 620.
   */
  const [heroHeight, setHeroHeight] = useState("720")

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
  const [tw, setTw] = useState("700")
  const [tsp, setTsp] = useState("0")
  const [tlh, setTlh] = useState("1")

  const [sf, setSf] = useState("Inter")
  const [sfs, setSfs] = useState("normal")
  const [st, setSt] = useState("none")
  const [sc, setSc] = useState("#FFFFFF")
  const [ssz, setSsz] = useState("18")
  const [sw, setSw] = useState("400")
  const [ssp, setSsp] = useState("0")
  const [slh, setSlh] = useState("1.5")

  const [ta, setTa] = useState("center")
  const [vp, setVp] = useState("center")
  const [hp, setHp] = useState("center")
  const [ox, setOx] = useState("0")
  const [oy, setOy] = useState("0")

  const [bt, setBt] = useState("Shop Now")
  const [bu, setBu] = useState("/")
  const [bbc, setBbc] = useState("#765633")
  const [btc, setBtc] = useState("#FFFFFF")

  const [sbt, setSbt] = useState("")
  const [sbu, setSbu] = useState("")
  const [sbg, setSbg] = useState("transparent")
  const [sbtc, setSbtc] = useState("#FFFFFF")

  const [op, setOp] = useState("center")
  const [oc, setOc] = useState("#000000")
  const [oo, setOo] = useState("10")
  const [pos, setPos] = useState("0")
  const [active, setActive] = useState(true)
  const [auto, setAuto] = useState("6000")

  useEffect(() => {
    loadGoogleFont(ef)
    loadGoogleFont(tf)
    loadGoogleFont(sf)
  }, [ef, tf, sf])


  useEffect(() => {
    if (!isDraggingPreview) return

    const handleMouseMove = (event: MouseEvent) => {
      const panelWidth = 460
      const padding = 12
      const visibleGrip = 72

      const nextX = Math.min(
        Math.max(
          -(panelWidth - visibleGrip),
          event.clientX - previewDragOffsetRef.current.x
        ),
        window.innerWidth - visibleGrip
      )

      const nextY = Math.min(
        Math.max(
          padding,
          event.clientY - previewDragOffsetRef.current.y
        ),
        Math.max(padding, window.innerHeight - visibleGrip)
      )

      setPreviewPosition({ x: nextX, y: nextY })
    }

    const handleMouseUp = () => {
      setIsDraggingPreview(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingPreview])

  const startPreviewDrag = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (previewExpanded) return

    const panel = event.currentTarget.closest(
      "[data-hero-preview-panel]"
    ) as HTMLElement | null

    if (!panel) return

    const rect = panel.getBoundingClientRect()

    previewDragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    setPreviewPosition({
      x: rect.left,
      y: rect.top,
    })

    setIsDraggingPreview(true)
  }

  const resetPreviewPosition = () => {
    setPreviewPosition({
      x: Math.max(12, window.innerWidth - 460 - 20),
      y: 96,
    })
  }

  // LOAD SAVED CUSTOM COLORS
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

    if (defaultSwatches.some(
      (c) => normalizeColor(c) === normalized
    )) {
      return
    }

    setSavedColors((current) => {
      if (
        current.some(
          (c) => normalizeColor(c) === normalized
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
        (c) =>
          normalizeColor(c) !== normalizeColor(color)
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

      const r = await sdk.client.fetch<{
        hero_banners: HeroBanner[]
      }>("/admin/hero-banners", {
        method: "GET",
      })

      setBanners(r.hero_banners || [])
    } catch (e) {
      console.error(e)
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
    setMobileHeight("540")
    setMobileOverrideOpen(false)
    setHeroHeight("720")

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
    setTw("700")
    setTsp("0")
    setTlh("1")

    setSf("Inter")
    setSfs("normal")
    setSt("none")
    setSc("#FFFFFF")
    setSsz("18")
    setSw("400")
    setSsp("0")
    setSlh("1.5")

    setTa("center")
    setVp("center")
    setHp("center")
    setOx("0")
    setOy("0")

    setBt("Shop Now")
    setBu("/")
    setBbc("#765633")
    setBtc("#FFFFFF")

    setSbt("")
    setSbu("")
    setSbg("transparent")
    setSbtc("#FFFFFF")

    setOp("center")
    setOc("#000000")
    setOo("10")
    setPos("0")
    setActive(true)
    setAuto("6000")
  }

  const upload = async (files: FileList | null) => {
    if (!files?.length) return

    const f = files[0]

    const img = f.type.startsWith("image/")
    const vid = f.type.startsWith("video/")

    if (!img && !vid) {
      alert("Please upload an image or video.")
      return
    }

    try {
      setUploading(true)

      const r = await sdk.admin.upload.create({
        files: [f],
      })

      const u = r.files?.[0] as
        | { url?: string }
        | undefined

      if (!u?.url) {
        throw Error("No URL")
      }

      setMediaUrl(u.url)
      setMediaType(vid ? "video" : "image")
    } catch (e) {
      console.error(e)
      alert("Media upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const uploadMobile = async (files: FileList | null) => {
    if (!files?.length) return

    const f = files[0]
    const img = f.type.startsWith("image/")
    const vid = f.type.startsWith("video/")

    if (!img && !vid) {
      alert("Please upload an image or video.")
      return
    }

    try {
      setUploadingMobile(true)

      const r = await sdk.admin.upload.create({
        files: [f],
      })

      const u = r.files?.[0] as
        | { url?: string }
        | undefined

      if (!u?.url) {
        throw Error("No URL")
      }

      setMobileMediaUrl(u.url)
      setMobileMediaType(vid ? "video" : "image")
    } catch (e) {
      console.error(e)
      alert("Mobile media upload failed.")
    } finally {
      setUploadingMobile(false)
    }
  }

  const body = () => ({
    media_url: mediaUrl,
    media_type: mediaType,

    mobile_media_url:
      mobileMediaUrl || null,
    mobile_media_type:
      mobileMediaType,
    mobile_height:
      Math.max(
        400,
        Number(mobileHeight) ||
          540
      ),

    hero_height:
      Math.max(
        360,
        Number(heroHeight) ||
          720
      ),

    eyebrow: eyebrow || null,
    title: title || null,
    subtitle: subtitle || null,

    eyebrow_font_family: ef,
    eyebrow_font_style: efs,
    eyebrow_text_transform: et,
    eyebrow_color: ec,
    eyebrow_size: +esz,
    eyebrow_weight: +ew,
    eyebrow_letter_spacing: +esp,
    eyebrow_line_height: +elh,

    title_font_family: tf,
    title_font_style: tfs,
    title_text_transform: tt,
    title_color: tc,
    title_size: +tsz,
    /*
     * Legacy backend field:
     * keep it synchronized with the master size.
     * There is no separate mobile design anymore.
     */
    title_mobile_size: +tsz,
    title_weight: +tw,
    title_letter_spacing: +tsp,
    title_line_height: +tlh,

    subtitle_font_family: sf,
    subtitle_font_style: sfs,
    subtitle_text_transform: st,
    subtitle_color: sc,
    subtitle_size: +ssz,
    /*
     * Legacy backend field kept for API/database compatibility.
     */
    subtitle_mobile_size: +ssz,
    subtitle_weight: +sw,
    subtitle_letter_spacing: +ssp,
    subtitle_line_height: +slh,

    text_align: ta,
    vertical_position: vp,
    horizontal_position: hp,
    content_offset_x: +ox,
    content_offset_y: +oy,

    button_text: bt || null,
    button_url: bu || null,
    button_bg_color: bbc,
    button_text_color: btc,
    button_size: 12,

    secondary_button_text: sbt || null,
    secondary_button_url: sbu || null,
    secondary_button_bg_color: sbg,
    secondary_button_text_color: sbtc,

    object_position: op,
    overlay_color: oc,
    overlay_opacity: +oo,

    position: +pos,
    is_active: active,
    autoplay_duration: +auto,
  })

  const submit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!mediaUrl) {
      alert("Please upload media.")
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

      alert(
        editingId
          ? "Hero banner updated."
          : "Hero banner created."
      )

      reset()
      await load()
    } catch (e) {
      console.error(e)
      alert("Hero banner could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  const edit = (b: HeroBanner) => {
    setEditingId(b.id)

    setMediaUrl(b.media_url)
    setMediaType(b.media_type)
    setMobileMediaUrl(
      b.mobile_media_url || ""
    )
    setMobileMediaType(
      b.mobile_media_type || "image"
    )
    setMobileHeight(
      String(
        b.mobile_height ??
          540
      )
    )
    setMobileOverrideOpen(
      Boolean(
        b.mobile_media_url
      )
    )
    setHeroHeight(
      String(
        b.hero_height ??
        720
      )
    )

    setEyebrow(b.eyebrow || "")
    setTitle(b.title || "")
    setSubtitle(b.subtitle || "")

    setEf(b.eyebrow_font_family || "Inter")
    setEfs(b.eyebrow_font_style || "normal")
    setEt(b.eyebrow_text_transform || "uppercase")
    setEc(b.eyebrow_color || "#FFFFFF")
    setEsz(String(b.eyebrow_size ?? 14))
    setEw(String(b.eyebrow_weight ?? 600))
    setEsp(String(b.eyebrow_letter_spacing ?? 2))
    setElh(String(b.eyebrow_line_height ?? 1.2))

    setTf(b.title_font_family || "Playfair Display")
    setTfs(b.title_font_style || "normal")
    setTt(b.title_text_transform || "none")
    setTc(b.title_color || "#FFFFFF")
    setTsz(String(b.title_size ?? 64))
    setTw(String(b.title_weight ?? 700))
    setTsp(String(b.title_letter_spacing ?? 0))
    setTlh(String(b.title_line_height ?? 1))

    setSf(b.subtitle_font_family || "Inter")
    setSfs(b.subtitle_font_style || "normal")
    setSt(b.subtitle_text_transform || "none")
    setSc(b.subtitle_color || "#FFFFFF")
    setSsz(String(b.subtitle_size ?? 18))
    setSw(String(b.subtitle_weight ?? 400))
    setSsp(String(b.subtitle_letter_spacing ?? 0))
    setSlh(String(b.subtitle_line_height ?? 1.5))

    setTa(b.text_align || "center")
    setVp(b.vertical_position || "center")
    setHp(b.horizontal_position || "center")
    setOx(String(b.content_offset_x ?? 0))
    setOy(String(b.content_offset_y ?? 0))

    setBt(b.button_text || "")
    setBu(b.button_url || "/")
    setBbc(b.button_bg_color || "#765633")
    setBtc(b.button_text_color || "#FFFFFF")

    setSbt(b.secondary_button_text || "")
    setSbu(b.secondary_button_url || "")
    setSbg(
      b.secondary_button_bg_color || "transparent"
    )
    setSbtc(
      b.secondary_button_text_color || "#FFFFFF"
    )

    setOp(b.object_position || "center")
    setOc(b.overlay_color || "#000000")
    setOo(String(b.overlay_opacity ?? 10))

    setPos(String(b.position ?? 0))
    setActive(!!b.is_active)
    setAuto(String(b.autoplay_duration ?? 6000))

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const del = async (b: HeroBanner) => {
    if (
      !confirm(
        `Delete ${b.title || "this banner"}?`
      )
    ) {
      return
    }

    try {
      await sdk.client.fetch(
        `/admin/hero-banners/${b.id}`,
        {
          method: "DELETE",
        }
      )

      if (editingId === b.id) {
        reset()
      }

      await load()
    } catch (e) {
      console.error(e)
      alert("Delete failed.")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">
        Hero Banners
      </h1>

      <p className="mt-2 text-sm text-gray-500">
        One responsive Hero component with stable desktop height and an optional mobile media override.
      </p>

      <div className="mt-4 rounded-lg border border-[#A97838]/35 bg-[#A97838]/[0.06] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#D3AD79]">
          Responsive Master
        </p>
        <p className="mt-1 max-w-4xl text-xs leading-5 text-gray-400">
          Desktop width can shrink without shrinking the Hero height. At the mobile
          breakpoint, the same content/settings use a dedicated mobile height and,
          optionally, different mobile artwork.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mt-8 rounded-lg border border-gray-700 p-6"
      >
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">
            {editingId
              ? "Edit Hero Banner"
              : "Create Hero Banner"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="text-sm underline"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="mt-8">
          <div className="min-w-0">
        <Section t="1. Hero Media" />

        <input
          ref={fileRef}
          hidden
          type="file"
          accept="image/*,video/*"
          onChange={(e) => upload(e.target.files)}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            upload(e.dataTransfer.files)
          }}
          className="flex min-h-[250px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-500 p-4"
        >
          {mediaUrl ? (
            mediaType === "video" ? (
              <video
                src={mediaUrl}
                controls
                muted
                className="max-h-[320px] w-full object-contain"
              />
            ) : (
              <img
                src={mediaUrl}
                className="max-h-[320px] w-full object-contain"
                alt="Preview"
              />
            )
          ) : (
            <span>
              {uploading
                ? "Uploading..."
                : "Drag & drop image/video here, or click to choose"}
            </span>
          )}
        </button>

        {mediaUrl && (
          <div className="mt-3 flex gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs underline"
            >
              Replace Media
            </button>

            <button
              type="button"
              onClick={() => setMediaUrl("")}
              className="text-xs underline"
            >
              Remove Media
            </button>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-[#A97838]/35 bg-[#A97838]/[0.05] p-4">
          <div>
            <p className="text-sm font-semibold">
              Hero Master Height
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              Desktop Hero height stays stable while the browser becomes narrower.
              The media uses object-cover, so width changes are handled by cropping.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              520,
              620,
              700,
              720,
              760,
              820,
              900,
            ].map((height) => {
              const selected =
                Number(heroHeight) ===
                height

              return (
                <button
                  key={height}
                  type="button"
                  onClick={() =>
                    setHeroHeight(
                      String(height)
                    )
                  }
                  className={`rounded-md border px-3 py-2 text-xs transition ${
                    selected
                      ? "border-[#A97838] bg-[#A97838]/15 text-[#D3AD79]"
                      : "border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {height}px
                </button>
              )
            })}
          </div>

          <label className="mt-4 block max-w-[260px] text-sm">
            Custom Height
            <input
              type="number"
              min="360"
              max="1200"
              step="10"
              value={heroHeight}
              onChange={(e) =>
                setHeroHeight(
                  e.target.value
                )
              }
              className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
            />
          </label>

          <p className="mt-3 text-[11px] text-gray-500">
            Recommended for SAFAFI: 720–760px. Use 820–900px for a taller,
            more cinematic fashion hero.
          </p>

          <p className="mt-2 text-[11px] leading-5 text-[#D3AD79]">
            This is the desktop/narrow-desktop height. Mobile uses the override
            below; content, typography and buttons are still shared.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-gray-700 bg-[#111114] p-4">
          <button
            type="button"
            onClick={() => setMobileOverrideOpen((current) => !current)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="text-sm font-semibold">
                Advanced Mobile Override
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Optional artwork override. Hero content and styling remain shared.
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {mobileOverrideOpen ? "Hide" : "Open"}
            </span>
          </button>

          {mobileOverrideOpen && (
            <div className="mt-4 space-y-4">
              <input
                ref={mobileFileRef}
                hidden
                type="file"
                accept="image/*,video/*"
                onChange={(e) => uploadMobile(e.target.files)}
              />

              <button
                type="button"
                disabled={uploadingMobile}
                onClick={() => mobileFileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  uploadMobile(e.dataTransfer.files)
                }}
                className="flex min-h-[180px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-600 p-4"
              >
                {mobileMediaUrl ? (
                  mobileMediaType === "video" ? (
                    <video
                      src={mobileMediaUrl}
                      controls
                      muted
                      className="max-h-[260px] w-full object-contain"
                    />
                  ) : (
                    <img
                      src={mobileMediaUrl}
                      alt="Mobile hero preview"
                      className="max-h-[260px] w-full object-contain"
                    />
                  )
                ) : (
                  <span className="text-sm text-gray-400">
                    {uploadingMobile
                      ? "Uploading..."
                      : "Optional mobile image/video — click or drop here"}
                  </span>
                )}
              </button>

              {mobileMediaUrl && (
                <button
                  type="button"
                  onClick={() => setMobileMediaUrl("")}
                  className="text-xs text-red-400 underline"
                >
                  Remove mobile override
                </button>
              )}

              <label className="block max-w-[260px] text-sm">
                Mobile Hero Height
                <input
                  type="number"
                  min="400"
                  max="900"
                  step="10"
                  value={mobileHeight}
                  onChange={(e) => setMobileHeight(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
                />
              </label>

              <p className="text-[11px] leading-5 text-gray-500">
                Recommended: 520–580px. If mobile media is empty, desktop media
                is reused and cropped with the same object-position.
              </p>
            </div>
          )}
        </div>


        <Section t="2. Content" />

        <Grid>
          <Field
            l="Eyebrow"
            v={eyebrow}
            s={setEyebrow}
          />
          <Field l="Title" v={title} s={setTitle} />
          <Field
            l="Subtitle"
            v={subtitle}
            s={setSubtitle}
          />
        </Grid>

        <Section t="3. Eyebrow Style" />

        <StyleGrid
          font={[ef, setEf]}
          size={[esz, setEsz]}
          weight={[ew, setEw]}
          style={[efs, setEfs]}
          transform={[et, setEt]}
          spacing={[esp, setEsp]}
          line={[elh, setElh]}
        />

        <Color
          l="Eyebrow Color"
          v={ec}
          s={setEc}
          savedColors={savedColors}
          saveCustomColor={saveCustomColor}
          removeSavedColor={removeSavedColor}
        />

        <Section t="4. Title Style" />

        <StyleGrid
          font={[tf, setTf]}
          size={[tsz, setTsz]}
          weight={[tw, setTw]}
          style={[tfs, setTfs]}
          transform={[tt, setTt]}
          spacing={[tsp, setTsp]}
          line={[tlh, setTlh]}
        />

        <Color
          l="Title Color"
          v={tc}
          s={setTc}
          savedColors={savedColors}
          saveCustomColor={saveCustomColor}
          removeSavedColor={removeSavedColor}
        />

        <Section t="5. Subtitle Style" />

        <StyleGrid
          font={[sf, setSf]}
          size={[ssz, setSsz]}
          weight={[sw, setSw]}
          style={[sfs, setSfs]}
          transform={[st, setSt]}
          spacing={[ssp, setSsp]}
          line={[slh, setSlh]}
        />

        <Color
          l="Subtitle Color"
          v={sc}
          s={setSc}
          savedColors={savedColors}
          saveCustomColor={saveCustomColor}
          removeSavedColor={removeSavedColor}
        />

        <Section t="6. Text Position" />

        <Grid>
          <Select
            l="Text Align"
            v={ta}
            s={setTa}
            o={align}
          />

          <Select
            l="Horizontal"
            v={hp}
            s={setHp}
            o={align}
          />

          <Select
            l="Vertical"
            v={vp}
            s={setVp}
            o={vertical}
          />

          <Num
            l="Fine Tune X"
            v={ox}
            s={setOx}
          />

          <Num
            l="Fine Tune Y"
            v={oy}
            s={setOy}
          />
        </Grid>

        <Section t="7. Primary Button" />

        <Grid>
          <Field l="Text" v={bt} s={setBt} />

          <Field l="URL" v={bu} s={setBu} />

          <div className="rounded-md border border-[#A97838]/35 bg-[#A97838]/[0.05] px-3 py-2.5">
            <p className="text-xs font-medium text-[#D3AD79]">
              CTA Style — Campaign Button
            </p>
            <p className="mt-1 text-[10px] leading-4 text-gray-500">
              12px uppercase · rectangular · campaign padding · hover opacity.
            </p>
          </div>

          <Color
            l="Background"
            v={bbc}
            s={setBbc}
            savedColors={savedColors}
            saveCustomColor={saveCustomColor}
            removeSavedColor={removeSavedColor}
          />

          <Color
            l="Text Color"
            v={btc}
            s={setBtc}
            savedColors={savedColors}
            saveCustomColor={saveCustomColor}
            removeSavedColor={removeSavedColor}
          />
        </Grid>

        <Section t="8. Secondary Button" />

        <Grid>
          <Field
            l="Text"
            v={sbt}
            s={setSbt}
          />

          <Field
            l="URL"
            v={sbu}
            s={setSbu}
          />

          <Field
            l="Background (transparent allowed)"
            v={sbg}
            s={setSbg}
          />

          <Color
            l="Text Color"
            v={sbtc}
            s={setSbtc}
            savedColors={savedColors}
            saveCustomColor={saveCustomColor}
            removeSavedColor={removeSavedColor}
          />
        </Grid>

        <Section t="9. Media & Overlay" />

        <Grid>
          <Select
            l="Media Focus"
            v={op}
            s={setOp}
            o={vertical.concat([
              {
                label: "Left",
                value: "left",
              },
              {
                label: "Right",
                value: "right",
              },
            ])}
          />

          <Color
            l="Overlay Color"
            v={oc}
            s={setOc}
            savedColors={savedColors}
            saveCustomColor={saveCustomColor}
            removeSavedColor={removeSavedColor}
          />

          <Select
            l="Overlay Darkness"
            v={oo}
            s={setOo}
            o={overlay}
          />

          <Select
            l="Slide Duration"
            v={auto}
            s={setAuto}
            o={autoplay}
          />
        </Grid>

        <Section t="10. Slide Settings" />

        <Grid>
          <Num
            l="Position / Order"
            v={pos}
            s={setPos}
          />

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) =>
                setActive(e.target.checked)
              }
            />

            {active
              ? "Active — show"
              : "Inactive — hidden"}
          </label>

          <button
            disabled={
              saving || uploading || !mediaUrl
            }
            className="rounded-md bg-white px-5 py-2 text-black disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Banner"
                : "Create Banner"}
          </button>
        </Grid>

          </div>

        </div>
      </form>

      {previewOpen ? (
        <>
          {previewExpanded && (
            <button
              type="button"
              aria-label="Close expanded preview"
              onClick={() => setPreviewExpanded(false)}
              className="fixed inset-0 z-[89] bg-black/60 backdrop-blur-[1px]"
            />
          )}

          <aside
            data-hero-preview-panel
            className={`fixed z-[90] max-h-[calc(100vh-24px)] overflow-auto rounded-xl shadow-2xl transition-[width,height] duration-200 ${
              previewExpanded
                ? "bottom-5 left-[240px] right-5 top-24"
                : "w-[460px] max-w-[calc(100vw-40px)]"
            }`}
            style={
              previewExpanded
                ? undefined
                : {
                    left:
                      previewPosition.x > 0
                        ? `${previewPosition.x}px`
                        : undefined,
                    top:
                      previewPosition.y > 0
                        ? `${previewPosition.y}px`
                        : "96px",
                    right:
                      previewPosition.x > 0
                        ? "auto"
                        : "20px",
                  }
            }
          >
        <div className="overflow-hidden rounded-xl border border-gray-700 bg-black">
          <div
            onMouseDown={startPreviewDrag}
            className={`mb-0 flex items-center justify-between border-b border-gray-700 bg-[#151518] px-4 py-3 ${
              previewExpanded
                ? ""
                : isDraggingPreview
                  ? "cursor-grabbing"
                  : "cursor-grab"
            }`}
          >
            <div className="select-none">
              <p className="text-sm font-semibold">⋮⋮ Live Banner Preview</p>
              <p className="text-xs text-gray-500">
                Same master design · Desktop / Tablet / Mobile are preview-only.
              </p>
            </div>
            <div
              className="flex shrink-0 items-center gap-2"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="mr-1 flex rounded-md border border-gray-700 p-0.5">
                {([
                  ["desktop", "Desktop"],
                  ["tablet", "Tablet"],
                  ["mobile", "Mobile"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPreviewViewport(value)}
                    className={`rounded px-2 py-1 text-[10px] transition ${
                      previewViewport === value
                        ? "bg-white text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {!previewExpanded && (
                <button
                  type="button"
                  onClick={resetPreviewPosition}
                  className="rounded-md border border-gray-600 px-3 py-1.5 text-[11px] text-gray-200 transition hover:bg-white/10"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewExpanded((current) => !current)}
                className="rounded-md border border-gray-600 px-3 py-1.5 text-[11px] text-gray-200 transition hover:bg-white/10"
              >
                {previewExpanded ? "Restore" : "Expand"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviewOpen(false)
                  setPreviewExpanded(false)
                }}
                className="rounded-md border border-gray-600 px-3 py-1.5 text-[11px] text-gray-200 transition hover:bg-white/10"
              >
                Hide
              </button>
            </div>
          </div>

          <div className="flex justify-center bg-[#0d0d0f] p-3">
            <div
              className="relative overflow-hidden bg-[#111111]"
              style={(() => {
                const dimensions =
                  getHeroPreviewDimensions(
                    previewViewport,
                    Math.max(
                      360,
                      Number(heroHeight) ||
                        720
                    ),
                    Math.max(
                      400,
                      Number(mobileHeight) ||
                        540
                    )
                  )

                return {
                  width:
                    previewViewport === "desktop"
                      ? "100%"
                      : previewViewport === "tablet"
                        ? "72%"
                        : "42%",
                  maxWidth:
                    `${dimensions.width}px`,
                  aspectRatio:
                    `${dimensions.width} / ${dimensions.height}`,
                  containerType:
                    "inline-size",
                }
              })()}
            >
            {(previewViewport === "mobile" && mobileMediaUrl) || mediaUrl ? (
              (
                previewViewport === "mobile" &&
                mobileMediaUrl
                  ? mobileMediaType
                  : mediaType
              ) === "video" ? (
                <video
                  key={
                    previewViewport === "mobile" && mobileMediaUrl
                      ? mobileMediaUrl
                      : mediaUrl
                  }
                  src={
                    previewViewport === "mobile" && mobileMediaUrl
                      ? mobileMediaUrl
                      : mediaUrl
                  }
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: op }}
                />
              ) : (
                <img
                  src={
                    previewViewport === "mobile" && mobileMediaUrl
                      ? mobileMediaUrl
                      : mediaUrl
                  }
                  alt="Live hero preview"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: op }}
                />
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                Upload an image or video to preview the hero banner.
              </div>
            )}

            <div
              className="absolute inset-0"
              style={{
                backgroundColor: oc,
                opacity: Math.max(0, Math.min(100, Number(oo) || 0)) / 100,
              }}
            />

            <div
              className={`absolute inset-0 z-10 flex ${
                vp === "top"
                  ? "items-start"
                  : vp === "bottom"
                    ? "items-end"
                    : "items-center"
              } ${
                hp === "left"
                  ? "justify-start"
                  : hp === "right"
                    ? "justify-end"
                    : "justify-center"
              }`}
              style={{
                padding:
                  heroResponsiveSize(
                    48,
                    8
                  ),
              }}
            >
              <div
                className="w-full"
                style={{
                  maxWidth:
                    `${
                      (896 / HERO_MASTER_WIDTH) *
                      100
                    }%`,
                  textAlign: ta as "left" | "center" | "right",
                  transform: `translate(
                    ${heroCqw(Number(ox) || 0)},
                    ${heroCqw(Number(oy) || 0)}
                  )`,
                }}
              >
                {eyebrow && (
                  <div
                    style={{
                      color: ec,
                      fontFamily: ef,
                      fontSize:
                        heroResponsiveSize(
                          Number(esz) || 14,
                          8
                        ),
                      fontWeight: Number(ew) || 600,
                      fontStyle: efs,
                      textTransform: et as
                        | "none"
                        | "uppercase"
                        | "lowercase"
                        | "capitalize",
                      letterSpacing:
                        heroResponsiveSize(
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
                    className="mt-3"
                    style={{
                      color: tc,
                      fontFamily: tf,
                      fontSize:
                        heroResponsiveSize(
                          Number(tsz) || 64,
                          18
                        ),
                      fontWeight: Number(tw) || 700,
                      fontStyle: tfs,
                      textTransform: tt as
                        | "none"
                        | "uppercase"
                        | "lowercase"
                        | "capitalize",
                      letterSpacing:
                        heroResponsiveSize(
                          Number(tsp) || 0,
                          0
                        ),
                      lineHeight: Number(tlh) || 1,
                    }}
                  >
                    {title}
                  </div>
                )}

                {subtitle && (
                  <div
                    className="mt-4"
                    style={{
                      color: sc,
                      fontFamily: sf,
                      fontSize:
                        heroResponsiveSize(
                          Number(ssz) || 18,
                          10
                        ),
                      fontWeight: Number(sw) || 400,
                      fontStyle: sfs,
                      textTransform: st as
                        | "none"
                        | "uppercase"
                        | "lowercase"
                        | "capitalize",
                      letterSpacing:
                        heroResponsiveSize(
                          Number(ssp) || 0,
                          0
                        ),
                      lineHeight: Number(slh) || 1.5,
                    }}
                  >
                    {subtitle}
                  </div>
                )}

                {(bt || sbt) && (
                  <div
                    className={`mt-7 flex flex-wrap gap-3 ${
                      ta === "center"
                        ? "justify-center"
                        : ta === "right"
                          ? "justify-end"
                          : "justify-start"
                    }`}
                  >
                    {bt && (
                      <span
                        className="inline-flex items-center justify-center"
                        style={{
                          padding:
                            `${heroResponsiveSize(
                              14,
                              6
                            )} ${heroResponsiveSize(
                              24,
                              10
                            )}`,
                          backgroundColor: bbc,
                          color: btc,
                          border: `1px solid ${bbc}`,
                          borderRadius: 0,
                          fontFamily:
                            '"Helvetica Neue", Helvetica, Arial, sans-serif',
                          fontSize:
                            heroResponsiveSize(
                              12,
                              9
                            ),
                          fontWeight: 400,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                        }}
                      >
                        {bt}
                      </span>
                    )}

                    {sbt && (
                      <span
                        className="inline-flex items-center justify-center"
                        style={{
                          padding:
                            `${heroResponsiveSize(
                              14,
                              6
                            )} ${heroResponsiveSize(
                              24,
                              10
                            )}`,
                          backgroundColor: sbg,
                          color: sbtc,
                          border: `1px solid ${sbtc}`,
                          borderRadius: 0,
                          fontFamily:
                            '"Helvetica Neue", Helvetica, Arial, sans-serif',
                          fontSize:
                            heroResponsiveSize(
                              12,
                              9
                            ),
                          fontWeight: 400,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
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
          </div>
        </div>
          </aside>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="fixed right-5 top-28 z-[90] rounded-full border border-gray-600 bg-[#1b1b1f] px-4 py-2 text-sm font-medium text-white shadow-xl transition hover:bg-[#26262b]"
        >
          Live Preview
        </button>
      )}


      <div className="mt-10">
        <h2 className="text-lg font-semibold">
          Existing Hero Banners
        </h2>

        <div className="mt-5 space-y-4">
          {loading ? (
            <p>Loading...</p>
          ) : banners.length === 0 ? (
            <p>No hero banners created yet.</p>
          ) : (
            [...banners]
              .sort(
                (a, b) =>
                  a.position - b.position
              )
              .map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-4 rounded-md border border-gray-700 p-4"
                >
                  <div className="h-24 w-40 overflow-hidden rounded">
                    {b.media_type === "video" ? (
                      <video
                        src={b.media_url}
                        muted
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={b.media_url}
                        className="h-full w-full object-cover"
                        alt={
                          b.title || "Banner"
                        }
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs text-gray-500">
                      Position {b.position}
                    </p>

                    <p>
                      {b.title ||
                        "Untitled Banner"}
                    </p>
                  </div>

                  <span>
                    {b.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <button
                    type="button"
                    onClick={() => edit(b)}
                    className="rounded border px-3 py-1 text-xs"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => del(b)}
                    className="rounded border border-red-900 px-3 py-1 text-xs text-red-400"
                  >
                    Delete
                  </button>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}

const Section = ({ t }: { t: string }) => (
  <h3 className="mb-4 mt-8 border-t border-gray-700 pt-6 text-sm font-semibold uppercase">
    {t}
  </h3>
)

const Grid = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-5">
    {children}
  </div>
)

const Field = ({
  l,
  v,
  s,
}: {
  l: string
  v: string
  s: (x: string) => void
}) => (
  <label className="text-sm">
    {l}

    <input
      value={v}
      onChange={(e) => s(e.target.value)}
      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
    />
  </label>
)

const Num = ({
  l,
  v,
  s,
}: {
  l: string
  v: string
  s: (x: string) => void
}) => (
  <label className="text-sm">
    {l}

    <input
      type="number"
      value={v}
      onChange={(e) => s(e.target.value)}
      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
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
  s: (x: string) => void
  o: Option[]
}) => {
  const [open, setOpen] = useState(false)
  const [committedValue, setCommittedValue] = useState(v)
  const hoveringRef = useRef(false)

  const finalOptions = o.some((x) => x.value === v)
    ? o
    : [{ label: v, value: v }, ...o]

  const selectedOption =
    finalOptions.find((x) => x.value === v) ||
    finalOptions[0]

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
        <span className="min-w-0 truncate">
          {selectedOption?.label || v}
        </span>

        <span className={`shrink-0 text-xs transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[120] mt-1 max-h-72 min-w-full overflow-y-auto rounded-md border border-gray-600 bg-[#1b1b1f] py-1 shadow-2xl">
          {finalOptions.map((x) => {
            const isCommitted = x.value === committedValue
            const isPreviewed = x.value === v

            return (
              <button
                key={x.value}
                type="button"
                onMouseEnter={() => previewOption(x.value)}
                onFocus={() => previewOption(x.value)}
                onClick={() => commitOption(x.value)}
                className={`block w-full whitespace-nowrap px-3 py-2 text-left text-white transition ${
                  isPreviewed
                    ? "bg-[#3a3a42]"
                    : "hover:bg-[#2a2a30] focus:bg-[#2a2a30]"
                }`}
                style={{
                  fontFamily: l === "Font" ? x.value : undefined,
                }}
              >
                <span className="flex items-center justify-between gap-6">
                  <span>{x.label}</span>
                  {isCommitted && (
                    <span className="text-xs text-gray-400">✓</span>
                  )}
                </span>
              </button>
            )
          })}

          <div className="border-t border-gray-700 px-3 py-2 text-[11px] text-gray-500">
            Hover to preview · Click to keep
          </div>
        </div>
      )}
    </div>
  )
}

type ColorProps = {
  l: string
  v: string
  s: (x: string) => void
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
  const safeColor =
    /^#[0-9a-f]{6}$/i.test(v)
      ? v
      : "#FFFFFF"

  const handleColorChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newColor =
      e.target.value.toUpperCase()

    s(newColor)

    // Automatically save the custom color.
    saveCustomColor(newColor)
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium">
        {l}
      </p>

      {/* COLOR PICKER */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={safeColor}
          onChange={handleColorChange}
          title="Choose custom color"
          className="h-10 w-14 cursor-pointer rounded border border-gray-600 bg-transparent"
        />

        {/* DEFAULT COLORS */}
        {defaultSwatches.map((c) => {
          const selected =
            normalizeColor(v) ===
            normalizeColor(c)

          return (
            <button
              type="button"
              key={c}
              onClick={() => s(c)}
              title={c}
              className={`h-7 w-7 rounded-full border-2 transition ${
                selected
                  ? "scale-110 border-white"
                  : "border-gray-600"
              }`}
              style={{
                backgroundColor: c,
              }}
            />
          )
        })}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Click the square color box to open the full
        color palette. Custom colors are saved
        automatically.
      </p>

      {/* SAVED CUSTOM COLORS */}
      {savedColors.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-700 bg-[#151518] p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-300">
              Saved Colors
            </p>

            <span className="text-[11px] text-gray-500">
              Click color to use
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {savedColors.map((color) => {
              const selected =
                normalizeColor(v) ===
                normalizeColor(color)

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
                        backgroundColor:
                          color,
                      }}
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSavedColor(
                          color
                        )
                      }}
                      title={`Remove ${color}`}
                      className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold leading-none text-white opacity-0 shadow transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>

                  <span className="text-[9px] text-gray-500">
                    {color}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const StyleGrid = ({
  font,
  size,
  weight,
  style,
  transform,
  spacing,
  line,
}: {
  font: [string, (x: string) => void]
  size: [string, (x: string) => void]
  weight: [string, (x: string) => void]
  style: [string, (x: string) => void]
  transform: [string, (x: string) => void]
  spacing: [string, (x: string) => void]
  line: [string, (x: string) => void]
}) => (
  <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 xl:grid-cols-8">
    <Select
      l="Font"
      v={font[0]}
      s={font[1]}
      o={fonts}
    />

    <Select
      l="Master Size"
      v={size[0]}
      s={size[1]}
      o={sizes}
    />

    <Select
      l="Weight"
      v={weight[0]}
      s={weight[1]}
      o={weights}
    />

    <Select
      l="Style"
      v={style[0]}
      s={style[1]}
      o={styles}
    />

    <Select
      l="Text Case"
      v={transform[0]}
      s={transform[1]}
      o={transforms}
    />

    <Select
      l="Spacing"
      v={spacing[0]}
      s={spacing[1]}
      o={spacings}
    />

    <Select
      l="Line Height"
      v={line[0]}
      s={line[1]}
      o={lines}
    />
  </div>
)

export const config = defineRouteConfig({
  label: "Hero Banners",
})

export default HeroBannersPage