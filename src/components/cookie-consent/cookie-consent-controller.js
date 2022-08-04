import { Controller } from "stimulus"
import { getStorageParam, setStorageParam } from "../../js/utils"

export default class CookieConsent extends Controller {
  connect() {
    /**
     * Read session storage to get the stored values of privacy settings
     */
    this.privacySettings = getStorageParam("privacySettings")

    /**
     * Bind event listeners
     */
    document.addEventListener("cookieConsent:show", this.show.bind(this))
    document.addEventListener("cookieConsent:hide", this.hide.bind(this))

    /**
     *  Check local storage settings
     */
    if (Object.keys(this.privacySettings).length === 0) {
      // When no cookie consent related storage items are set
      setTimeout(() => {
        this.show()
      }, 100)
    } else {
      // Otherwise
      setTimeout(() => {
        setStorageParam("privacySettings", this.privacySettings)
      }, 100)
    }
  }

  /**
   * Accept all cookies
   */
  acceptAll() {
    this.privacySettings = {
      convenienceCookiesAllowed: true,
      marketingCookiesAllowed: true,
    }

    setStorageParam("privacySettings", this.privacySettings)

    this.hide()
  }

  /**
   * Decline all cookies
   */
  declineAll() {
    this.privacySettings = {
      convenienceCookiesAllowed: false,
      marketingCookiesAllowed: false,
    }

    setStorageParam("privacySettings", this.privacySettings)

    this.hide()
  }

  /** Show / hide component */
  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
  }
}
