import { Controller } from "@hotwired/stimulus"
import { lang } from "../../../js/utils.js"
import config from "../../../data/siteConfig.js"

export default class extends Controller {
  static get targets() {
    return ["content"]
  }

  show() {
    this.element.classList.add("is-visible")
    this.downloadImage()
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  init(e) {
    this.photoData = e.detail.photoData
  }

  async downloadImage() {
    const donatedBy = this.photoData.donor

    this.element.classList.add("is-visible")

    const dialogInnerContent = await lang("dialog_download")

    this.contentTarget.innerHTML = dialogInnerContent.replace("$donor", `<br/><b>Dokuforte / ${donatedBy}</b>`)

    const a = document.createElement("a")
    a.href = `${config.API_HOST}/api/media/download-link/${this.photoData.photoId}`
    a.click()
  }
}
