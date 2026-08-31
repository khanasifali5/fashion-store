export const HOMEPAGE_SPACING = {
  desktop: {
    xs: 24,
    sm: 40,
    md: 56,
    lg: 72,
    xl: 96,
  },
  mobile: {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 40,
    xl: 56,
  },
} as const

export const HOMEPAGE_WIDTH = {
  contained: "mx-auto w-full max-w-[1440px] px-4 md:px-6",
  wide: "mx-auto w-full max-w-[1800px]",
  full: "w-full",
} as const