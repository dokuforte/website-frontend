import { Controller } from "stimulus"
import { trigger, lang, getLocale } from "../../js/utils"
import auth from "../../api/auth"

export default class extends Controller {
  static get targets() {
    return ["form", "email", "password", "submitButton"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)

    auth.querySignedInUser().then(userData => {
      if (userData) {
        this.success()
      }
    })
  }

  submit(e) {
    if (e) e.preventDefault()
    const credentials = {}
    credentials.email = this.emailTarget.value
    credentials.password = this.passwordTarget.value

    trigger("loader:show", { id: "loaderBase" })
    this.element.classList.add("is-disabled")

    auth
      .signin(credentials)
      .then(this.success.bind(this))
      .catch(this.error.bind(this))
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

  async error(respData) {
    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    // show snackbar message
    trigger("snackbar:show", {
      message: await this.errorMessageHandler(respData.errors[0].message),
      status: "error",
      autoHide: true,
    })
  }

  success() {
    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    let redirectTo = localStorage.getItem("redirectAfterSignin")
    localStorage.removeItem("redirectAfterSignin")
    if (!redirectTo) redirectTo = `/${getLocale()}/profile/edit/`
    document.location.href = redirectTo
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
    this.emailTarget.focus()
  }

  showPasswordRequestDialog(e) {
    e.preventDefault()
    trigger("dialogs:hide")
    trigger("dialogResetPasswordRequest:show")
  }

  showSignupDialog(e) {
    e.preventDefault()
    trigger("dialogs:hide")
    trigger("dialogSignup:show")
  }
}
