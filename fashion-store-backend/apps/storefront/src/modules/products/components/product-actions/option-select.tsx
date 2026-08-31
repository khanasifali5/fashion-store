import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (optionId: string, value: string) => void
  previewOption?: (optionId: string, value: string) => void
  restorePreview?: (optionId: string) => void
  swatchImages?: Record<string, string>
  optionAvailability?: Record<string, boolean>
  title: string
  disabled: boolean
  "data-testid"?: string
}

const FALLBACK_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#c32032",
  blue: "#2f5f9f",
  navy: "#1d2b44",
  green: "#47735a",
  olive: "#77784c",
  beige: "#d8c8aa",
  cream: "#f3ecdf",
  ivory: "#f6f1e8",
  brown: "#725039",
  grey: "#868686",
  gray: "#868686",
  charcoal: "#414141",
  pink: "#d89aaa",
  purple: "#755486",
  orange: "#d97932",
  yellow: "#e1c745",
  burgundy: "#74263a",
  maroon: "#6b2332",
  teal: "#397878",
  khaki: "#b2a474",
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  previewOption,
  restorePreview,
  swatchImages = {},
  optionAvailability = {},
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const values = (option.values ?? []).map((item) => item.value)
  const normalizedTitle = title.trim().toLowerCase()
  const isSize = normalizedTitle === "size"
  const isColor =
    normalizedTitle === "color" ||
    normalizedTitle === "colour"

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px] font-medium text-[#2a211d]">
          {isSize
            ? "Size"
            : isColor
              ? `Colour${current ? `: ${current}` : ""}`
              : title}
        </span>

        {isSize && (
          <button
            type="button"
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#2a211d] underline underline-offset-2"
          >
            Size Guide
          </button>
        )}
      </div>

      <div
        className={clx("flex flex-wrap items-center", {
          "gap-2.5": isColor,
          "gap-2": !isColor,
        })}
        data-testid={dataTestId}
        onPointerLeave={
          isColor
            ? () => restorePreview?.(option.id)
            : undefined
        }
      >
        {values.map((value) => {
          const selected = value === current
          const available =
            optionAvailability[value] !== false

          if (isColor) {
            const imageUrl = swatchImages[value]
            const fallbackColor =
              FALLBACK_COLORS[
                value.trim().toLowerCase()
              ] || "#d9d9d9"

            return (
              <button
                type="button"
                key={value}
                disabled={disabled}
                data-testid="option-button"
                title={value}
                aria-label={`Color ${value}`}
                onPointerEnter={() =>
                  previewOption?.(option.id, value)
                }
                onFocus={() =>
                  previewOption?.(option.id, value)
                }
                onBlur={() =>
                  restorePreview?.(option.id)
                }
                onClick={() =>
                  updateOption(option.id, value)
                }
                className={clx(
                  "relative h-[66px] w-[52px] overflow-hidden border bg-[#f6f3ef] transition disabled:cursor-not-allowed disabled:opacity-40",
                  {
                    "border-[#241c18]": selected,
                    "border-black/10 hover:border-black/40":
                      !selected,
                  }
                )}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    draggable={false}
                    loading="eager"
                    decoding="async"
                    className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-top"
                  />
                ) : (
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundColor: fallbackColor,
                    }}
                  />
                )}

                <span className="sr-only">{value}</span>
              </button>
            )
          }

          if (isSize) {
            return (
              <button
                type="button"
                key={value}
                disabled={disabled || !available}
                aria-disabled={disabled || !available}
                data-testid="option-button"
                title={
                  !available
                    ? `${value} - Out of stock`
                    : value
                }
                onClick={() => {
                  if (available) {
                    updateOption(option.id, value)
                  }
                }}
                className={clx(
                  "relative flex h-[48px] min-w-[58px] items-center justify-center border px-4 text-[12px] font-medium transition",
                  {
                    "border-[#241c18] bg-white text-[#241c18]":
                      selected && available,
                    "border-black/15 bg-white text-[#241c18] hover:border-black/50":
                      !selected && available,
                    "cursor-not-allowed border-black/10 bg-[#faf9f7] text-[#aaa49e] line-through decoration-[#8d8883] decoration-[1px]":
                      !available,
                    "disabled:opacity-100": !available,
                  }
                )}
              >
                {value}
              </button>
            )
          }

          return (
            <button
              type="button"
              key={value}
              disabled={disabled}
              data-testid="option-button"
              onClick={() =>
                updateOption(option.id, value)
              }
              className={clx(
                "min-w-10 border border-black/15 bg-white px-3 py-2 text-[11px] transition",
                {
                  "border-black": selected,
                }
              )}
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect