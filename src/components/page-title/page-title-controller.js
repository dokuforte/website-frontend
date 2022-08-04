import { Controller } from "stimulus"
import { setPageMeta } from "../../js/utils"

export default class extends Controller {
  connect() {
    setPageMeta(this.element.textContent)
  }
}
