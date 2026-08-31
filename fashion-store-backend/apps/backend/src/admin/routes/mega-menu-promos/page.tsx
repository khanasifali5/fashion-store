import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useRef, useState } from "react"
import { sdk } from "../../lib/sdk"

type MegaMenuPromo = {
  id: string
  menu_key: string
  title?: string | null
  subtitle?: string | null
  image_url: string
  object_position?: string
  image_focus_x?: number
  image_focus_y?: number
  title_font_family?: string
  title_font_style?: string
  title_text_transform?: string
  title_color?: string
  title_size?: number
  title_weight?: number
  title_letter_spacing?: number
  title_line_height?: number
  title_offset_x?: number
  title_offset_y?: number
  subtitle_font_family?: string
  subtitle_font_style?: string
  subtitle_text_transform?: string
  subtitle_color?: string
  subtitle_size?: number
  subtitle_weight?: number
  subtitle_letter_spacing?: number
  subtitle_line_height?: number
  subtitle_offset_x?: number
  subtitle_offset_y?: number
  text_align?: string
  horizontal_position?: string
  vertical_position?: string
  content_offset_x?: number
  content_offset_y?: number
  overlay_color?: string
  overlay_opacity?: number
  button_text?: string | null
  button_url?: string | null
  button_bg_color?: string
  button_text_color?: string
  button_size?: number
  button_offset_x?: number
  button_offset_y?: number
  position: number
  is_active: boolean
}

type Option = { label: string; value: string }

const FONT_OPTIONS: Option[] = [
  "Inter","Arial","Helvetica","Georgia","Times New Roman","Playfair Display",
  "Cormorant Garamond","Bodoni Moda","DM Sans","Montserrat","Poppins","Lora",
  "Raleway","Oswald","Manrope",
].map((value) => ({ label: value, value }))

const SIZE_OPTIONS: Option[] = [10,11,12,13,14,15,16,18,20,22,24,28,32,36,40,44,48]
  .map((value) => ({ label: `${value} px`, value: String(value) }))

const WEIGHT_OPTIONS: Option[] = [
  { label: "Light — 300", value: "300" }, { label: "Regular — 400", value: "400" },
  { label: "Medium — 500", value: "500" }, { label: "Semi Bold — 600", value: "600" },
  { label: "Bold — 700", value: "700" }, { label: "Extra Bold — 800", value: "800" },
  { label: "Black — 900", value: "900" },
]

const STYLE_OPTIONS: Option[] = [
  { label: "Normal", value: "normal" }, { label: "Italic", value: "italic" },
]

const TRANSFORM_OPTIONS: Option[] = [
  { label: "Normal", value: "none" }, { label: "UPPERCASE", value: "uppercase" },
  { label: "lowercase", value: "lowercase" }, { label: "Capitalize", value: "capitalize" },
]

const SPACING_OPTIONS: Option[] = [
  { label: "Tight", value: "-1" }, { label: "Normal", value: "0" },
  { label: "Slightly Wide", value: "1" }, { label: "Wide", value: "2" },
  { label: "Extra Wide", value: "4" },
]

const LINE_HEIGHT_OPTIONS: Option[] = [
  { label: "Very Tight", value: "0.9" }, { label: "Tight", value: "1" },
  { label: "Compact", value: "1.1" }, { label: "Normal", value: "1.2" },
  { label: "Relaxed", value: "1.4" }, { label: "Loose", value: "1.6" },
]

const MENU_OPTIONS: Option[] = [
  { label: "Women", value: "women" }, { label: "Girls", value: "girls" },
  { label: "Boys", value: "boys" }, { label: "Bags", value: "bags" },
  { label: "Home & Beauty", value: "home-beauty" },
]

const VERTICAL_OPTIONS: Option[] = [
  { label: "Top", value: "top" }, { label: "Center", value: "center" },
  { label: "Bottom", value: "bottom" },
]

const IMAGE_FOCUS_OPTIONS: Option[] = [
  { label: "Top", value: "top" }, { label: "Center", value: "center" },
  { label: "Bottom", value: "bottom" },
]

const ALIGN_OPTIONS: Option[] = [
  { label: "Left", value: "left" }, { label: "Center", value: "center" },
  { label: "Right", value: "right" },
]

const OVERLAY_OPTIONS: Option[] = [
  { label: "None — 0%", value: "0" }, { label: "Very Light — 5%", value: "5" },
  { label: "Light — 10%", value: "10" }, { label: "Medium — 20%", value: "20" },
  { label: "Dark — 30%", value: "30" }, { label: "Strong — 40%", value: "40" },
  { label: "Very Strong — 50%", value: "50" },
]

const DEFAULT_SWATCHES = [
  "#FFFFFF","#F8F5EF","#E8DCC8","#D9B47A","#C69C6D","#9A7651","#765633","#5F4326",
  "#000000","#222222","#666666","#B91C1C","#BE123C","#E11D48","#7E22CE","#1D4ED8",
  "#0369A1","#047857","#4D7C0F","#CA8A04",
]

const GOOGLE_FONT_FAMILIES = new Set([
  "Inter","Playfair Display","Cormorant Garamond","Bodoni Moda","DM Sans","Montserrat",
  "Poppins","Lora","Raleway","Oswald","Manrope",
])

const loadedFonts = new Set<string>()
const SAVED_COLORS_KEY = "safafi-mega-menu-promo-saved-colors"
const normalizeColor = (color: string) => color.toUpperCase()

