import { Controller } from "@hotwired/stimulus"

import config from "../../data/siteConfig"
import { trigger, isTouchDevice, getImgAltText, getLocale, photoRes } from "../../js/utils"
import { setAppState, removeAppState, appState } from "../../js/app"

export default class extends Controller {
  static get targets() {
    return ["background", "pagerPrev", "pagerNext", "photo", "photos", "photosContainer"]
  }

  connect() {
    // role defines if the thumbnail is loaded on the photos page or on the lists page
    // possible values (strict): [ lists | photos (default) ]
    this.role = appState("is-lists") ? "lists" : "photos"

    this.slideshowTimeout = 0
    this.touchTimeout = 0

    this.photoData = null

    this.prevPhotoId = null
    this.nextPhotoId = null

    if (isTouchDevice()) setAppState("is-touch-device")
  }

  show() {
    this.showControls(null, true)

    if (window.innerWidth < 768)
      setTimeout(() => {
        trigger("carouselSidebar:hide")
      }, 300)
    this.element.classList.add("is-visible")
  }

  hide(e) {
    // hide all photos
    this.hideAllPhotos()

    // hide dialogs
    trigger("dialogs:hide")

    // hide carousel
    this.element.classList.remove("is-visible")
  }

  stepSlideshow() {
    // step slideshow after some delay if slideshow is playing
    if (this.slideshowIsPlaying) {
      clearTimeout(this.slideshowTimeout)
      this.slideshowTimeout = setTimeout(() => {
        this.showNextPhoto()
      }, config.CAROUSEL_SLIDESHOW_DELAY)
    }
  }

  setCarouselBackground() {
    const photoId = this.photoData.photoId

    this.backgroundTarget.style.backgroundImage = photoRes(240, photoId)
    this.backgroundTarget.classList.remove("fade-in")
    setTimeout(() => {
      this.backgroundTarget.classList.add("fade-in")
    }, 20)
  }

  loadPhoto() {
    const mid = this.photoData.mid
    const photoId = this.photoData.photoId

    let photo = this.element.querySelector(`#Dokuforte-${mid}`)

    if (!photo) {
      photo = document.createElement("div")
      photo.dataset.controller = "image-loader"
      photo.setAttribute("data-carousel-target", "photo")
      photo.dataset.action = "mouseup->carousel#onPhotoClick touchstart->carousel#onPhotoClick"
      photo.className = "image-loader carousel__photo"
      photo.id = `Dokuforte-${mid}`
      photo.mid = mid
      photo.photoId = photoId
      photo.altText = getImgAltText(this.photoData)

      // age-restriction
      if (
        !this.photoData.ageRestrictionRemoved &&
        this.photoData.tags &&
        this.photoData.tags.indexOf(config.AGE_RESTRICTION_TAG) > -1
      ) {
        photo.noImage = true
        photo.ageRestricted = true
        photo.classList.add("image-loader--no-image", "image-loader--age-restricted")

        const el = document.getElementById("age-restriction-template").content.firstElementChild.cloneNode(true)
        el.querySelector(".age-restriction__link").dataset.action = "click->carousel#showAgeRestrictionDialog"

        photo.appendChild(el)
      }

      photo.loadCallback = () => {
        trigger("loader:hide", { id: "loaderCarousel" })
        photo.classList.add("is-loaded")
        this.stepSlideshow()
      }

      this.photosTarget.appendChild(photo)
    }

    photo.classList.add("is-active")

    if (photo.imageLoaded || photo.noImage) {
      trigger("loader:hide", { id: "loaderCarousel" })
      this.stepSlideshow()

      if (photo.ageRestricted && !this.slideshowIsPlaying) {
        // open age restriction dialog
        trigger("dialogAgeRestriction:show", { mid: mid })
      }
    } else {
      trigger("loader:show", { id: "loaderCarousel" })
      photo.imageSrc = photoRes("large", photo.photoId)
      if (photo.imageLoader) photo.imageLoader.loadImage()
    }
  }

