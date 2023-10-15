import { Controller } from "@hotwired/stimulus"
import { trigger } from "../../../js/utils"
import photoManager from "../../../js/photo-manager"
import listManager from "../../../js/list-manager"
import { appState } from "../../../js/app"

export default class extends Controller {
  static get targets() {
    return []
  }

  connect() {}

  remove(e) {
    if (e) e.preventDefault()

    const params = {}
    if (this.mid) {
      params.mid = this.mid

      const photoData = appState("is-lists")
        ? listManager.getListPhotoById(listManager.getSelectedListId(), this.mid)
        : photoManager.getPhotoDataByID(this.mid)

      if (photoData) photoData.ageRestrictionRemoved = true
    }

    trigger("dialogAgeRestriction:remove", params)

    this.hide()
  }

  show(e) {
    this.mid = e?.detail?.mid
    this.element.classList.add("is-visible")
  }

  hide() {
    delete this.mid
    this.element.classList.remove("is-visible")
  }
}
