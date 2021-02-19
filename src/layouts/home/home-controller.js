import { Controller } from "stimulus"

import searchAPI from "../../api/search"
import { numberWithCommas } from "../../js/utils"

const bgIds = [1027, 1028, 1029, 1030, 1031, 1032, 1033]

export default class extends Controller {
  static get targets() {
    return ["heroBg", "total", "totalVal"]
  }

  connect() {
    this.loadBackgroundImage()
    this.getTotalItemsNumber()
  }

  /**
   * Load photos randomly to the hero background
   */
  loadBackgroundImage() {
    const img = new Image()

    const onLoad = () => {
      this.heroBgTarget.style.backgroundImage = `url("${img.src}")`
      this.heroBgTarget.classList.add("is-visible")
    }
    img.addEventListener("load", onLoad.bind(this))

    const id = bgIds[Math.floor(Math.random() * bgIds.length)]
    img.src = `/uploads/${id}.jpg`
  }

  /**
   * Get the total number of photos and inject the result
   */
  getTotalItemsNumber() {
    searchAPI.getTotal().then(data => {
      this.totalValTarget.textContent = numberWithCommas(data.meta.total_count)
      this.totalTarget.classList.add("is-visible")
    })
  }
}
