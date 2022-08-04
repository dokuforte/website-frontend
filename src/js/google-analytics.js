/**
 * GA Helper
 *
 * You can trigger the following events from any components
 * by using the trigger() method from utils
 *
 * trigger("analytics:trackPageview")
 * trigger("analytics:trackEvent", {eventCategory, eventAction, eventLabel})
 *
 */

const GA_MEASUREMENT_ID = "G-66H6LGGJL7"

const GA = {
  init: () => {
    // pollute window
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = false
    if (window.dataLayer) return

    window.dataLayer = []

    function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }

    gtag("js", new Date())

    gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true })

    // inject GA script to document header
    if (!document.getElementById("gtag-js")) {
      const a = document.createElement("script")
      a.id = "gtag-js"
      a.async = true
      a.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
      const s = document.getElementsByTagName("script")[0]
      s.parentNode.insertBefore(a, s)
    }
  },
  trackPageView: () => {
    if (window.dataLayer) {
      window.gtag("event", "page_view", document.location.pathname + document.location.search)
    }
  },
  trackEvent: (c, a, l) => {
    if (window.dataLayer)
      window.gtag("event", a, {
        event_category: c,
        event_label: l,
      })
  },
  disable: () => {
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = true
  },
}

/** Custom event listeners */

document.addEventListener("analytics:trackEvent", GA.trackEvent)
document.addEventListener("analytics:trackPageView", GA.trackPageView)

/** GA tracking is only allowed when users approve it with the cookie consent */
document.addEventListener("storage:changed", e => {
  if (e.detail) {
    const { privacySettings } = e.detail

    if (privacySettings && privacySettings.marketingCookiesAllowed) {
      GA.init()
    } else if (privacySettings && !privacySettings.marketingCookiesAllowed) {
      GA.disable()
    }
  }
})
