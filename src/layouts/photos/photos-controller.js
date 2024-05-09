import { Controller } from "@hotwired/stimulus"

import throttle from "lodash/throttle"
import config from "../../data/siteConfig"
import { lang, trigger, getURLParams, isElementInViewport, setPageMeta, photoRes } from "../../js/utils"
import searchAPI from "../../api/search"

export default class extends Controller {
  static get targets() {
    return ["grid"]
  }

  connect() {
    this.selectedThumbnail = null

    this.thumbnailsCount = 0
    this.thumbnailsLoading = false

    this.currentSearchQuery = window.location.href

    // Throttle resize and scroll functions
    this.scrollTop = 0
    this.onScroll = throttle(this.onScroll, 200)
    this.resizeThumbnails = throttle(this.resizeThumbnails, 300)

    this.onPopState()
  }

  markThumbnailsInViewport() {
    this.element.querySelectorAll(".photos-thumbnail.is-loaded.is-visible").forEach((thumbnail) => {
      thumbnail.classList.toggle(
        "in-viewport",
        isElementInViewport(thumbnail.querySelector(".photos-thumbnail__image"), false)
      )
    })
  }

  // resize thumbnails when window gets resized
  resizeThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail").forEach((thumbnail) => {
      thumbnail.photosThumbnail.resize()
    })
  }

  // auto-load new items when scrolling reaches the bottom of the page
  onScroll() {
    const firstThumbnail = this.element.querySelector(".photos-thumbnail")
    const lastThumbnail = this.element.querySelector(".photos-thumbnail:last-child")

    if (
      (!this.thumbnailsLoading &&
        this.thumbnailsCount > 0 &&
        lastThumbnail &&
        lastThumbnail.order < this.total - 1 &&
        this.element.scrollTop + this.element.offsetHeight >= this.element.scrollHeight - 150) ||
      (this.element.scrollTop <= 0 && firstThumbnail && firstThumbnail.order > 0)
    ) {
      this.thumbnailsLoading = true
      const insertBefore = this.element.scrollTop <= 0

      const offset = insertBefore ? firstThumbnail.order : lastThumbnail.order + 1
      this.loadPhotos(insertBefore, offset || 0)
    }

    this.markThumbnailsInViewport()
    this.calcYearOfViewport()
    this.loadThumbnails()
  }

  loadThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail:not(.is-loaded)").forEach((thumbnail) => {
      thumbnail.photosThumbnail.loadThumbnailImage()
    })
  }

  calcYearOfViewport() {
    if (document.querySelector(".carousel") && document.querySelector(".carousel").classList.contains("is-visible"))
      return

    let year

    // get the first loaded thumbnail in the viewport
    const thumbnails = this.element.querySelectorAll(".photos-thumbnail.is-loaded.is-visible.in-viewport")

    if (thumbnails.length > 0) {
      const scrollDirection = this.element.scrollTop > this.scrollTop ? "down" : "up"
      this.scrollTop = this.element.scrollTop

      year = scrollDirection === "up" ? thumbnails[0].year : thumbnails[thumbnails.length - 1].year
    } else if (this.element.querySelector(".photos-thumbnail")) {
      // if no thumbnail is in the viewport, get the first thumbnail in the grid
      year = this.element.querySelector(".photos-thumbnail").year
    }

    if (year !== this.yearInViewPort) {
      this.yearInViewPort = year

      // dispatches a custom event if the year has changed
      trigger("photos:yearChanged", { year: this.yearInViewPort })
    }
  }

  // this method generates the thumbnails from the data attribute
  // and displays them with a placeholder until the images load by themselves
  generateThumbnailsFromData(data, insertBefore = false) {
    // set the total photo counter
    trigger("photosTitle:setTitle", { count: data.total })

    const insertBeforeTarget = insertBefore ? this.element.querySelectorAll(".photos-thumbnail")[0] : null
    const scrollPosition =
      insertBefore && insertBeforeTarget ? this.element.scrollTop - insertBeforeTarget.offsetTop : 0
    const scrollH = this.element.scrollHeight

    data.items.forEach((item) => {
      // count results
      this.thumbnailsCount += 1

      // clone thumbnail template
      const template = document.getElementById("photos-thumbnail")
      const thumbnail = template.content.firstElementChild.cloneNode(true)

      if (insertBefore && insertBeforeTarget) {
        this.gridTarget.insertBefore(thumbnail, insertBeforeTarget)
      } else {
        this.gridTarget.appendChild(thumbnail)
      }

      // apply data to dom element
      thumbnail.photoData = item

      // apply photo id to node
      thumbnail.photoId = item.photoId

      // apply photoId as data attribute to be able query the node later
      thumbnail.dataset.photoId = item.photoId

      thumbnail.order = item.order
      thumbnail.dataset.order = item.order

      // apply mid to node
      thumbnail.mid = item.mid
      thumbnail.dataset.mid = item.mid

      // apply year data to node
      thumbnail.year = item.year
    })

    this.thumbnailsLoading = false

    trigger("loader:hide", { id: "loaderBase" })

    // keep the scrolling position after inserting the new elements on the beginning of the list
    if (insertBefore && insertBeforeTarget) {
      this.element.scrollTop = scrollPosition + (this.element.scrollHeight - scrollH)
    }
  }

  // async function that loads thumbnail data based on the search query
  async loadPhotos(insertBefore, offset = 0) {
    // get default and search query params
    let size = config.THUMBNAILS_QUERY_LIMIT
    let o = offset

    if (insertBefore) {
      o = offset - config.THUMBNAILS_QUERY_LIMIT
      if (o < 0) {
        o = 0
        size = offset
      }
    }

    const params = {
      size,
      offset: o,
    }

    // merge params with query params
    Object.assign(params, getURLParams())

    if (insertBefore) params.reverseOrder = true

    // not passing id on once the first round of data loading happened
    delete params.id

    if (!params.q) {
      // clear all search fields if query is not defined in the request
      trigger("search:clear")
    } else {
      // set all search fields' value if query param is set
      setTimeout(() => {
        trigger("search:setValue", { value: params.q })
      }, 20)
    }

    // show loading indicator
    setTimeout(() => {
      trigger("loader:show", { id: "loaderBase" })
    }, 10)

    // request loading photos
    const respData = await searchAPI.search(params)

    // store the year aggregations and total count of photos
    if (respData.years) this.years = respData.years
    if (respData.total) this.total = respData.total

    // insert elements to DOM
    this.generateThumbnailsFromData(respData, insertBefore)

    // enable timeline after we have data loaded
    trigger("timeline:enable", { years: respData.years })

    return respData
  }

  // Custom event to load content and update page meta tag
  historyPushState(e) {
    window.history.pushState(null, lang("search"), e.detail.url)
    this.currentSearchQuery = e.detail.url
    this.onPopState(e)
  }

  resetPhotosGrid() {
    this.selectedThumbnail = null

    // Empty photosNode and reset counters
    while (this.gridTarget.firstChild) {
      this.gridTarget.firstChild.remove()
    }

    this.element.scrollTop = 0
    this.thumbnailsCount = 0
  }

  // Load new photos when address bar url changes
  onPopState(e) {
    // Empty photosNode and reset counters when resetPhotosGrid parameter is set
    if ((e && e.detail && e.detail.resetPhotosGrid === true) || (e && e.type)) {
      this.resetPhotosGrid()
    }

    if (e && e.detail && e.detail.jumpToYearAfter) {
      // if jumpToYearAfter flag is given, dispatch a new year selection event
      // this is a delayed year selection method
      trigger("timeline:yearSelected", { year: e.detail.jumpToYearAfter })
    } else {
      // load photos then...
      this.loadPhotos().then((respData) => {
        // hook for the special case when the query is a photo id, open the carousel
        if (respData.items.length === 1 && getURLParams().q === respData.items[0].mid) {
          trigger("photos:historyPushState", { url: `?id=${respData.items[0].mid}`, resetPhotosGrid: true })
          return
        }

        if (getURLParams().id > 0) {
          // open carousel if @id parameter is present in the url's query string
          // const selectedPhoto = document.querySelector()
          // trigger("photosThumbnail:select", { data: selectedPhoto.data })
        } else {
          trigger("photosCarousel:hide")
        }
      })
    }

    // track page view when page url changes
    // but skip tracking when page loads for the first time as GA triggers a page view when it gets initialized
    if (e) trigger("analytics:trackPageView")
  }

  // Set a thumbnail's selected state
  selectThumbnail(e = null, mid = -1) {
    const selectedId = e && e.detail && e.detail.mid > -1 ? e.detail.mid : mid

    if (selectedId !== -1) {
      // change status of the currently selected thumbnail
      if (this.selectedThumbnail) this.selectedThumbnail.classList.remove("is-selected")

      const thumbnailToSelect = this.element.querySelector(`.photos-thumbnail[data-mid='${selectedId}']`)

      if (thumbnailToSelect) {
        // set a new selected thumbnail based on event data
        this.selectedThumbnail = thumbnailToSelect
        this.selectedThumbnail.classList.add("is-selected")
        this.scrollToThumbnail(this.selectedThumbnail)

        // set html page meta for social sharing
        const { photoData } = this.selectedThumbnail

        setPageMeta(
          `#${photoData.mid}`,
          `${photoData.description ? `${photoData.description} — ` : ""}${lang("donor")}: ${photoData.donor} (${
            photoData.year
          })`,
          `${photoRes("large", photoData.photoId)}`
        )

        // history api
        const url = `${window.location.origin + window.location.pathname}?id=${photoData.mid}`
        if (!this.lastSearchQuery) this.lastSearchQuery = window.location.href
        window.history.replaceState(null, `Dokuforte — #${photoData.mid}`, url)

        trigger("photos:yearChanged", { year: this.selectedThumbnail.year })
      }
    }
  }

  selectNextThumbnail() {
    if (this.selectedThumbnail) {
      const nextThumbnail = this.selectedThumbnail.nextElementSibling
      if (nextThumbnail) nextThumbnail.click()
    }
  }

  selectPreviousThumbnail() {
    if (this.selectedThumbnail) {
      const prevThumbnail = this.selectedThumbnail.previousElementSibling
      if (prevThumbnail) prevThumbnail.click()
    }
  }

  scrollToThumbnail(thumbnail) {
    thumbnail.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // event listener to photoCarousel:closed
  onCarouselClosed() {
    window.history.replaceState(null, "", this.currentSearchQuery)

    if (this.selectedThumbnail) {
      this.scrollToThumbnail(this.selectedThumbnail)
    }
  }

  isCarouselOpen() {
    return document.querySelector(".carousel").classList.contains("is-visible")
  }

  // event listener for timeline:yearSelected
  onYearSelected(e) {
    const { year } = e.detail

    // the offset base is the total number of photos calculated from the aggregated years before the year of the current search context
    let offset = 0
    if (this.years) {
      offset = this.years.reduce((total, yearObject) => {
        if (yearObject.year < year) {
          return total + yearObject.count
        }
        return total
      }, 0)
    }

    const thumbnail = this.element.querySelector(`.photos-thumbnail[data-order='${offset}']`)
    if (thumbnail && !this.isCarouselOpen()) {
      this.scrollToThumbnail(thumbnail)
    } else if (thumbnail) {
      thumbnail.click()
    } else {
      // reset the grid if no thumbnail is found
      this.resetPhotosGrid()

      // load photos for the selected year
      this.loadPhotos(false, offset).then(() => {
        // scroll to the first thumbnail of the selected year
        const t = this.element.querySelector(`.photos-thumbnail`)
        if (t && this.isCarouselOpen) {
          t.click()
        }
      })
    }
  }
}
