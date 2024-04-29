import { Controller } from "@hotwired/stimulus"
import { iframeResizer } from "iframe-resizer"
import { getLocale, getApiUrl, getTheme } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["donateIframeWrapper"]
  }

  connect() {
    this.appendDonateForm()
  }

  appendDonateForm() {
    const iframe = document.createElement("iframe")
    iframe.width = "100%"
    iframe.style.border = "none"
    iframe.style.overflowX = "hidden"
    iframe.id = "donate-form"
    iframe.allowTransparency = true
    iframe.src = `${getApiUrl()}/donations/donate?lang=${getLocale()}&dark=${getTheme() === "dark" ? "1" : "0"}`
    this.donateIframeWrapperTarget.appendChild(iframe)

    iframeResizer({ log: true }, "#donate-form")
  }
}
