import { Controller } from "@hotwired/stimulus"
import { iframeResizer } from "iframe-resizer"

import authAPI from "../../api/auth"
import { comeBackAfterSignIn, getLocale, getApiUrl } from "../../js/utils"

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
    iframe.src = `${getApiUrl()}/contribute?lang=${getLocale()}`
    this.uploadFormTarget.appendChild(iframe)

    iframeResizer({ log: true }, "#upload-form")
  }
}