  setPagers() {
    // this.pagerPrevTarget.href = `/${getLocale()}/photos/?id=${this.prevPhotoId}`
    // this.pagerNextTarget.href = `/${getLocale()}/photos/?id=${this.nextPhotoId}`

    this.pagerPrevTarget.classList.remove("is-disabled")
    this.pagerNextTarget.classList.remove("is-disabled")
    // this.pagerPrevTarget.classList.toggle("is-disabled", !this.prevPhotoId)
    // this.pagerNextTarget.classList.toggle("is-disabled", !this.nextPhotoId)
  }

  async showPhoto(e, photoData) {
    const data = (e && e.detail && e.detail.photoData) || photoData

    if (data) {
      this.photoData = data

      const mid = this.photoData.mid

      if (!this.element.classList.contains("is-visible")) this.show()

      this.hideAllPhotos()
      this.hideLargePhotoView()

      trigger("loader:show", { id: "loaderCarousel" })

      // get the next and previous photo id for SEO
      // in the case of photos this will also triggering the load the previous and the next 40 photo data if needed
      // and will cause to fill the photo list in the background too
      // this.prevPhotoId = await getPrevPhotoId()
      // this.nextPhotoId = await getNextPhotoId()

      trigger("loader:hide", { id: "loaderCarousel" })

      this.setCarouselBackground()
      this.loadPhoto()
      this.setPagers()

      trigger("carouselSidebar:init", { photoData: this.photoData })
      trigger("dialogDownload:init", { photoData: this.photoData })
      trigger("dialogShare:init", { mid: this.photoData.mid })
    }
  }

  showNextPhoto(e) {
    if (e) e.preventDefault()

    // hide dialogs
    trigger("dialogs:hide")

    // select the next thumbnail in the current context
    trigger("photos:selectNextThumbnail")
  }

  showPrevPhoto(e) {
    if (e) e.preventDefault()

    // hide dialogs
    trigger("dialogs:hide")

    // select the previous thumbnail in the current context
    trigger("photos:selectPreviousThumbnail")
  }

  hideAllPhotos() {
    this.photoTargets.forEach((photo) => {
      photo.classList.remove("is-active")
    })
  }

  get slideshowIsPlaying() {
    return appState("play-carousel-slideshow")
  }

  playSlideshow() {
    setAppState("play-carousel-slideshow")
    // start slideshow
    this.slideshowTimeout = setTimeout(() => {
      this.showNextPhoto()
    }, config.CAROUSEL_SLIDESHOW_DELAY)

    this.wasFullScreen = appState("carousel-fullscreen")

    this.openFullscreen()
  }

  pauseSlideshow() {
    removeAppState("play-carousel-slideshow")
    clearTimeout(this.slideshowTimeout)

    if (!this.wasFullScreen) this.closeFullscreen()
  }

  toggleSlideshow() {
    if (this.slideshowIsPlaying) {
      this.pauseSlideshow()
    } else {
      this.playSlideshow()
    }
  }

  toggleSidebar() {
    trigger("carouselSidebar:toggle")
  }

  get isFullscreen() {
    return appState("carousel-fullscreen")
  }

  openFullscreen() {
    setAppState("carousel-fullscreen")

    // store sidebar visibility
    this.sidebarWasHidden = appState("hide-carousel-sidebar")

    // close sidebar
    trigger("carouselSidebar:hide")

    // hide controls
    this.autoHideControls()
  }

  closeFullscreen() {
    removeAppState("carousel-fullscreen")

    // show controls
    this.showControls(null, true)

    if (!this.sidebarWasHidden) trigger("carouselSidebar:show")
    if (this.isPhotoZoomedIn) this.hideLargePhotoView()
  }

  toggleFullscreen() {
    if (this.isPhotoZoomedIn) {
      this.hideLargePhotoView()
    } else if (this.isFullscreen) {
      if (this.slideshowIsPlaying) this.pauseSlideshow()
      if (this.isFullscreen) this.closeFullscreen()
    } else {
      this.openFullscreen()
    }
  }

