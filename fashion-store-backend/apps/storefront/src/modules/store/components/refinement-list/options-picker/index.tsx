"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { ChevronDownMini } from "@medusajs/icons"
import clsx from "clsx"
import { useState } from "react"

type CategoryFilterOption = {
  id: string
  title: string
  values: Array<{
    id: string
    value: string
  }>
}

type OptionsPickerProps = {
  options: CategoryFilterOption[]
  selectedValueIds: string[]
  setOptionValueIds: (
    valueIds: string[]
  ) => void
}

const OptionsPicker = ({
  options,
  selectedValueIds,
  setOptionValueIds,
}: OptionsPickerProps) => {
  const [openItem, setOpenItem] =
    useState<string>("")

  if (!options.length) {
    return null
  }

  return (
    <Accordion.Root
      type="single"
      collapsible
      value={openItem}
      onValueChange={
        setOpenItem
      }
      className="w-full"
    >
      {options.map((option) => {
        const values =
          option.values ?? []

        if (!values.length) {
          return null
        }

        const selectedValues =
          values.filter((value) =>
            selectedValueIds.includes(
              value.id
            )
          )

        const selectedLabels =
          selectedValues.map(
            (value) =>
              value.value
          )

        const toggleValue = (
          valueId: string
        ) => {
          const isSelected =
            selectedValueIds.includes(
              valueId
            )

          const nextSelections =
            isSelected
              ? selectedValueIds.filter(
                  (id) =>
                    id !== valueId
                )
              : [
                  ...selectedValueIds,
                  valueId,
                ]

          setOptionValueIds(
            Array.from(
              new Set(
                nextSelections
              )
            )
          )
        }

        const isOpen =
          openItem === option.id

        return (
          <Accordion.Item
            key={option.id}
            value={option.id}
            className="border-b border-black/10"
          >
            <Accordion.Header>
              <Accordion.Trigger
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  py-5
                  text-left
                  text-[12px]
                  font-normal
                  leading-4
                  text-black
                  transition-opacity
                  hover:opacity-60
                "
              >
                <span className="min-w-0">
                  <span className="block">
                    {option.title ||
                      "Option"}
                  </span>

                  {selectedLabels.length >
                    0 && (
                    <span className="mt-0.5 block truncate text-[11px] font-normal text-black/45">
                      Selected:{" "}
                      {selectedLabels.join(
                        ", "
                      )}
                    </span>
                  )}
                </span>

                <span
                  className={clsx(
                    "ml-4 flex h-5 w-5 shrink-0 items-center justify-center text-black transition-transform duration-150",
                    {
                      "-rotate-90":
                        !isOpen,
                      "rotate-0":
                        isOpen,
                    }
                  )}
                  aria-hidden="true"
                >
                  <ChevronDownMini />
                </span>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content
              className="
                overflow-hidden
                pb-5
                data-[state=closed]:animate-accordion-close
                data-[state=open]:animate-accordion-open
              "
            >
              <div className="flex flex-wrap gap-2">
                {values.map(
                  (value) => {
                    const isSelected =
                      selectedValueIds.includes(
                        value.id
                      )

                    return (
                      <button
                        key={
                          value.id
                        }
                        type="button"
                        onClick={() =>
                          toggleValue(
                            value.id
                          )
                        }
                        className={clsx(
                          "flex min-h-[34px] min-w-[60px] items-center justify-center border bg-white px-4 py-2 text-[12px] font-normal leading-4 text-black transition-colors",
                          {
                            "border-black":
                              isSelected,
                            "border-black/15 hover:border-black/50":
                              !isSelected,
                          }
                        )}
                        aria-pressed={
                          isSelected
                        }
                      >
                        {
                          value.value
                        }
                      </button>
                    )
                  }
                )}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        )
      })}
    </Accordion.Root>
  )
}

export default OptionsPicker