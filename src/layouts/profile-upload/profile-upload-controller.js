import { Controller } from "@hotwired/stimulus"
import { iframeResizer } from "iframe-resizer"

import authAPI from "../../api/auth"
import { comeBackAfterSignIn, getLocale, getApiUrl, getTheme } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["lead", "uploadForm"]
  }

  async connect() {
    const userData = await authAPI.querySignedInUser()
    if (userData && userData.email) {
      this.appendUploadForm()
    } else {
      comeBackAfterSignIn()
    }
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
