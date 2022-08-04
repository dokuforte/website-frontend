import { Controller } from "stimulus"

import config from "../../data/siteConfig"
import { getStorageParam, setStorageParam } from "../../js/utils"
import { setAppState, removeAppState } from "../../js/app"

export default class extends Controller {
  connect() {
    this.settings = getStorageParam("settings", true)
    if (!this.settings.theme) this.settings.theme = config.DEFAULT_THEME

    this.setTheme(this.settings.theme)

    document.addEventListener("theme:toggleTheme", () => {
      this.toggleTheme()
    })

    document.addEventListener("storage:changed", e => {
      if (e.detail) {
        const { settings, privacySettings } = e.detail
        if (settings) {
          this.settings = settings
        }

        if (privacySettings) {
          this.privacySettings = privacySettings
        }
      }
    })
  }

  setTheme(newTheme) {
    removeAppState(`theme--${this.settings.theme}`)
    setAppState(`theme--${newTheme}`)
    this.settings.theme = newTheme

    setStorageParam("settings", this.settings, true)
  }

  toggleTheme() {
    const newTheme = this.settings.theme === "light" ? "dark" : "light"
    this.setTheme(newTheme)
  }
}
