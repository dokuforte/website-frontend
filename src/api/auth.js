import { trigger } from "../js/utils"
import config from "../data/siteConfig"
import { setAppState, removeAppState } from "../js/app"

const signin = async (formData) => {
  const resp = await fetch(`${config.API_HOST}/login?format=json`, {
    method: "POST",
    credentials: "include",
    body: formData,
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
  const url = `${config.API_HOST}/users/logout`

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
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
    body: JSON.stringify(body),
  })

  if (resp.status === 204) {
    return resp
  }

  const respData = await resp.json()
  throw new Error(respData.errors[0].message)
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

const querySignedInUser = async () => {
  let signedIn = await getLoginStatus()
  console.log(signedIn)
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
