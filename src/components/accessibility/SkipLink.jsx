/**
 * Skip Link Component
 * Allows keyboard users to skip directly to main content
 * WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks)
 */
const SkipLink = ({ href = '#main-content', children = 'Skip to main content' }) => {
  return (
    <a
      href={href}
      className="
        sr-only
        focus:not-sr-only
        focus:absolute
        focus:top-4
        focus:left-4
        focus:z-50
        focus:px-4
        focus:py-2
        focus:bg-blue-600
        focus:text-white
        focus:rounded-md
        focus:shadow-lg
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
      "
    >
      {children}
    </a>
  )
}

export default SkipLink
