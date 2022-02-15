import { Controller } from "stimulus"
import { trigger, lang, redirectTo, getLocale } from "../../js/utils"
import auth from "../../api/auth"

export default class extends Controller {
  static get targets() {
    return ["form", "firstName", "lastName", "email", "password", "submitButton", "checkboxTerms"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  async submit(e) {
    e.preventDefault()
    this.credentials = {}
    if (this.firstNameTarget.value.length > 0) {
      this.credentials.first_name = this.firstNameTarget.value
    }
    if (this.lastNameTarget.value.length > 0) {
      this.credentials.last_name = this.lastNameTarget.value
    }
    if (this.emailTarget.value.length > 0) {
      this.credentials.email = this.emailTarget.value
    }
    if (this.passwordTarget.value.length > 0) {
      this.credentials.password = this.passwordTarget.value
    }
    this.credentials.role = "eca918be-4232-4b66-96f4-3501507f5b97"

    trigger("loader:show", { id: "loaderBase" })
    this.element.classList.add("is-disabled")

    const resp = await auth.signup(this.credentials).catch(err => {
      this.error(err.message)
    })

    if (resp.status === 204) {
      this.success()
    }
  }

  enable(e) {
    if (e.target.checked) {
      this.submitButtonTarget.disabled = false
    } else {
      this.submitButtonTarget.disabled = true
    }
  }

  error(statusText) {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: statusText, status: "error", autoHide: true })
  }

  async success() {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: await lang("user_signup_success"), status: "success", autoHide: true })

    // sign in and redirect to profile
    setTimeout(() => {
      auth
        .signin(this.credentials)
        .then(() => {
          redirectTo(`/${getLocale()}/profile/edit/`)
        })
        .catch(err => {
          this.error(err)
        })
    }, 2000)
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
    this.firstNameTarget.focus()
  }
}