const loadGoogleFont = (family: string) => {
  if (typeof document === "undefined" || !GOOGLE_FONT_FAMILIES.has(family) || loadedFonts.has(family)) return
  const id = `mega-menu-promo-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  if (document.getElementById(id)) {
    loadedFonts.add(family)
    return
  }
  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap`
  document.head.appendChild(link)
  loadedFonts.add(family)
}

const MegaMenuPromosPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [promos, setPromos] = useState<MegaMenuPromo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const [isDraggingPreview, setIsDraggingPreview] = useState(false)
  const previewDragOffsetRef = useRef({ x: 0, y: 0 })
  const [savedColors, setSavedColors] = useState<string[]>([])

  const [menuKey, setMenuKey] = useState("women")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [objectPosition, setObjectPosition] = useState("center")
  const [imageFocusX, setImageFocusX] = useState("50")
  const [imageFocusY, setImageFocusY] = useState("50")

  const [titleFontFamily, setTitleFontFamily] = useState("Inter")
  const [titleFontStyle, setTitleFontStyle] = useState("normal")
  const [titleTextTransform, setTitleTextTransform] = useState("none")
  const [titleColor, setTitleColor] = useState("#FFFFFF")
  const [titleSize, setTitleSize] = useState("24")
  const [titleWeight, setTitleWeight] = useState("600")
  const [titleLetterSpacing, setTitleLetterSpacing] = useState("0")
  const [titleLineHeight, setTitleLineHeight] = useState("1.1")
  const [titleOffsetX, setTitleOffsetX] = useState("0")
  const [titleOffsetY, setTitleOffsetY] = useState("0")

  const [subtitleFontFamily, setSubtitleFontFamily] = useState("Inter")
  const [subtitleFontStyle, setSubtitleFontStyle] = useState("normal")
  const [subtitleTextTransform, setSubtitleTextTransform] = useState("none")
  const [subtitleColor, setSubtitleColor] = useState("#FFFFFF")
  const [subtitleSize, setSubtitleSize] = useState("14")
  const [subtitleWeight, setSubtitleWeight] = useState("400")
  const [subtitleLetterSpacing, setSubtitleLetterSpacing] = useState("0")
  const [subtitleLineHeight, setSubtitleLineHeight] = useState("1.4")
  const [subtitleOffsetX, setSubtitleOffsetX] = useState("0")
  const [subtitleOffsetY, setSubtitleOffsetY] = useState("0")

  const [textAlign, setTextAlign] = useState("center")
  const [horizontalPosition, setHorizontalPosition] = useState("center")
  const [verticalPosition, setVerticalPosition] = useState("bottom")
  const [contentOffsetX, setContentOffsetX] = useState("0")
  const [contentOffsetY, setContentOffsetY] = useState("0")

  const [overlayColor, setOverlayColor] = useState("#000000")
  const [overlayOpacity, setOverlayOpacity] = useState("15")

  const [buttonText, setButtonText] = useState("Shop Now")
  const [buttonUrl, setButtonUrl] = useState("/")
  const [buttonBgColor, setButtonBgColor] = useState("#FFFFFF")
  const [buttonTextColor, setButtonTextColor] = useState("#000000")
  const [buttonSize, setButtonSize] = useState("12")
  const [buttonOffsetX, setButtonOffsetX] = useState("0")
  const [buttonOffsetY, setButtonOffsetY] = useState("0")

  const [position, setPosition] = useState("0")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!isDraggingPreview) return

    const handleMouseMove = (event: MouseEvent) => {
      const panelWidth = 380
      const panelHeight = 560
      const padding = 12

      const nextX = Math.min(
        Math.max(padding, event.clientX - previewDragOffsetRef.current.x),
        Math.max(padding, window.innerWidth - panelWidth - padding)
      )

      const nextY = Math.min(
        Math.max(padding, event.clientY - previewDragOffsetRef.current.y),
        Math.max(padding, window.innerHeight - panelHeight - padding)
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

  const startPreviewDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (previewExpanded) return

    const panel = event.currentTarget.closest(
      "[data-promo-preview-panel]"
    ) as HTMLElement | null

    if (!panel) return

    const rect = panel.getBoundingClientRect()

    previewDragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    setPreviewPosition({ x: rect.left, y: rect.top })
    setIsDraggingPreview(true)
  }

  const resetPreviewPosition = () => {
    setPreviewPosition({
      x: Math.max(12, window.innerWidth - 380 - 20),
      y: 96,
    })
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_COLORS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setSavedColors(parsed)
      }
    } catch (error) {
      console.error("Could not load saved promo colors:", error)
    }
  }, [])

  useEffect(() => {
    loadGoogleFont(titleFontFamily)
    loadGoogleFont(subtitleFontFamily)
  }, [titleFontFamily, subtitleFontFamily])

  const saveCustomColor = (color: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return
    const normalized = normalizeColor(color)
    if (DEFAULT_SWATCHES.some((item) => normalizeColor(item) === normalized)) return

    setSavedColors((current) => {
      if (current.some((item) => normalizeColor(item) === normalized)) return current
      const next = [...current, normalized].slice(-24)
      window.localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(next))
      return next
    })
  }

  const removeSavedColor = (color: string) => {
    setSavedColors((current) => {
      const next = current.filter((item) => normalizeColor(item) !== normalizeColor(color))
      window.localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(next))
      return next
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setMenuKey("women")
    setTitle("")
    setSubtitle("")
    setImageUrl("")
    setPreviewUrl("")
    setObjectPosition("center")
    setImageFocusX("50")
    setImageFocusY("50")

    setTitleFontFamily("Inter")
    setTitleFontStyle("normal")
    setTitleTextTransform("none")
    setTitleColor("#FFFFFF")
    setTitleSize("24")
    setTitleWeight("600")
    setTitleLetterSpacing("0")
    setTitleLineHeight("1.1")
    setTitleOffsetX("0")
    setTitleOffsetY("0")

    setSubtitleFontFamily("Inter")
    setSubtitleFontStyle("normal")
    setSubtitleTextTransform("none")
    setSubtitleColor("#FFFFFF")
    setSubtitleSize("14")
    setSubtitleWeight("400")
    setSubtitleLetterSpacing("0")
    setSubtitleLineHeight("1.4")
    setSubtitleOffsetX("0")
    setSubtitleOffsetY("0")

    setTextAlign("center")
    setHorizontalPosition("center")
    setVerticalPosition("bottom")
    setContentOffsetX("0")
    setContentOffsetY("0")

    setOverlayColor("#000000")
    setOverlayOpacity("15")

    setButtonText("Shop Now")
    setButtonUrl("/")
    setButtonBgColor("#FFFFFF")
    setButtonTextColor("#000000")
    setButtonSize("12")
    setButtonOffsetX("0")
    setButtonOffsetY("0")

    setPosition("0")
    setIsActive(true)

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const loadPromos = async () => {
    try {
      setLoading(true)
      const response = await sdk.client.fetch<{ mega_menu_promos: MegaMenuPromo[] }>(
        "/admin/mega-menu-promos",
        { method: "GET" }
      )
      setPromos(response.mega_menu_promos || [])
    } catch (error) {
      console.error("Failed to load promos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromos()
  }, [])

  const uploadPromoImage = async (file: File) => {
    const formData = new FormData()
    formData.append("files", file)

    const response = await fetch("/admin/uploads", {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    if (!response.ok) throw new Error("Image upload failed")

    const data = await response.json()
    const uploadedUrl = data.files?.[0]?.url
    if (!uploadedUrl) throw new Error("Uploaded image URL was not returned")
    return uploadedUrl as string
  }

  const handleImageFile = async (file?: File) => {
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.")
      return
    }

    try {
      setUploading(true)
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)

      const uploadedUrl = await uploadPromoImage(file)
      setImageUrl(uploadedUrl)
      setPreviewUrl(uploadedUrl)
    } catch (error) {
      console.error("Image upload failed:", error)
      alert("Image upload failed. Check backend terminal.")
      setImageUrl("")
      setPreviewUrl("")
    } finally {
      setUploading(false)
    }
  }

  const buildBody = () => ({
    menu_key: menuKey,
    title: title || null,
    subtitle: subtitle || null,
    image_url: imageUrl,
    object_position: objectPosition,
    image_focus_x: Number(imageFocusX),
    image_focus_y: Number(imageFocusY),

    title_font_family: titleFontFamily,
    title_font_style: titleFontStyle,
    title_text_transform: titleTextTransform,
    title_color: titleColor,
    title_size: Number(titleSize),
    title_weight: Number(titleWeight),
    title_letter_spacing: Number(titleLetterSpacing),
    title_line_height: Number(titleLineHeight),
    title_offset_x: Number(titleOffsetX),
    title_offset_y: Number(titleOffsetY),

    subtitle_font_family: subtitleFontFamily,
    subtitle_font_style: subtitleFontStyle,
    subtitle_text_transform: subtitleTextTransform,
    subtitle_color: subtitleColor,
    subtitle_size: Number(subtitleSize),
    subtitle_weight: Number(subtitleWeight),
    subtitle_letter_spacing: Number(subtitleLetterSpacing),
    subtitle_line_height: Number(subtitleLineHeight),
    subtitle_offset_x: Number(subtitleOffsetX),
    subtitle_offset_y: Number(subtitleOffsetY),

    text_align: textAlign,
    horizontal_position: horizontalPosition,
    vertical_position: verticalPosition,
    content_offset_x: Number(contentOffsetX),
    content_offset_y: Number(contentOffsetY),

    overlay_color: overlayColor,
    overlay_opacity: Number(overlayOpacity),

    button_text: buttonText || "Shop Now",
    button_url: buttonUrl || "/",
    button_bg_color: buttonBgColor,
    button_text_color: buttonTextColor,
    button_size: Number(buttonSize),
    button_offset_x: Number(buttonOffsetX),
    button_offset_y: Number(buttonOffsetY),

    position: Number(position) || 0,
    is_active: isActive,
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!imageUrl.trim()) {
      alert("Promo image is required.")
      return
    }

    try {
      setSaving(true)
      const body = buildBody()

      if (editingId) {
        await sdk.client.fetch(`/admin/mega-menu-promos/${editingId}`, {
          method: "POST",
          body,
        })
        alert("Promo updated successfully.")
      } else {
        await sdk.client.fetch("/admin/mega-menu-promos", {
          method: "POST",
          body,
        })
        alert("Promo created successfully.")
      }

      resetForm()
      await loadPromos()
    } catch (error) {
      console.error("Failed to save promo:", error)
      alert("Promo could not be saved. Check backend terminal.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (promo: MegaMenuPromo) => {
    setEditingId(promo.id)
    setMenuKey(promo.menu_key || "women")
    setTitle(promo.title || "")
    setSubtitle(promo.subtitle || "")
    setImageUrl(promo.image_url || "")
    setPreviewUrl(promo.image_url || "")
    setObjectPosition(promo.object_position || "center")
    setImageFocusX(String(promo.image_focus_x ?? 50))
    setImageFocusY(String(promo.image_focus_y ?? 50))

    setTitleFontFamily(promo.title_font_family || "Inter")
    setTitleFontStyle(promo.title_font_style || "normal")
    setTitleTextTransform(promo.title_text_transform || "none")
    setTitleColor(promo.title_color || "#FFFFFF")
    setTitleSize(String(promo.title_size ?? 24))
    setTitleWeight(String(promo.title_weight ?? 600))
    setTitleLetterSpacing(String(promo.title_letter_spacing ?? 0))
    setTitleLineHeight(String(promo.title_line_height ?? 1.1))
    setTitleOffsetX(String(promo.title_offset_x ?? 0))
    setTitleOffsetY(String(promo.title_offset_y ?? 0))

    setSubtitleFontFamily(promo.subtitle_font_family || "Inter")
    setSubtitleFontStyle(promo.subtitle_font_style || "normal")
    setSubtitleTextTransform(promo.subtitle_text_transform || "none")
    setSubtitleColor(promo.subtitle_color || "#FFFFFF")
    setSubtitleSize(String(promo.subtitle_size ?? 14))
    setSubtitleWeight(String(promo.subtitle_weight ?? 400))
    setSubtitleLetterSpacing(String(promo.subtitle_letter_spacing ?? 0))
    setSubtitleLineHeight(String(promo.subtitle_line_height ?? 1.4))
    setSubtitleOffsetX(String(promo.subtitle_offset_x ?? 0))
    setSubtitleOffsetY(String(promo.subtitle_offset_y ?? 0))

    setTextAlign(promo.text_align || "center")
    setHorizontalPosition(promo.horizontal_position || "center")
    setVerticalPosition(promo.vertical_position || "bottom")
    setContentOffsetX(String(promo.content_offset_x ?? 0))
    setContentOffsetY(String(promo.content_offset_y ?? 0))

    setOverlayColor(promo.overlay_color || "#000000")
    setOverlayOpacity(String(promo.overlay_opacity ?? 15))

    setButtonText(promo.button_text || "Shop Now")
    setButtonUrl(promo.button_url || "/")
    setButtonBgColor(promo.button_bg_color || "#FFFFFF")
    setButtonTextColor(promo.button_text_color || "#000000")
    setButtonSize(String(promo.button_size ?? 12))
    setButtonOffsetX(String(promo.button_offset_x ?? 0))
    setButtonOffsetY(String(promo.button_offset_y ?? 0))

    setPosition(String(promo.position ?? 0))
    setIsActive(Boolean(promo.is_active))

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (promo: MegaMenuPromo) => {
    const confirmed = window.confirm(`Delete this ${promo.menu_key} promo?`)
    if (!confirmed) return

    try {
      await sdk.client.fetch(`/admin/mega-menu-promos/${promo.id}`, {
        method: "DELETE",
      })

      if (editingId === promo.id) resetForm()
      await loadPromos()
    } catch (error) {
      console.error("Failed to delete promo:", error)
      alert("Promo could not be deleted.")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Mega Menu Promos</h1>
      <p className="mt-2 text-sm text-gray-500">
        Visual promo-card builder for storefront mega menus.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-gray-700 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Promo" : "Create Promo"}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Hover dropdown options to preview. Click an option to keep it.
            </p>
          </div>

          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm underline">
              Cancel Edit
            </button>
          )}
        </div>

        <Section title="1. Basic Settings" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <HoverSelect label="Menu" value={menuKey} onChange={setMenuKey} options={MENU_OPTIONS} />
          <NumberField label="Position / Order" value={position} onChange={setPosition} />
          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-gray-700 px-4 py-2.5">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm">
                {isActive ? "Active — show in mega menu" : "Inactive — hidden"}
              </span>
            </label>
          </div>
        </div>

        <Section title="2. Promo Image" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            handleImageFile(file)
            e.currentTarget.value = ""
          }}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleImageFile(e.dataTransfer.files?.[0])
          }}
          className="flex min-h-[230px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-500 p-5 text-center transition hover:border-gray-300 disabled:opacity-50"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Promo preview" className="max-h-[320px] w-full object-contain" />
          ) : (
            <>
              <span className="text-sm font-medium">
                {uploading ? "Uploading image..." : "Drag & drop promo image here"}
              </span>
              <span className="mt-2 text-xs text-gray-500">
                or click to choose an image
              </span>
            </>
          )}
        </button>

        {previewUrl && (
          <div className="mt-3 flex gap-4">
            <button type="button" className="text-xs underline" onClick={() => fileInputRef.current?.click()}>
              Replace Image
            </button>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => {
                setImageUrl("")
                setPreviewUrl("")
              }}
            >
              Remove Image
            </button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <HoverSelect
            label="Quick Image Focus"
            value={objectPosition}
            onChange={setObjectPosition}
            options={IMAGE_FOCUS_OPTIONS}
          />

          <RangeField
            label="Image Left / Right"
            value={imageFocusX}
            onChange={setImageFocusX}
            min={0}
            max={100}
            leftLabel="Left"
            middleLabel="Center"
            rightLabel="Right"
            suffix="%"
          />

          <RangeField
            label="Image Top / Bottom"
            value={imageFocusY}
            onChange={setImageFocusY}
            min={0}
            max={100}
            leftLabel="Top"
            middleLabel="Center"
            rightLabel="Bottom"
            suffix="%"
          />
        </div>

        <Section title="3. Content" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Eyebrow / Small Text"
            value={subtitle}
            onChange={setSubtitle}
            placeholder="NEW IN / SALE / FALL-WINTER '26"
          />
          <Field
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="JEWELLERY / PILLOW CASE"
          />
        </div>

        <Section title="4. Eyebrow Style" />
        <StyleControls
          font={[subtitleFontFamily, setSubtitleFontFamily]}
          size={[subtitleSize, setSubtitleSize]}
          weight={[subtitleWeight, setSubtitleWeight]}
          style={[subtitleFontStyle, setSubtitleFontStyle]}
          transform={[subtitleTextTransform, setSubtitleTextTransform]}
          spacing={[subtitleLetterSpacing, setSubtitleLetterSpacing]}
          lineHeight={[subtitleLineHeight, setSubtitleLineHeight]}
        />
        <div className="mt-5">
          <ColorField
            label="Eyebrow Color"
            value={subtitleColor}
            onChange={setSubtitleColor}
            savedColors={savedColors}
            saveCustomColor={saveCustomColor}
            removeSavedColor={removeSavedColor}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <RangeField
            label="Eyebrow Left / Right"
            value={subtitleOffsetX}
            onChange={setSubtitleOffsetX}
            min={-120}
            max={120}
            leftLabel="Left"
            middleLabel="Center"
            rightLabel="Right"
            suffix="px"
          />
          <RangeField
            label="Eyebrow Up / Down"
            value={subtitleOffsetY}
            onChange={setSubtitleOffsetY}
            min={-160}
            max={160}
            leftLabel="Up"
            middleLabel="Center"
            rightLabel="Down"
            suffix="px"
          />
        </div>

        <Section title="5. Title Style" />
        <StyleControls
          font={[titleFontFamily, setTitleFontFamily]}
          size={[titleSize, setTitleSize]}
          weight={[titleWeight, setTitleWeight]}
          style={[titleFontStyle, setTitleFontStyle]}
          transform={[titleTextTransform, setTitleTextTransform]}
          spacing={[titleLetterSpacing, setTitleLetterSpacing]}
          lineHeight={[titleLineHeight, setTitleLineHeight]}
        />
        <div className="mt-5">
          <ColorField
            label="Title Color"
            value={titleColor}
            onChange={setTitleColor}
            savedColors={savedColors}
            saveCustomColor={saveCustomColor}
            removeSavedColor={removeSavedColor}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <RangeField
            label="Title Left / Right"
            value={titleOffsetX}
            onChange={setTitleOffsetX}
            min={-120}
            max={120}
            leftLabel="Left"
            middleLabel="Center"
            rightLabel="Right"
            suffix="px"
          />
          <RangeField
            label="Title Up / Down"
            value={titleOffsetY}
            onChange={setTitleOffsetY}
            min={-160}
            max={160}
            leftLabel="Up"
            middleLabel="Center"
            rightLabel="Down"
            suffix="px"
          />
        </div>

        <Section title="6. Content Position" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <HoverSelect label="Vertical Position" value={verticalPosition} onChange={setVerticalPosition} options={VERTICAL_OPTIONS} />
          <HoverSelect label="Text Align" value={textAlign} onChange={setTextAlign} options={ALIGN_OPTIONS} />
          <NumberField label="Move Up / Down" value={contentOffsetY} onChange={setContentOffsetY} suffix="px" />
          <NumberField label="Fine Tune Left / Right" value={contentOffsetX} onChange={setContentOffsetX} suffix="px" />
        </div>

        <div className="mt-4">
          <RangeField
            label="Quick vertical adjustment"
            value={contentOffsetY}
            onChange={setContentOffsetY}
            min={-160}
            max={160}
          />
        </div>

        <Section title="7. Overlay" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <HoverSelect
            label="Overlay Darkness"
            value={overlayOpacity}
            onChange={setOverlayOpacity}
            options={OVERLAY_OPTIONS}
          />
          <ColorField
            label="Overlay Color"
            value={overlayColor}
            onChange={setOverlayColor}
            savedColors={savedColors}
            saveCustomColor={saveCustomColor}
            removeSavedColor={removeSavedColor}
            compact
          />
        </div>

        <Section title="8. Button" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
          <Field label="Button Text" value={buttonText} onChange={setButtonText} placeholder="Shop Now" />
          <Field label="Button URL" value={buttonUrl} onChange={setButtonUrl} placeholder="/categories/women" />
          <HoverSelect label="Button Size" value={buttonSize} onChange={setButtonSize} options={SIZE_OPTIONS} />
          <ColorField
            label="Button Background"
            value={buttonBgColor}
            onChange={setButtonBgColor}
            savedColors={savedColors}
            saveCustomColor={saveCustomColor}
            removeSavedColor={removeSavedColor}
            compact
          />
          <ColorField
            label="Button Text Color"
            value={buttonTextColor}
            onChange={setButtonTextColor}
            savedColors={savedColors}
            saveCustomColor={saveCustomColor}
            removeSavedColor={removeSavedColor}
            compact
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <RangeField
            label="Button Left / Right"
            value={buttonOffsetX}
            onChange={setButtonOffsetX}
            min={-120}
            max={120}
            leftLabel="Left"
            middleLabel="Center"
            rightLabel="Right"
            suffix="px"
          />
          <RangeField
            label="Button Up / Down"
            value={buttonOffsetY}
            onChange={setButtonOffsetY}
            min={-160}
            max={160}
            leftLabel="Up"
            middleLabel="Center"
            rightLabel="Down"
            suffix="px"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving || uploading || !imageUrl}
            className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Update Promo" : "Create Promo"}
          </button>
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
            data-promo-preview-panel
            className={`fixed z-[90] overflow-auto rounded-xl shadow-2xl transition-[width,height] duration-200 ${
              previewExpanded
                ? "bottom-5 left-[240px] right-5 top-24"
                : "w-[380px] max-w-[calc(100vw-40px)]"
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
            <div className="overflow-hidden rounded-xl border border-gray-700 bg-[#111111]">
              <div
                onMouseDown={startPreviewDrag}
                className={`flex items-center justify-between border-b border-gray-700 bg-[#151518] px-4 py-3 ${
                  previewExpanded
                    ? ""
                    : isDraggingPreview
                      ? "cursor-grabbing"
                      : "cursor-grab"
                }`}
              >
                <div className="select-none">
                  <p className="text-sm font-semibold">
                    ⋮⋮ Live Promo Preview
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Drag this header to move · Hover to preview · Click to keep
                  </p>
                </div>

                <div
                  className="flex items-center gap-2"
                  onMouseDown={(event) => event.stopPropagation()}
                >
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

              <div className={`flex items-center justify-center bg-[#0b0b0d] p-5 ${previewExpanded ? "min-h-[620px]" : "min-h-[500px]"}`}>
                <PromoPreview
                  imageUrl={previewUrl}
                  imageFocusX={imageFocusX}
                  imageFocusY={imageFocusY}
                  title={title}
                  subtitle={subtitle}
                  titleFontFamily={titleFontFamily}
                  titleFontStyle={titleFontStyle}
                  titleTextTransform={titleTextTransform}
                  titleColor={titleColor}
                  titleSize={titleSize}
                  titleWeight={titleWeight}
                  titleLetterSpacing={titleLetterSpacing}
                  titleLineHeight={titleLineHeight}
                  titleOffsetX={titleOffsetX}
                  titleOffsetY={titleOffsetY}
                  subtitleFontFamily={subtitleFontFamily}
                  subtitleFontStyle={subtitleFontStyle}
                  subtitleTextTransform={subtitleTextTransform}
                  subtitleColor={subtitleColor}
                  subtitleSize={subtitleSize}
                  subtitleWeight={subtitleWeight}
                  subtitleLetterSpacing={subtitleLetterSpacing}
                  subtitleLineHeight={subtitleLineHeight}
                  subtitleOffsetX={subtitleOffsetX}
                  subtitleOffsetY={subtitleOffsetY}
                  textAlign={textAlign}
                  horizontalPosition={horizontalPosition}
                  verticalPosition={verticalPosition}
                  contentOffsetX={contentOffsetX}
                  contentOffsetY={contentOffsetY}
                  overlayColor={overlayColor}
                  overlayOpacity={overlayOpacity}
                  buttonText={buttonText}
                  buttonBgColor={buttonBgColor}
                  buttonTextColor={buttonTextColor}
                  buttonSize={buttonSize}
                  buttonOffsetX={buttonOffsetX}
                  buttonOffsetY={buttonOffsetY}
                />
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
          Live Promo Preview
        </button>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Existing Promos</h2>

        <div className="mt-6">
          {loading ? (
            <p>Loading promos...</p>
          ) : promos.length === 0 ? (
            <p>No promos created yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {[...promos]
                .sort((a, b) => {
                  if (a.menu_key === b.menu_key) return a.position - b.position
                  return a.menu_key.localeCompare(b.menu_key)
                })
                .map((promo) => (
                  <div key={promo.id} className="flex items-center gap-4 rounded-md border border-gray-700 p-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-800">
                      {promo.image_url ? (
                        <img
                          src={promo.image_url}
                          alt={promo.title || promo.menu_key}
                          className="h-full w-full object-cover"
                          style={{ objectPosition: promo.object_position || "center" }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase text-gray-400">{promo.menu_key}</p>
                        <span className="text-xs text-gray-500">Position {promo.position}</span>
                      </div>

                      <p className="mt-1 font-medium">{promo.title || "Untitled Promo"}</p>

                      {promo.subtitle && (
                        <p className="mt-1 text-sm text-gray-400">{promo.subtitle}</p>
                      )}

                      <p className="mt-2 text-xs text-gray-500">
                        {promo.button_text || "Shop Now"} → {promo.button_url || "/"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className="text-sm">{promo.is_active ? "Active" : "Inactive"}</span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(promo)}
                          className="rounded-md border border-gray-600 px-3 py-1.5 text-xs hover:border-gray-400"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(promo)}
                          className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:border-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Section = ({ title }: { title: string }) => (
  <h3 className="mb-4 mt-8 border-t border-gray-700 pt-6 text-sm font-semibold uppercase tracking-wide">
    {title}
  </h3>
)

const Field = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) => (
  <label className="text-sm">
    {label}
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
    />
  </label>
)

const NumberField = ({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix?: string
}) => (
  <label className="text-sm">
    {label}
    <div className="relative mt-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-600 bg-transparent px-3 py-2"
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
          {suffix}
        </span>
      )}
    </div>
  </label>
)

const RangeField = ({
  label,
  value,
  onChange,
  min,
  max,
  leftLabel = "Up",
  middleLabel = "Center",
  rightLabel = "Down",
  suffix = "px",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  min: number
  max: number
  leftLabel?: string
  middleLabel?: string
  rightLabel?: string
  suffix?: string
}) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-gray-500">
        {value}{suffix}
      </span>
    </div>

    <input
      type="range"
      min={min}
      max={max}
      step={1}
      value={Number(value) || 0}
      onChange={(e) => onChange(e.target.value)}
      className="w-full"
    />

    <div className="mt-1 flex justify-between text-[10px] text-gray-500">
      <span>{leftLabel}</span>
      <span>{middleLabel}</span>
      <span>{rightLabel}</span>
    </div>
  </div>
)

const HoverSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Option[]
}) => {
  const [open, setOpen] = useState(false)
  const [committedValue, setCommittedValue] = useState(value)
  const hoveringRef = useRef(false)

  const finalOptions = options.some((option) => option.value === value)
    ? options
    : [{ label: value, value }, ...options]

  const selectedOption = finalOptions.find((option) => option.value === value) || finalOptions[0]

  useEffect(() => {
    if (!hoveringRef.current) setCommittedValue(value)
  }, [value])

  const previewOption = (nextValue: string) => {
    hoveringRef.current = true
    if (label === "Font") loadGoogleFont(nextValue)
    onChange(nextValue)
  }

  const commitOption = (nextValue: string) => {
    hoveringRef.current = false
    setCommittedValue(nextValue)
    if (label === "Font") loadGoogleFont(nextValue)
    onChange(nextValue)
    setOpen(false)
  }

  const restoreCommittedValue = () => {
    if (hoveringRef.current) {
      hoveringRef.current = false
      onChange(committedValue)
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
      <div className="mb-2">{label}</div>

      <button
        type="button"
        onClick={() => {
          restoreCommittedValue()
          setOpen((current) => !current)
        }}
        className="flex w-full items-center justify-between gap-3 rounded-md border border-gray-600 bg-[#1b1b1f] px-3 py-2 text-left text-white transition hover:border-gray-400"
        style={{ fontFamily: label === "Font" ? value : undefined }}
      >
        <span className="min-w-0 truncate">{selectedOption?.label || value}</span>
        <span className={`shrink-0 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[130] mt-1 max-h-72 min-w-full overflow-y-auto rounded-md border border-gray-600 bg-[#1b1b1f] py-1 shadow-2xl">
          {finalOptions.map((option) => {
            const isCommitted = option.value === committedValue
            const isPreviewed = option.value === value

            return (
              <button
                key={option.value}
                type="button"
                onMouseEnter={() => previewOption(option.value)}
                onFocus={() => previewOption(option.value)}
                onClick={() => commitOption(option.value)}
                className={`block w-full whitespace-nowrap px-3 py-2 text-left text-white transition ${
                  isPreviewed ? "bg-[#3a3a42]" : "hover:bg-[#2a2a30] focus:bg-[#2a2a30]"
                }`}
                style={{ fontFamily: label === "Font" ? option.value : undefined }}
              >
                <span className="flex items-center justify-between gap-6">
                  <span>{option.label}</span>
                  {isCommitted && <span className="text-xs text-gray-400">✓</span>}
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

const ColorField = ({
  label,
  value,
  onChange,
  savedColors,
  saveCustomColor,
  removeSavedColor,
  compact = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  savedColors: string[]
  saveCustomColor: (color: string) => void
  removeSavedColor: (color: string) => void
  compact?: boolean
}) => {
  const safeColor = /^#[0-9a-f]{6}$/i.test(value) ? value : "#FFFFFF"

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={safeColor}
          onChange={(e) => {
            const color = e.target.value.toUpperCase()
            onChange(color)
            saveCustomColor(color)
          }}
          className="h-10 w-14 cursor-pointer rounded border border-gray-600 bg-transparent"
        />

        {!compact &&
          DEFAULT_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => onChange(color)}
              className={`h-7 w-7 rounded-full border-2 transition ${
                normalizeColor(value) === normalizeColor(color)
                  ? "scale-110 border-white"
                  : "border-gray-600"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
      </div>

      {!compact && (
        <p className="mt-2 text-xs text-gray-500">
          Click the square for the full palette. Custom colors are saved automatically.
        </p>
      )}

      {savedColors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {savedColors.map((color) => (
            <div key={color} className="group relative">
              <button
                type="button"
                title={`Use ${color}`}
                onClick={() => onChange(color)}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  normalizeColor(value) === normalizeColor(color)
                    ? "scale-110 border-white"
                    : "border-gray-600"
                }`}
                style={{ backgroundColor: color }}
              />
              <button
                type="button"
                title={`Remove ${color}`}
                onClick={() => removeSavedColor(color)}
                className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white group-hover:flex"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const StyleControls = ({
  font,size,weight,style,transform,spacing,lineHeight,
}: {
  font: [string, (value: string) => void]
  size: [string, (value: string) => void]
  weight: [string, (value: string) => void]
  style: [string, (value: string) => void]
  transform: [string, (value: string) => void]
  spacing: [string, (value: string) => void]
  lineHeight: [string, (value: string) => void]
}) => (
  <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 xl:grid-cols-7">
    <HoverSelect label="Font" value={font[0]} onChange={font[1]} options={FONT_OPTIONS} />
    <HoverSelect label="Size" value={size[0]} onChange={size[1]} options={SIZE_OPTIONS} />
    <HoverSelect label="Weight" value={weight[0]} onChange={weight[1]} options={WEIGHT_OPTIONS} />
    <HoverSelect label="Style" value={style[0]} onChange={style[1]} options={STYLE_OPTIONS} />
    <HoverSelect label="Text Case" value={transform[0]} onChange={transform[1]} options={TRANSFORM_OPTIONS} />
    <HoverSelect label="Spacing" value={spacing[0]} onChange={spacing[1]} options={SPACING_OPTIONS} />
    <HoverSelect label="Line Height" value={lineHeight[0]} onChange={lineHeight[1]} options={LINE_HEIGHT_OPTIONS} />
  </div>
)

const PromoPreview = ({
  imageUrl,imageFocusX,imageFocusY,title,subtitle,
  titleFontFamily,titleFontStyle,titleTextTransform,titleColor,titleSize,titleWeight,titleLetterSpacing,titleLineHeight,titleOffsetX,titleOffsetY,
  subtitleFontFamily,subtitleFontStyle,subtitleTextTransform,subtitleColor,subtitleSize,subtitleWeight,subtitleLetterSpacing,subtitleLineHeight,subtitleOffsetX,subtitleOffsetY,
  textAlign,horizontalPosition,verticalPosition,contentOffsetX,contentOffsetY,
  overlayColor,overlayOpacity,buttonText,buttonBgColor,buttonTextColor,buttonSize,buttonOffsetX,buttonOffsetY,
}: {
  imageUrl: string
  imageFocusX: string
  imageFocusY: string
  title: string
  subtitle: string
  titleFontFamily: string
  titleFontStyle: string
  titleTextTransform: string
  titleColor: string
  titleSize: string
  titleWeight: string
  titleLetterSpacing: string
  titleLineHeight: string
  titleOffsetX: string
  titleOffsetY: string
  subtitleFontFamily: string
  subtitleFontStyle: string
  subtitleTextTransform: string
  subtitleColor: string
  subtitleSize: string
  subtitleWeight: string
  subtitleLetterSpacing: string
  subtitleLineHeight: string
  subtitleOffsetX: string
  subtitleOffsetY: string
  textAlign: string
  horizontalPosition: string
  verticalPosition: string
  contentOffsetX: string
  contentOffsetY: string
  overlayColor: string
  overlayOpacity: string
  buttonText: string
  buttonBgColor: string
  buttonTextColor: string
  buttonSize: string
  buttonOffsetX: string
  buttonOffsetY: string
}) => {
  const justifyContent =
    horizontalPosition === "left" ? "flex-start" :
    horizontalPosition === "right" ? "flex-end" : "center"

  const alignItems =
    verticalPosition === "top" ? "flex-start" :
    verticalPosition === "center" ? "center" : "flex-end"

  return (
    <div className="relative aspect-[3/5] w-full max-w-[320px] overflow-hidden bg-black shadow-2xl">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Live promo"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: `${Number(imageFocusX) || 50}% ${Number(imageFocusY) || 50}%`,
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-gray-500">
          Upload an image to preview your promo card.
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlayColor,
          opacity: Math.max(0, Math.min(100, Number(overlayOpacity) || 0)) / 100,
        }}
      />

      <div className="absolute inset-0 z-10 flex p-5" style={{ justifyContent, alignItems }}>
        <div
          className="w-full"
          style={{
            textAlign: textAlign as "left" | "center" | "right",
            transform: `translate(${Number(contentOffsetX) || 0}px, ${Number(contentOffsetY) || 0}px)`,
          }}
        >
          {subtitle && (
            <div
              style={{
                color: subtitleColor,
                fontFamily: subtitleFontFamily,
                fontSize: `${Number(subtitleSize) || 14}px`,
                fontWeight: Number(subtitleWeight) || 400,
                fontStyle: subtitleFontStyle,
                textTransform: subtitleTextTransform as "none" | "uppercase" | "lowercase" | "capitalize",
                letterSpacing: `${Number(subtitleLetterSpacing) || 0}px`,
                lineHeight: Number(subtitleLineHeight) || 1.4,
                transform: `translate(${Number(subtitleOffsetX) || 0}px, ${Number(subtitleOffsetY) || 0}px)`,
              }}
            >
              {subtitle}
            </div>
          )}

          {title && (
            <div
              className="mt-2"
              style={{
                color: titleColor,
                fontFamily: titleFontFamily,
                fontSize: `${Number(titleSize) || 24}px`,
                fontWeight: Number(titleWeight) || 600,
                fontStyle: titleFontStyle,
                textTransform: titleTextTransform as "none" | "uppercase" | "lowercase" | "capitalize",
                letterSpacing: `${Number(titleLetterSpacing) || 0}px`,
                lineHeight: Number(titleLineHeight) || 1.1,
                transform: `translate(${Number(titleOffsetX) || 0}px, ${Number(titleOffsetY) || 0}px)`,
              }}
            >
              {title}
            </div>
          )}

          {buttonText && (
            <div
              className="mt-5"
              style={{
                transform: `translate(${Number(buttonOffsetX) || 0}px, ${Number(buttonOffsetY) || 0}px)`,
              }}
            >
              <span
                className="inline-flex min-w-[128px] items-center justify-center px-5 py-3 font-semibold uppercase tracking-[0.08em]"
                style={{
                  backgroundColor: buttonBgColor,
                  color: buttonTextColor,
                  fontSize: `${Number(buttonSize) || 12}px`,
                }}
              >
                {buttonText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Mega Menu Promos",
})

export default MegaMenuPromosPage