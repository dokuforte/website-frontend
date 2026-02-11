import { Controller } from "@hotwired/stimulus"
import { iframeResizer } from "iframe-resizer"

import authAPI from "../../api/auth.js"
import { comeBackAfterSignIn, getLocale, getApiUrl, getTheme } from "../../js/utils.js"

export default class extends Controller {
  static get targets() {
    return ["lead", "uploadForm", "login", "loginButton"]
  }

  async connect() {
    try {
      const userData = await authAPI.querySignedInUser()
      if (userData && userData.email) {
        this.appendUploadForm()
      } else {
        console.log("login")
        this.showLogin()
      }
    } catch (error) {
      this.showLogin()
    }
  }

  showLogin() {
    this.loginTarget.classList.remove("is-hidden")
    this.loginButtonTarget.addEventListener("click", () => {
      comeBackAfterSignIn(`/${getLocale()}/profile/upload`)
    })
  }

  appendUploadForm() {
    const iframe = document.createElement("iframe")
    iframe.width = "100%"
    iframe.style.border = "none"
    iframe.style.overflowX = "hidden"
    iframe.id = "upload-form"
    iframe.allowTransparency = true
    iframe.src = `${getApiUrl()}/contribute?lang=${getLocale()}&dark=${getTheme() === "dark" ? "1" : "0"}`
    this.uploadFormTarget.appendChild(iframe)

    iframeResizer({ log: true }, "#upload-form")
  }
}
