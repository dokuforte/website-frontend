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
    // store selected thumbnail
    this.selectedThumbnail = null

    this.thumbnailsLoading = false

    this.currentSearchQuery = window.location.search
    this.currentTitle = document.title

    this.years = null
    this.total = 0
    this.scrollTop = 0

    // Throttle resize and scroll functions
    this.onScroll = throttle(this.onScroll, 200)
    this.resizeThumbnails = throttle(this.resizeThumbnails, 300)

    // trigger history push state event
    this.onPopState()
  }

  // add "in-viewport" class to thumbnails that are in the viewport
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

  // auto-load new items when scrolling reaches the bottom of the page or if it's forced on first load
  async onScroll(e, force = false) {
    const firstThumbnail = this.element.querySelector(".photos-thumbnail")
    const lastThumbnail = this.element.querySelector(".photos-thumbnail:last-child")

    let respData = null

    if (
      force ||
      (!this.thumbnailsLoading &&
        lastThumbnail &&
        lastThumbnail.order < this.total - 1 &&
        this.element.scrollTop + this.element.offsetHeight >= this.element.scrollHeight - 150) ||
      (this.element.scrollTop <= 0 && firstThumbnail && firstThumbnail.order > 0)
    ) {
      this.thumbnailsLoading = true
      const insertBefore = this.element.scrollTop <= 0 && !force

      // calculate the offset based on the first or last thumbnail in the grid
      let offset = 0
      if (firstThumbnail && lastThumbnail) {
        if (insertBefore) {
          offset = firstThumbnail.order
        } else {
          offset = lastThumbnail.order + 1
        }
      }

      respData = await this.loadPhotos(insertBefore, offset || 0)
    }

    this.markThumbnailsInViewport()
    this.calcYearOfViewport()
    this.loadThumbnails()

    return respData
  }

  // trigger load event for thumbnails that are not loaded yet
  loadThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail:not(.is-loaded)").forEach((thumbnail) => {
      thumbnail.photosThumbnail.loadThumbnailImage()
    })
  }

  // trigger timeline:yearChanged event when the year of the viewport changes and no carousel is open
  calcYearOfViewport() {
    if (document.querySelector(".carousel") && document.querySelector(".carousel").classList.contains("is-visible"))
      return

    let year

    // get the first loaded thumbnail in the viewport
    const thumbnails = this.element.querySelectorAll(".photos-thumbnail.is-loaded.is-visible.in-viewport")

    if (thumbnails.length > 0) {
      const scrollDirection = this.element.scrollTop > this.scrollTop ? "down" : "up"
      this.scrollTop = this.element.scrollTop

      // based on the scroll direction, get the year of the first or last thumbnail in the viewport
      year = scrollDirection === "up" ? thumbnails[0].year : thumbnails[thumbnails.length - 1].year
    } else if (this.element.querySelector(".photos-thumbnail")) {
      // if no thumbnail is in the viewport, get the first thumbnail in the grid
      year = this.element.querySelector(".photos-thumbnail").year
    }

    // dispatches a custom event if the year has changed and sets the yearInViewPort property
    if (year !== this.yearInViewPort) {
      this.yearInViewPort = year
      trigger("photos:yearChanged", { year: this.yearInViewPort })
    }
  }

  // this method generates the thumbnails and adds to the DOM based on the data
  // and displays them with a skeleton placeholder until the images load
  generateThumbnailsFromData(data, insertBefore = false) {
    // set the total photo counter
    trigger("photosTitle:setTitle", { count: data.total })

    // get the target element to insert the thumbnails before or after based on the insertBefore flag
    const insertBeforeTarget = insertBefore ? this.element.querySelectorAll(".photos-thumbnail")[0] : null
    const scrollPosition =
      insertBefore && insertBeforeTarget ? this.element.scrollTop - insertBeforeTarget.offsetTop : 0
    const scrollH = this.element.scrollHeight

    data.items.forEach((item) => {
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
  async loadPhotos(insertBefore = false, offset = 0) {
    // get default and search query params
    let size = config.THUMBNAILS_QUERY_LIMIT
    let o = offset

    // calculate the offset and size for the previous page
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
    Object.assign(params, getURLParams(this.currentSearchQuery))

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

  scrollToThumbnail(thumbnail, smooth = true) {
    thumbnail.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" })
  }

  // event listener to photoCarousel:closed
  onCarouselClosed() {
    // if an id page is open, reset the page to the last search query when the carousel is closed and load photos from the same year as the selected photo
    if (this.currentSearchQuery.indexOf("?id=") > -1) {
      trigger("photos:historyPushState", { url: "?q=", resetPhotosGrid: true, jumpToYearAfter: this.yearInViewPort })
    } else {
      window.history.replaceState(null, this.currentTitle, this.currentSearchQuery)
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

    // get the first thumbnail of the selected year
    const thumbnail = this.element.querySelector(`.photos-thumbnail[data-order='${offset}']`)

    if (thumbnail && this.isCarouselOpen()) {
      // select the thumbnail if the carousel is open
      thumbnail.click()
    } else if (thumbnail) {
      // scroll to the thumbnail if the carousel is not open
      this.scrollToThumbnail(thumbnail)
    } else {
      // if no thumbnail is found, empty the grid and load photos for the selected year
      this.resetPhotosGrid()

      // load photos for the selected year
      this.loadPhotos(false, offset).then(() => {
        // select the first thumbnail of the loaded year
        const t = this.element.querySelector(`.photos-thumbnail`)
        if (t && this.isCarouselOpen()) {
          t.click()
        }
      })
    }
  }

  // Load new photos when address bar url changes
  async onPopState(e) {
    // Empty photosNode and reset counters when resetPhotosGrid parameter is set
    if ((e && e.detail && e.detail.resetPhotosGrid === true) || (e && e.type)) {
      this.resetPhotosGrid()
    }

    // load photos
    const respData = await this.onScroll(null, true)

    // hook for the special case when the query is a photo id, open the carousel
    if (respData && respData.items.length === 1 && getURLParams().q === respData.items[0].mid) {
      trigger("photos:historyPushState", { url: `?id=${respData.items[0].mid}`, resetPhotosGrid: true })
      return
    }

    // jump to year after the photos are loaded if the jumpToYearAfter parameter is set
    if (e && e.detail && e.detail.jumpToYearAfter) {
      trigger("timeline:yearSelected", { year: e.detail.jumpToYearAfter })
    }

    if (getURLParams().id > 0) {
      // open carousel if @id parameter is present in the url's query string
      this.selectThumbnail(null, getURLParams().id)
      this.selectedThumbnail.click()
    } else {
      trigger("photosCarousel:hide")
    }

    // track page view when page url changes
    // but skip tracking when page loads for the first time as GA triggers a page view when it gets initialized
    if (e) trigger("analytics:trackPageView")
  }
}
