import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SOCIAL_LINKS = {
  instagram: "#",
  facebook: "#",
  pinterest: "#",
}

const SERVICE_LINKS = [
  { label: "Customer Service", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Contact Us", href: "/contact" },
]

const SAFAFI_WORLD_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Our Story", href: "/about" },
  { label: "Stores", href: "/stores" },
  { label: "Safafi World", href: "/" },
]

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)

const FacebookIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.6 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.6-1.6h1.7V3.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2h-2.8v3h2.8v8h3.4Z" />
  </svg>
)

const PinterestIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2.8c-5 0-8.2 3.6-8.2 7.5 0 2.9 1.1 5.4 3.5 6.3.4.2.8 0 .9-.4l.4-1.6c.1-.4.1-.5-.2-.9-.7-.8-1.2-1.9-1.2-3.4 0-4 3-6.8 7-6.8 3.8 0 5.9 2.3 5.9 5.4 0 4.1-1.8 7.5-4.5 7.5-1.5 0-2.6-1.2-2.2-2.7.4-1.8 1.3-3.8 1.3-5.1 0-1.2-.6-2.2-1.9-2.2-1.5 0-2.7 1.6-2.7 3.7 0 1.3.5 2.3.5 2.3l-1.8 7.6c-.5 2.3-.1 5 .0 5.3.1.2.3.3.4.1.2-.3 2-2.5 2.6-4.8.2-.7 1-3.9 1-3.9.5 1 2 1.8 3.6 1.8 4.7 0 7.9-4.3 7.9-10C24.2 6.2 19.5 2.8 12 2.8Z" />
  </svg>
)

export default async function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="w-full border-t border-black/10 bg-white text-black"
      style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* SERVICE STRIP */}
      <div className="border-b border-black/10 bg-[#f7f4ef]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex min-h-[100px] flex-col items-center justify-center gap-3 border-b border-black/10 px-6 text-center md:border-b-0 md:border-r">
            <span
              aria-hidden="true"
              className="text-[20px] leading-none text-[#A97838]"
            >
              ◇
            </span>

            <span className="text-[12px] font-normal leading-[1.4]">
              The official Safafi store
            </span>
          </div>

          <div className="flex min-h-[100px] flex-col items-center justify-center gap-3 px-6 text-center">
            <span
              aria-hidden="true"
              className="text-[20px] leading-none text-[#A97838]"
            >
              □
            </span>

            <span className="text-[12px] font-normal leading-[1.4]">
              Easy self-service returns
            </span>
          </div>
        </div>
      </div>

      {/* MAIN FOOTER */}
      <div className="px-5 py-12 md:px-8 md:py-16">
        <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-20">
          {/* SERVICE */}
          <section>
            <h2 className="mb-6 text-[12px] font-medium uppercase tracking-[0.02em]">
              Service
            </h2>

            <ul className="space-y-3 text-[12px] font-normal leading-[1.5]">
              {SERVICE_LINKS.map((item) => (
                <li key={item.label}>
                  <LocalizedClientLink
                    href={item.href}
                    className="transition-opacity hover:opacity-50"
                  >
                    {item.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </section>

          {/* SAFAFI WORLD */}
          <section>
            <h2 className="mb-6 text-[12px] font-medium uppercase tracking-[0.02em]">
              Safafi World
            </h2>

            <ul className="space-y-3 text-[12px] font-normal leading-[1.5]">
              {SAFAFI_WORLD_LINKS.map((item) => (
                <li key={item.label}>
                  <LocalizedClientLink
                    href={item.href}
                    className="transition-opacity hover:opacity-50"
                  >
                    {item.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </section>

          {/* FOLLOW US */}
          <section>
            <h2 className="mb-6 text-[12px] font-medium uppercase tracking-[0.02em]">
              Follow Us
            </h2>

            <p className="mb-5 max-w-[360px] text-[12px] font-normal leading-[1.6] text-black/75">
              Subscribe to our newsletter for new arrivals, private releases and
              Safafi updates.
            </p>

            <form action="#" className="flex max-w-[380px] items-stretch">
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                aria-label="Email address"
                className="min-w-0 flex-1 border border-black/20 bg-white px-4 py-3 text-[12px] font-normal outline-none transition-colors placeholder:text-black/40 focus:border-black"
              />

              <button
                type="submit"
                className="shrink-0 border border-l-0 border-black bg-black px-5 text-[12px] font-normal uppercase tracking-[0.04em] text-white transition-opacity hover:opacity-80"
              >
                Sign Up
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <a
                href={SOCIAL_LINKS.instagram}
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#A97838] text-[#A97838] transition-colors duration-200 hover:bg-[#A97838] hover:text-white"
              >
                <InstagramIcon />
              </a>

              <a
                href={SOCIAL_LINKS.facebook}
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#A97838] text-[#A97838] transition-colors duration-200 hover:bg-[#A97838] hover:text-white"
              >
                <FacebookIcon />
              </a>

              <a
                href={SOCIAL_LINKS.pinterest}
                aria-label="Pinterest"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#A97838] text-[#A97838] transition-colors duration-200 hover:bg-[#A97838] hover:text-white"
              >
                <PinterestIcon />
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-black/10 px-5 py-5 md:px-8">
        <div className="flex flex-col gap-5 text-[11px] font-normal leading-[1.4] text-black/65 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {currentYear} SAFAFI</span>

            <LocalizedClientLink
              href="/terms"
              className="transition-colors hover:text-black"
            >
              Terms
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/privacy"
              className="transition-colors hover:text-black"
            >
              Privacy
            </LocalizedClientLink>
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="Accepted payment methods"
          >
            {["Visa", "Mastercard", "PayPal", "UPI"].map((method) => (
              <span
                key={method}
                className="border border-black/10 px-2.5 py-1.5 text-[10px] text-black/55"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}