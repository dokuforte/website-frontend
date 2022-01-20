import { Controller } from "stimulus"

const bgIds = [1027, 1028, 1029, 1030, 1031, 1032, 1033]

export default class extends Controller {
  connect() {
    this.loadBackgroundImage()
  }

  /**
   * Load photos randomly to the container
   */
  loadBackgroundImage() {
    const img = new Image()

    const onLoad = () => {
      this.element.style.backgroundImage = `url("${img.src}")`
      this.element.classList.add("is-visible")
    }
    img.addEventListener("load", onLoad.bind(this))

    const id = bgIds[Math.floor(Math.random() * bgIds.length)]
    img.src = `/uploads/${id}.jpg`
  }
}
