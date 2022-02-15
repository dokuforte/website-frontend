import { Controller } from "stimulus"
import auth from "../../api/auth"
import { trigger, lang, getLocale } from "../../js/utils"

const returnFileSize = number => {
  let n
  if (number < 1024) {
    n = `${number} bytes`
  } else if (number >= 1024 && number < 1048576) {
    n = `${(number / 1024).toFixed(1)} KB`
  } else if (number >= 1048576) {
    n = `${(number / 1048576).toFixed(1)} MB`
  }
  return n
}

export default class extends Controller {
  static get targets() {
    return ["form", "fileSelector", "fileSelectorPreview", "tags", "location", "submitButton"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)

    /* auth.querySignedInUser().then(userData => {
      if (userData) {
        this.success()
      }
    }) */
  }

  async submit(e) {
    if (e) e.preventDefault()

    const createAlbumResp = await auth.createAlbum()
    const albumId = createAlbumResp.data[0].id

    const formData = new FormData(this.formTarget)
    formData.append("albumid", albumId)
    formData.append("album_title", albumId)
    formData.append("tags", this.tagsTarget.selectizeControl.value.toString())
    formData.append("location", this.locationTarget.selectizeControl.value.toString())

    auth.editAlbum(Object.fromEntries(formData)).then(resp => {
      console.log(resp)
    })
    // trigger("loader:show", { id: "loaderBase" })
    // this.element.classList.add("is-disabled")
  }

  // the server response returns a string based error message in English
  // so it needs to be localized
  async errorMessageHandler(text) {
    const errorMessages = {
      "The user has not been activated or is blocked.": await lang("user_signin_error"),
      "Invalid user credentials.": await lang("user_signin_error"),
      '"email" must be a valid email': await lang("user_signin_error"),
      '"email" is not allowed to be empty': await lang("user_signin_error"),
    }

    return errorMessages[text]
  }

  error(respData) {
    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    // show snackbar message
    trigger("snackbar:show", {
      message: this.errorMessageHandler(respData.errors[0].message),
      status: "error",
      autoHide: true,
    })
  }

  chooseFiles(e) {
    e.preventDefault()
    this.fileSelectorTarget.click()
  }

  async updateImageDisplay() {
    // remove current items
    while (this.fileSelectorPreviewTarget.firstChild) {
      this.fileSelectorPreviewTarget.removeChild(this.fileSelectorPreviewTarget.firstChild)
    }

    const currentFiles = this.fileSelectorTarget.files
    if (currentFiles.length === 0) {
      const cancelMessage = document.createElement("div")
      cancelMessage.className = "cancelled small"
      cancelMessage.textContent = await lang("upload_cancelled")
      this.fileSelectorPreviewTarget.appendChild(cancelMessage)
    } else {
      Array.from(currentFiles).forEach(file => {
        const template = document.getElementById("profile-upload-file")
        const fileNode = template.content.firstElementChild.cloneNode(true)
        this.fileSelectorPreviewTarget.appendChild(fileNode)
        fileNode.querySelector(".file-label").textContent = `${file.name} (${returnFileSize(file.size)})`
        fileNode.querySelector(".file-preview").style.backgroundImage = `url(${URL.createObjectURL(file)})`
      })
    }
    this.fileSelectorPreviewTarget.classList.add("is-visible")
  }

  success() {
    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    document.location.href = `/${getLocale()}/profile/edit/`
  }
}
