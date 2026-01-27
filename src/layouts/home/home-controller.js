import { Controller } from "@hotwired/stimulus"

import searchAPI from "../../api/search.js"
import { numberWithCommas, setPageMeta } from "../../js/utils.js"

export default class extends Controller {
  static get targets() {
    return ["total", "totalVal"]
  }

  connect() {
    this.getTotalItemsNumber()
    setPageMeta()
  }

  /**
   * Get the total number of photos and inject the result
   */
  getTotalItemsNumber() {
    searchAPI.getTotal().then((data) => {
      this.totalValTarget.textContent = numberWithCommas(data.total)
      this.totalTarget.classList.add("is-visible")
    })
  }
}
