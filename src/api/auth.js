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

  if (resp.status === 204) {
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
  if (respData && !respData.errors) {
    return respData
  }

  throw Error(respData.message)
}

const querySignedInUser = async () => {
  let signedIn = false
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${config.API_HOST}/mydata/getprofile`, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
    })
    signedIn = resp.status === 200
  }

  setLoginStatus(signedIn)

  if (signedIn) {
    const respData = await resp.json()
    return respData.data[0]
  }

  return resp
}

const updateAuthProfile = async (userId, body) => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    const params = new URLSearchParams(body).toString()
    resp = await fetch(`${config.API_HOST}/mydata/editprofile/?${params}`, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
      // body: JSON.stringify(body),
    })
  }
  return resp ? resp.json() : resp
}

const deleteAccount = async () => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${config.API_HOST}/mydata/deleteprofile`, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
    })
  }
  return resp ? resp.json() : resp
}

const createAlbum = async () => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${config.API_HOST}/mydata/createalbum`, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
    })
  }
  return resp ? resp.json() : resp
}

const editAlbum = async params => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    const queryParams = new URLSearchParams(params).toString()
    resp = await fetch(`${config.API_HOST}/mydata/editalbum?${queryParams}}`, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
    })
  }
  return resp ? resp.json() : resp
}

const submitAlbum = async albumId => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${config.API_HOST}/mydata/submitalbum?id=${albumId}`, {
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
  refreshToken,
  forgot,
  resetPassword,
  querySignedInUser,
  updateAuthProfile,
  deleteAccount,
  createAlbum,
  editAlbum,
  submitAlbum,
}
