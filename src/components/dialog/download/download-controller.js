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

    const dialogInnerContent = await lang("dialog_download")

    this.contentTarget.innerHTML = dialogInnerContent.replace("$donor", `<br/><b>Dokuforte / ${donatedBy}</b>`)

    const a = document.createElement("a")
    a.setAttribute("download", data.id)
    a.href = `/download/${data.photo_url_web_path}`
    a.click()
  }
}
