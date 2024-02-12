import { trigger, formDataToJson } from "../js/utils"
import config from "../data/siteConfig"
import { appState, setAppState, removeAppState } from "../js/app"

let initialAuthCheck = false

const signin = async (formData) => {
  const resp = await fetch(`${config.API_HOST}/login?format=json`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
    },
    credentials: "include",
    mode: "cors",
    body: formData,
  })

  const contentType = resp.headers.get("Content-Type")
  if (contentType && contentType.includes("application/json")) {
    // Handle JSON data
    const jsonData = await resp.json()
    if (resp.status === 200 && jsonData) {
      localStorage.setItem("auth", JSON.stringify(jsonData))
      trigger("auth:signedIn")
    }
  } else {
    // Handle non-JSON data (error message, etc.)
    const htmlData = await resp.text()
    const parser = new DOMParser()
    const data = parser.parseFromString(htmlData, "text/html")
    const error = data.querySelector(".message.error").textContent
    throw error
  }
}

const signout = async () => {
  const url = `${config.API_HOST}/users/logout`

  const resp = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "include",
  })

  if (resp.status === 200) {
    trigger("auth:signedOut")
  }
}

const signup = async (body) => {
  const url = `${config.API_HOST}/users/register`

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: formDataToJson(body),
  })

  if (resp.statusText === "OK" && resp.redirected === true) {
    trigger("auth:signedUp")
  } else {
    // Handle non-JSON data (error message, etc.)
    const htmlData = await resp.text()
    const parser = new DOMParser()
    const data = parser.parseFromString(htmlData, "text/html")
    const error = data.querySelector(".message.error").textContent

    throw error
  }
}

const getLoginStatus = async () => {
  const url = `${config.API_HOST}/api/users/login-status?_format=json`
  const resp = await fetch(url, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  })

  const respData = await resp.json()
  return respData
}

const forgot = async (email) => {
  const body = {
    email,
  }

  const url = `${config.API_HOST}/auth/password/request`
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  })

  const respData = resp.json()

  return respData
}

const resetPassword = async (pass) => {
  const body = {
    token: "",
    password: pass,
  }

  const resp = await fetch(`${config.API_HOST}/auth/password/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  })

  const respData = resp.json()
  if (respData && !respData.errors) {
    return respData
  }

  throw Error(respData.message)
}

const setLoginStatus = (isUserSignedIn) => {
  const authState = appState("auth-signed-in")

  if (isUserSignedIn) {
    setAppState("auth-signed-in")
  } else {
    removeAppState("auth-signed-in")
    localStorage.removeItem("auth")
  }

  // trigger a custom event:
  // - on the very first check regardless of the status
  // - or when the status has changed
  if (!initialAuthCheck || appState("auth-signed-in") !== authState) {
    trigger("auth:loginStatus")
    initialAuthCheck = true
  }
}

const querySignedInUser = async () => {
  const signedIn = await getLoginStatus()
  setLoginStatus(signedIn === 1)

  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  return authData
}

const updateAuthProfile = async (userId, body) => {
  let resp = null

  resp = await fetch(`${config.API_HOST}/api/users/edit`, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    body: JSON.stringify(body),
  })
  return resp ? resp.json() : resp
}

const deleteAccount = async () => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${config.API_HOST}/ap/users/delete`, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
    })
  }
  return resp ? resp.json() : resp
}

export default {
  signin,
  signout,
  signup,
  getLoginStatus,
  forgot,
  resetPassword,
  querySignedInUser,
  updateAuthProfile,
  deleteAccount,
}
