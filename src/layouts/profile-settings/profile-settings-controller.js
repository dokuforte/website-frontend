import { Controller } from "stimulus"
import { trigger } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["toggleDarkMode"]
  }

  connect() {}

  toggleTheme(e) {
    e.preventDefault()
    trigger("theme:toggleTheme")
  }
}
