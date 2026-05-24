/** Bottom legal / fee disclosure strip from Doubao FooterLegal.vue */
export function FooterLegal() {
  return (
    <footer
      className="border-t border-white/10 bg-black/20 px-4 py-4 text-xs text-cyan-100/60 sm:px-6"
      data-testid="footer-legal"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4 font-semibold text-cyan-200/80">
          <a className="hover:text-white" href="#/">
            Terms of Service
          </a>
          <a className="hover:text-white" href="#/">
            Privacy Policy
          </a>
        </div>
        <p className="max-w-3xl leading-5">
          Fee disclosure (verify live): swap ~0.20% (platform/dividend split per ToS); order-book ~0.15% platform fee.
          Preview pages may not reflect live fee routing.
        </p>
      </div>
    </footer>
  );
}
