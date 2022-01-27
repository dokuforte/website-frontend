import { trigger } from "../js/utils"
import config from "../data/siteConfig"
import { setAppState, removeAppState } from "../js/app"

const setLoginStatus = isUserSignedIn => {
  if (isUserSignedIn) {
    setAppState("auth-signed-in")
  } else {
    removeAppState("auth-signed-in")
    localStorage.removeItem("auth")
  }
}

const signin = async body => {
  const resp = await fetch(`${config.API_HOST}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : null,
  })

  const respData = await resp.json()
  if (resp.status === 200) {
    localStorage.setItem("auth", JSON.stringify(respData.data))
    trigger("auth:signedIn")
  } else {
    throw respData
  }
}

const signout = async () => {
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  const url = `${config.API_HOST}/auth/logout`

  const body = { refresh_token: authData.refresh_token }
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  })

  if (resp.status === 204) {
    trigger("auth:signedOut")
    setLoginStatus(false)
  }
}

const signup = async body => {
  const url = `${config.API_HOST}/users`

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  })

  if (resp.status === 200) {
    return resp
  }

  const respData = await resp.json()
  throw new Error(respData.errors[0].message)
}

const refreshToken = async () => {
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  const url = `${config.API_HOST}/auth/refresh`

  const body = { refresh_token: authData.refresh_token }
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  })

  const respData = await resp.json()
  if (resp.status === 200) {
    localStorage.setItem("auth", JSON.stringify(respData.data))
    trigger("auth:refresh")
  } else {
    throw respData
  }

  return respData.data
}

const forgot = async email => {
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

const resetPassword = async pass => {
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
  if (resp.status === 200) {
    return respData
  }

  throw Error(respData.message)
}

const querySignedInUser = async () => {
  let signedIn = false
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${config.API_HOST}/users/me?access_token=${authData.access_token}`, {
      method: "GET",
      mode: "cors",
    })
    signedIn = resp.status === 200
  }
  setLoginStatus(signedIn)
  return signedIn ? resp.json() : resp
}

const updateAuthProfile = async (userId, body) => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${config.API_HOST}/users/${userId}`, {
      method: "PATCH",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
      body: JSON.stringify(body),
    })
  }
  return resp ? resp.json() : resp
}

export default {
  signin,
  signout,
  signup,
  refreshToken,
  forgot,
  resetPassword,
  querySignedInUser,
  updateAuthProfile,
}
