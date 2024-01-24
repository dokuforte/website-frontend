import { Controller } from "@hotwired/stimulus"
import { trigger, lang, redirectTo, getLocale } from "../../js/utils"
import auth from "../../api/auth"

export default class extends Controller {
  static get targets() {
    return [
      "form",
      "userName",
      "firstName",
      "lastName",
      "email",
      "phone",
      "password",
      "passwordConfirm",
      "submitButton",
      "checkboxRead",
      "checkboxAge",
      "checkboxNewsletter",
    ]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  async formIsValid() {
    const formElements = this.formTarget.elements
    let isValid = true
    let i = 0
    while (isValid && i < formElements.length) {
      if (formElements[i].value === "" && formElements[i].hasAttribute("required")) {
        isValid = false
        formElements[i].focus()
      }

      i += 1
    }

    if (!isValid) {
      trigger("snackbar:show", { message: await lang("signup_must_filled"), status: "error", autoHide: true })
    }

    if (this.passwordTarget.value !== this.passwordConfirmTarget.value) {
      trigger("snackbar:show", { message: await lang("passwords_must_match"), status: "error", autoHide: true })
    }

    return isValid
  }

  async submit(e) {
    e.preventDefault()

    if (await this.formIsValid()) {
      this.credentials = {}

      this.credentials.username = this.userNameTarget.value
      this.credentials.first_name = this.firstNameTarget.value
      this.credentials.last_name = this.lastNameTarget.value
      this.credentials.email = this.emailTarget.value
      this.credentials.phone = this.phoneTarget.value
      this.credentials.password = this.passwordTarget.value
      this.credentials.password_confirm = this.passwordConfirmTarget.value
      this.credentials.newsletter = this.checkboxNewsletterTarget.checked
      this.credentials.tos = this.checkboxReadTarget.checked

      trigger("loader:show", { id: "loaderBase" })
      this.element.classList.add("is-disabled")

      const resp = await auth.signup(this.credentials).catch((err) => {
        this.error(err.message)
      })

      if (resp.status === 200) {
        this.success()
      }
    }
  }

  enable() {
    if (this.checkboxReadTarget.checked && this.checkboxAgeTarget.checked) {
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
          // redirectTo(`/${getLocale()}/profile/my-photos/`)
          redirectTo(`/${getLocale()}/profile/edit/`)
        })
        .catch((err) => {
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
