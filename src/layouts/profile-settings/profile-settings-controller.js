import { Controller } from "@hotwired/stimulus"
import { trigger, getStorageParam, setStorageParam } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["toggleDarkTheme", "toggleMarketingCookies", "toggleConvenienceCookies"]
  }

  connect() {
    // Privacy related storage management
    this.privacySettings = getStorageParam("privacySettings")

    this.settings = getStorageParam("settings", true)

    // Toggle privacy setting states based on storage values
    document.addEventListener("storage:changed", e => {
      if (e.detail) {
        const { privacySettings, settings } = e.detail
        if (privacySettings) {
          this.privacySettings = privacySettings
        }

        if (settings) {
          this.settings = settings
        }

        this.setToggleStates()
      }
    })

    this.setToggleStates()
  }

  setToggleStates() {
    this.toggleDarkThemeTarget.classList.toggle("is-on", this.settings.theme === "dark")

    this.toggleMarketingCookiesTarget.classList.toggle("is-on", this.privacySettings.marketingCookiesAllowed === true)

    this.toggleConvenienceCookiesTarget.classList.toggle(
      "is-on",
      this.privacySettings.convenienceCookiesAllowed === true
    )
  }

  toggleTheme(e) {
    e.preventDefault()
    trigger("theme:toggleTheme")
  }

  toggleMarketingCookies(e) {
    e.preventDefault()
    this.privacySettings.marketingCookiesAllowed = !this.privacySettings.marketingCookiesAllowed
    setStorageParam("privacySettings", this.privacySettings)
  }

  toggleConvenienceCookies(e) {
    e.preventDefault()
    this.privacySettings.convenienceCookiesAllowed = !this.privacySettings.convenienceCookiesAllowed
    setStorageParam("privacySettings", this.privacySettings)
  }
}
