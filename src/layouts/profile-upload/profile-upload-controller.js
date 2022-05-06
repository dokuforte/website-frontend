import { Controller } from "stimulus"
import moment from "moment"
import authAPI from "../../api/auth"
import albumAPI from "../../api/album"
import { trigger, comeBackAfterSignIn } from "../../js/utils"

const AUTOSAVE_DELAY = 5000

export default class extends Controller {
  static get targets() {
    return [
      "fileSelector",
      "form",
      "albumTitle",
      "title",
      "description",
      "hebrewTitle",
      "hebrewDescription",
      "tags",
      "date",
      "dateApprox",
      "location",
      "thankyou",
    ]
  }

  async connect() {
    const userData = await authAPI.querySignedInUser()
    if (!userData) {
      comeBackAfterSignIn()
    } else {
      this.formDataJSON = ""
      this.formTarget.submit = this.submit.bind(this)

      trigger("loader:show", { id: "loaderUpload" })
      this.albumId = await this.getAlbumId()

      const res = await albumAPI.getAlbum(this.albumId)
      if (res && res.count > 0) {
        this.fillFormWithAlbumData(res.data[0])
      }
    }

    this.startAutoSaving()
  }

  async getAlbumId() {
    let id = localStorage.getItem("albumId")
    if (!id) {
      // Create a new album if id doesn't exist
      const res = await albumAPI.createAlbum()
      if (res.count > 0) {
        id = res.data[0].albumid
        localStorage.setItem("albumId", id)
      }
    }
    return id
  }

  startAutoSaving() {
    trigger("loader:hide", { id: "loaderUpload" })
    this.autoSaveInterval = setInterval(this.submit.bind(this), AUTOSAVE_DELAY, null)
  }

  stopAutoSaving() {
    clearInterval(this.autoSaveInterval)
  }

  fillFormWithAlbumData(data) {
    if (data.original_photos) {
      this.fileSelectorTarget.addFiles(data.original_photos)
    }

    this.albumTitleTarget.value = data.album_title || ""
    this.titleTarget.value = data.title || ""
    this.descriptionTarget.value = data.description || ""
    this.hebrewTitleTarget.value = data.hebrew_title || ""
    this.hebrewDescriptionTarget.value = data.hebrew_description || ""
    this.tagsTarget.selectizeControl.value = data.tags || ""
    this.locationTarget.selectizeControl.value = data.addressline || ""
    this.dateTarget.value = moment(data.date, "DD/MM/YYYY").format("YYYY-MM-DD") || ""
    this.dateApproxTarget.checked = data.approx
  }

  submit(e) {
    if (e) e.preventDefault()

    // UPDATE ALBUM DATA
    const formData = {
      albumid: this.albumId,
      album_title: this.albumTitleTarget.value,
      title: this.titleTarget.value,
      description: this.descriptionTarget.value,
      hebrewtitle: this.hebrewTitleTarget.value,
      hebrewdescription: this.hebrewDescriptionTarget.value,
      tags: this.tagsTarget.selectizeControl.value.join(", "),
      addressline: this.locationTarget.selectizeControl.value.join(", "),
      date: moment(this.dateTarget.value).format("DD/MM/YYYY"),
      approx: this.dateApproxTarget.checked ? "true" : "false",
      original_photos: this.fileSelectorTarget.getUploadedFiles(),
    }

    const formDataJSON = JSON.stringify(formData)

    // Submit data only if there's difference compared to the last save
    if (this.formDataJSON !== formDataJSON) {
      this.formDataJSON = formDataJSON

      trigger("loader:show", { id: "loaderUpload" })
      albumAPI
        .editAlbum(formData)
        .then(() => {
          trigger("loader:hide", { id: "loaderUpload" })
        })
        .catch(err => {
          this.errorMessageHandler(err)
          trigger("loader:hide", { id: "loaderUpload" })
        })
    }
  }

  async markAlbumForReview(e) {
    if (e) e.preventDefault()

    this.stopAutoSaving()

    trigger("loader:show", { id: "loaderUpload" })
    await albumAPI.submitAlbum(this.albumId)
    trigger("loader:hide", { id: "loaderUpload" })

    this.formTarget.classList.add("is-hidden")
    this.thankyouTarget.classList.remove("is-hidden")

    localStorage.removeItem("albumId")
  }
}
