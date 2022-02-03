import { Controller } from "stimulus"

import config from "../../../data/siteConfig"
import { lang, trigger, setPageMeta, stripTags } from "../../../js/utils"

const THUMBNAIL_HEIGHT = 160
export default class extends Controller {
  static get targets() {
    return ["image", "container", "description", "meta"]
  }

  connect() {
    // add stimulus class reference to node
    this.element.photosThumbnail = this

    // apply element data
    this.applyThumbnailData()

    // load thumbnail image
    this.loadThumbnailImage()
  }

  async clicked() {
    const data = this.element.itemData

    // select thumbnail in photos list
    trigger("photos:selectThumbnail", { node: this.element })

    // Load photo in Carousel
    trigger("photosCarousel:showPhoto")

    // set html page meta for social sharing
    setPageMeta(
      `#${data.id}`,
      `${data.title ? `${data.title} — ` : ""}${await lang("donor")}: ${data.donor} (${data.year})`,
      `${config.PHOTO_SOURCE}${data.mid}.jpg`
    )
  }

  // resize thumbnail when the browser window gets resized
  resize() {
    const h = window.innerWidth < 640 ? (THUMBNAIL_HEIGHT * 2) / 3 : THUMBNAIL_HEIGHT
    if (!this.naturalWidth) return
    this.containerTarget.style.height = `${h}px`
    const w = Math.min(240, (this.naturalWidth / this.naturalHeight) * h)
    this.element.style.flex = `${w}`
    this.element.style.minWidth = `${w}px`
  }

  show() {
    this.element.classList.remove("is-hidden")
    setTimeout(() => {
      this.element.classList.add("is-visible")
    }, 100)
  }

  // set thumbnail meta data
  applyThumbnailData() {
    const data = this.element.itemData
    const metaArray = [data.year, data.addressline.trim() !== "" ? data.addressline.trim() : null]
    this.metaTarget.textContent = metaArray.filter(Boolean).join(" · ")
    this.descriptionTarget.innerHTML = stripTags(data.title) || stripTags(data.description) || ""
  }

  // load thumbnail image
  loadThumbnailImage() {
    const data = this.element.itemData

    this.imageTarget.addEventListener("load", () => {
      this.naturalWidth = this.imageTarget.naturalWidth
      this.naturalHeight = this.imageTarget.naturalHeight
      this.resize()

      this.element.classList.add("is-loaded")
    })

    this.imageTarget.addEventListener("error", () => {
      this.element.classList.add("is-failed-loading")
    })

    this.imageTarget.src = `${config.API_HOST}/assets/${data.photo_full}?key=thumb`
    this.imageTarget.src.replace(".tiff", ".png")
  }
}
