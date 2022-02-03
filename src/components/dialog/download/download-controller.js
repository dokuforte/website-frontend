import { Controller } from "stimulus"
import config from "../../../data/siteConfig"
import { lang } from "../../../js/utils"
import { selectedThumbnail } from "../../../js/app"

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

  async downloadImage() {
    const data = selectedThumbnail.itemData

    const donatedBy = data.donated_by.map(donator => donator.name).join(",")

    this.element.classList.add("is-visible")

    this.contentTarget.innerHTML = await lang("dialog_download").replace(
      "$donor",
      `<br/><b>Dokuforte / ${donatedBy}</b>`
    )

    const a = document.createElement("a")
    a.setAttribute("download", data.id)
    a.href = `${config.API_HOST}/assets/${data.photo_full}?key=full`
    a.click()
  }
}
