import { Controller } from "stimulus"
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
    return ["form", "fileSelector", "fileSelectorPreview", "submitButton"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)

    /* auth.querySignedInUser().then(userData => {
      if (userData) {
        this.success()
      }
    }) */
  }

  submit(e) {
    if (e) e.preventDefault()

    // trigger("loader:show", { id: "loaderBase" })
    // this.element.classList.add("is-disabled")
  }

  // the server response returns a string based error message in English
  // so it needs to be localized
  errorMessageHandler(text) {
    const errorMessages = {
      "The user has not been activated or is blocked.": lang("user_signin_error"),
      "Invalid user credentials.": lang("user_signin_error"),
      '"email" must be a valid email': lang("user_signin_error"),
      '"email" is not allowed to be empty': lang("user_signin_error"),
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

  updateImageDisplay() {
    // remove current items
    while (this.fileSelectorPreviewTarget.firstChild) {
      this.fileSelectorPreviewTarget.removeChild(this.fileSelectorPreviewTarget.firstChild)
    }

    const currentFiles = this.fileSelectorTarget.files
    if (currentFiles.length === 0) {
      const paragraph = document.createElement("p")
      paragraph.textContent = "No files currently selected for upload"
      this.fileSelectorPreviewTarget.appendChild(paragraph)
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