  isMouseRightOverControls(e) {
    if (e && (e.touches || (e.pageX && e.pageY))) {
      const targets = this.photosContainerTarget.querySelectorAll(".button-circular")
      const page = {
        x: e.touches ? e.touches[0].pageX : e.pageX,
        y: e.touches ? e.touches[0].pageY : e.pageY,
      }
      let overlap = false

      // check if mouse is over _any_ of the targets
      targets.forEach((item) => {
        if (!overlap) {
          const bounds = item.getBoundingClientRect()
          if (page.x >= bounds.left && page.x <= bounds.right && page.y >= bounds.top && page.y <= bounds.bottom) {
            overlap = true
          }
        }
      })
      return overlap
    }
    return false
  }

  showControls(e, force = false) {
    if (this.element.classList.contains("is-visible") || force) {
      this.photosContainerTarget.classList.remove("hide-controls")

      clearTimeout(this.touchTimeout)

      if (!e || (e && !this.isMouseRightOverControls(e))) {
        this.touchTimeout = setTimeout(this.hideControls.bind(this), 4000)
      }
    }
  }

  hideControls(e, force = false) {
    if (this.element.classList.contains("is-visible") || force) {
      this.photosContainerTarget.classList.add("hide-controls")
    }
  }

  autoHideControls() {
    if (this.element.classList.contains("is-visible")) {
      this.showControls()
      clearTimeout(this.touchTimeout)
      this.touchTimeout = setTimeout(this.hideControls.bind(this), 2000)
    }
  }

  get isPhotoZoomedIn() {
    return appState("carousel-photo-zoomed-in")
  }

  showLargePhotoView(e) {
    if (e) e.preventDefault()

    const photo = this.photosTarget.querySelector(".image-loader.is-active.is-loaded")

    if (!photo.noImage) {
      setAppState("carousel-photo-zoomed-in")
      setAppState("disable--selection")

      if (this.slideshowIsPlaying) this.pauseSlideshow()

      photo.classList.add("is-zoomed-in")

      if (!photo.largePhoto) {
        const container = document.createElement("div")
        container.dataset.controller = "image-loader"
        container.className = "large-image-loader"
        container.altText = photo.altText

        photo.appendChild(container)
        photo.largePhoto = container
      }

      if (!photo.largePhoto.imageLoaded) {
        trigger("loader:show", { id: "loaderCarousel" })

        photo.largePhoto.imageSrc = photoRes("large", photo.photoId)

        photo.largePhoto.loadCallback = () => {
          photo.classList.add("large-photo-loaded")
          trigger("loader:hide", { id: "loaderCarousel" })
          this.setLargePhotoPosition()
        }

        photo.largePhoto.classList.add("is-active")
      } else {
        trigger("loader:hide", { id: "loaderCarousel" })
        this.setLargePhotoPosition()
      }
    }
  }

  hideLargePhotoView(e) {
    if (e) e.preventDefault()
    removeAppState("carousel-photo-zoomed-in")
    removeAppState("disable--selection")

    this.photoTargets.forEach((photo) => {
      photo.classList.remove("is-zoomed-in")
      if (photo.largePhoto) {
        photo.largePhoto.removeAttribute("style")
      }
    })

    trigger("loader:hide", { id: "loaderCarousel" })
    this.showControls(null, true)
  }

  toggleLargePhotoView() {
    if (this.isPhotoZoomedIn) {
      this.hideLargePhotoView()
    } else {
      this.showLargePhotoView()
    }
  }

  setLargePhotoPosition(e) {
    if (e) {
      if (isTouchDevice()) {
        return
      }
      e.preventDefault()
    }

    const photo = this.photosTarget.querySelector(".image-loader.is-active.is-loaded.is-zoomed-in")

    if (photo && photo.largePhoto && photo.largePhoto.imageLoaded) {
      const bounds = photo.getBoundingClientRect()
      bounds.centerX = bounds.left + bounds.width / 2
      bounds.centerY = bounds.top + bounds.height / 2

      if (isTouchDevice()) {
        const img = {
          width: photo.largePhoto.querySelector("img").offsetWidth,
          height: photo.largePhoto.querySelector("img").offsetHeight,
        }

        photo.largePhoto.scrollTo((img.width - bounds.width) / 2, (img.height - bounds.height) / 2)
      } else {
        const m = {}
        if (e) {
          m.x = e.touches ? e.touches[0].pageX : e.pageX
          m.y = e.touches ? e.touches[0].pageY : e.pageY
        } else {
          m.x = bounds.centerX
          m.y = bounds.centerY
        }

        const img = {
          width: photo.largePhoto.offsetWidth,
          height: photo.largePhoto.offsetHeight,
        }

        photo.largePhoto.style.left = `${(bounds.width - img.width) / 2}px`
        photo.largePhoto.style.top = `${(bounds.height - img.height) / 2}px`

        const translateX =
          img.width > bounds.width
            ? ((bounds.centerX - m.x) / (bounds.width / 2)) * ((img.width - bounds.width) / img.width) * 50
            : 0
        const translateY =
          img.height > bounds.height
            ? ((bounds.centerY - m.y) / (bounds.height / 2)) * ((img.height - bounds.height) / img.height) * 50
            : 0

        photo.largePhoto.style.transform = `translate(${translateX}%, ${translateY}%)`
      }
    }
  }

