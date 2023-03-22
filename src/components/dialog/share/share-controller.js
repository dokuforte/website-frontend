import { Controller } from "@hotwired/stimulus"
import { copyToClipboard, trigger } from "../../../js/utils"
import { selectedThumbnail } from "../../../js/app"
import config from "../../../data/siteConfig"

export default class extends Controller {
  show() {
    this.element.classList.add("is-visible")
    this.imageData = selectedThumbnail.itemData
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  shareLink(e) {
    e.preventDefault()

    const res = copyToClipboard(`${window.location.origin + window.location.pathname}?id=${this.imageData.id}`, "link")
    if (res) trigger("dialogShare:close")
  }

  shareOnFacebook(e) {
    e.preventDefault()
    const url = `https://www.facebook.com/dialog/share?app_id=${config.FACEBOOK_APP_ID}&href=${encodeURIComponent(
      `${window.location.origin + window.location.pathname}?id=${this.imageData.id}`
    )}`
    window.open(url, "_blank")
  }

  shareOnTwitter(e) {
    e.preventDefault()
    const url = `https://twitter.com/share?text=${encodeURIComponent(
      document.querySelector("meta[name=description]").getAttribute("content")
    )}&url=${encodeURIComponent(`${window.location.origin + window.location.pathname}?id=${this.imageData.id}`)}`
    window.open(url, "_blank")
  }

  shareByEmail(e) {
    e.preventDefault()
    const url = `mailto:?subject=${document.title}&body=${encodeURIComponent(
      document.querySelector("meta[name=description]").getAttribute("content")
    )} ${encodeURIComponent(`${window.location.origin + window.location.pathname}?id=${this.imageData.id}`)}`
    window.location.href = url
  }
}
