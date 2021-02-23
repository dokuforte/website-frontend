import { Controller } from "stimulus"
import { trigger, lang } from "../../../js/utils"
import auth from "../../../api/auth"

export default class extends Controller {
  static get targets() {
    return ["form", "firstName", "lastName", "email", "password", "submitButton"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  async submit(e) {
    e.preventDefault()
    const credentials = {}
    credentials.first_name = this.firstNameTarget.value
    credentials.last_name = this.lastNameTarget.value
    credentials.email = this.emailTarget.value
    credentials.password = this.passwordTarget.value

    trigger("loader:show", { id: "loaderBase" })
    this.element.classList.add("is-disabled")

    const resp = await auth.signup(credentials).catch(err => {
      this.error(err.message)
    })

    if (resp.status === 200) {
      this.success()
    }
  }

  // localize Drupal server auth response
  errorMessageHandler(text) {
    if (text.indexOf("Meg kell adni egy felhasználónevet") !== -1) {
      return lang("user_signup_username_missing")
    }

    if (text.indexOf("The username is already taken") !== -1) {
      return lang("user_signup_username_taken")
    }

    if (text.indexOf("email address") !== -1 && text.indexOf("already taken") !== -1) {
      return lang("user_signup_email_taken")
    }

    if (text.indexOf("E-mail mező szükséges") !== -1) {
      return lang("user_signup_email_missing")
    }

    if (text.indexOf("This value is not a valid email address") !== -1) {
      return lang("user_signup_email_invalid")
    }

    if (text.indexOf("No password provided") !== -1) {
      return lang("user_signup_password_missing")
    }

    if (text.indexOf("unrecognized username or password") !== -1) {
      return lang("user_signin_error")
    }

    return text
  }

  error(statusText) {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: this.errorMessageHandler(statusText), status: "error", autoHide: true })
  }

  success() {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: lang("user_signup_success"), status: "success", autoHide: true })
    trigger("dialogSignup:hide")
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
    this.firstNameTarget.focus()
  }

  showSigninDialog(e) {
    e.preventDefault()
    trigger("dialogSignup:hide")
    trigger("dialogSignin:show")
  }
}
