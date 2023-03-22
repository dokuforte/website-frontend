import { Controller } from "@hotwired/stimulus"

import config from "../../../data/siteConfig"
import { lang, trigger, setPageMeta, stripTags, isElementInViewport } from "../../../js/utils"

const THUMBNAIL_HEIGHT = 160
export default class extends Controller {
  static get targets() {
    return ["image", "container", "description", "meta"]
  }

  connect() {
    // add stimulus class reference to node
    this.element.photosThumbnail = this

    // init thumbnail
    this.initThumbnail()

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

    this.element.classList.toggle(
      "img-fit-contain",
      h > this.naturalHeight && this.naturalWidth / this.naturalHeight > 16 / 9
    )
  }

  // set thumbnail meta data
  initThumbnail() {
    const data = this.element.itemData
    const metaArray = [data.year, data.addressline]
    this.metaTarget.textContent = metaArray.filter(Boolean).join(" · ")
    this.descriptionTarget.innerHTML = stripTags(data.description) || stripTags(data.addressline) || ""

    this.element.classList.add("is-visible")

    this.imageTarget.addEventListener("load", () => {
      this.naturalWidth = this.imageTarget.naturalWidth
      this.naturalHeight = this.imageTarget.naturalHeight
      this.resize()

      this.element.classList.remove("is-loading")
      this.element.classList.add("is-loaded")

      trigger("thumbnail:loaded")
    })

    this.imageTarget.addEventListener("error", () => {
      this.element.classList.remove("is-loading")
      this.element.classList.add("is-failed-loading")

      trigger("thumbnail:loaded")
    })
  }

  // load thumbnail image
  loadThumbnailImage() {
    if (
      !this.element.classList.contains("is-loaded") &&
      !this.loadInitiated &&
      isElementInViewport(this.element, false)
    ) {
      const data = this.element.itemData

      this.imageTarget.src = `${config.API_HOST}/photos/${data.photo_url_thumb_path}`

      this.element.classList.add("is-loading")
      this.loadInitiated = true
    }
  }
}
