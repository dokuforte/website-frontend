import { Controller } from "@hotwired/stimulus"
import auth from "../../../api/auth.js"

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
