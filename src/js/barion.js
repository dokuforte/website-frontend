const Barion = {
  init: () => {
    if (!window.bp) {
      // Create BP element on the window
      window.bp = (...args) => {
        ;(window.bp.q = window.bp.q || []).push(...args)
      }
      window.bp.l = 1 * new Date()

      // Insert a script tag on the top of the head to load bp.js
      const scriptElement = document.createElement("script")
      const firstScript = document.getElementsByTagName("script")[0]
      scriptElement.async = true
      scriptElement.src = "https://pixel.barion.com/bp.js"
      firstScript.parentNode.insertBefore(scriptElement, firstScript)
      window.barion_pixel_id = "BP-crymXHTKfS-B3"

      window.bp("init", "addBarionPixelId", window.barion_pixel_id)
    }
  },
}

// Send init event

document.addEventListener("storage:changed", (e) => {
  if (e.detail) {
    const { privacySettings } = e.detail

    if (privacySettings && privacySettings.marketingCookiesAllowed) Barion.init()
  }
})
