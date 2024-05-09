import { Controller } from "@hotwired/stimulus"
import { trigger } from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return []
  }

  connect() {}

  remove(e) {
    if (e) e.preventDefault()

    trigger("dialogAgeRestriction:remove", this.mid)

    this.hide()
  }

  show(e) {
    this.mid = e?.detail?.photoData?.mid
    this.element.classList.add("is-visible")
  }

  hide() {
    delete this.photoData
    this.element.classList.remove("is-visible")
  }
}
