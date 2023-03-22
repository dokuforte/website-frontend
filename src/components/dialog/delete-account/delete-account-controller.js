import { Controller } from "@hotwired/stimulus"
import auth from "../../../api/auth"
import { redirectTo, getLocale } from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["content"]
  }

  show() {
    this.element.classList.add("is-visible")
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  submit() {
    auth.deleteAccount().then(() => {
      // redirectTo(`/${getLocale()}/`)
    })
  }
}