  onPhotoClick(e) {
    if (e && e.currentTarget && e.currentTarget.classList.contains("image-loader--no-image")) return

    if (isTouchDevice()) {
      // only listen to touch events on touch devices (no mouseup should fire the following)
      if (e && e.type === "touchstart") {
        // if controls are hidden, on mobile the first touch should open the controls
        // (event listener is on photosContainer)
        if (!this.photosContainerTarget.classList.contains("hide-controls")) {
          if (!this.isFullscreen) {
            this.openFullscreen()
          } else {
            this.closeFullscreen()
          }

          // else if (!this.isPhotoZoomedIn) {
          // this.showLargePhotoView()
          // }
        }
      }
    } else if (!this.isFullscreen) {
      this.openFullscreen()
    } else {
      this.toggleLargePhotoView()
    }
  }

  onCloseClicked() {
    if (this.isPhotoZoomedIn) {
      this.hideLargePhotoView()
    } else if (this.slideshowIsPlaying || this.isFullscreen) {
      // pause slideshow if the slideshow is playing & close the fullscreen state if we are in fullscreen
      if (this.slideshowIsPlaying) this.pauseSlideshow()
      if (this.isFullscreen) this.closeFullscreen()
    } else {
      this.hide()
    }
  }

  // bind key events
  boundKeydownListener(e) {
    // if carousel is not visible then keyboard actions shouldn't work
    if (!this.element.classList.contains("is-visible")) return

    // if an input is in focused state, keyboard actions shouldn't work
    const { activeElement } = document
    const inputs = ["input", "select", "button", "textarea"]
    if (activeElement && inputs.indexOf(activeElement.tagName.toLowerCase()) !== -1) return

    switch (e.key) {
      case "Escape":
        this.onCloseClicked()
        break
      case " ":
        this.toggleSlideshow()
        break
      case "ArrowLeft":
        this.showPrevPhoto()
        break
      case "ArrowRight":
        this.showNextPhoto()
        break
      default:
    }
  }

  isPhotoAvailable() {
    if (
      this.photoData &&
      this.photoData.ageRestrictionRemoved &&
      this.photoData.tags &&
      this.photoData.tags.indexOf(config.AGE_RESTRICTION_TAG) > -1
    ) {
      return false
    }

    return true
  }

  addToList() {
    if (this.isPhotoAvailable()) {
      trigger("dialogLists:show")
    }
  }

  downloadImage() {
    if (this.isPhotoAvailable()) {
      trigger("dialogDownload:show")
    }
  }

  shareImage() {
    if (this.isPhotoAvailable()) {
      trigger("dialogShare:show", { mid: this.photoData.mid })
    }
  }

  showAgeRestrictionDialog(e) {
    if (e) e.preventDefault()

    trigger("dialogAgeRestriction:show", { mid: this.photoData.mid })
  }

  removeAgeRestriction(e) {
    this.photoTargets.forEach((photo) => {
      if (photo.noImage && photo.ageRestricted && e?.detail?.mid === photo.mid) {
        delete photo.noImage
        delete photo.ageRestricted

        photo.classList.remove("image-loader--no-image", "image-loader--age-restricted")
        photo.querySelector(".age-restriction").remove()

        if (photo.classList.contains("is-active")) {
          this.showPhoto(null, photo.mid)
        }
      }
    })
  }
}
