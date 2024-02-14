import { getApiUrl } from "../js/utils"

/**
 * Create empty album
 * Should be called when no albumid provided
 *
 * @returns		JSON album record
 */
const createAlbum = async () => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${getApiUrl()}/mydata/createalbum`, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
    })
  }
  return resp ? resp.json() : resp
}

/**
 * Load album data
 *
 * @returns		JSON album record
 */
const getAlbum = async (id) => {
  let resp = null
  // console.log(`${getApiUrl()}/mydata/getalbum?albumid=${id}`)
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${getApiUrl()}/mydata/getalbum?albumid=${id}`, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
    })
  }
  return resp ? resp.json() : resp
  /**/
}

/**
 * Edit unsubmitted album data
 *
 * @param formData	Form data object
 * @returns			JSON: Modified rows count, new upload_album record
 */
const editAlbum = async (formData) => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${getApiUrl()}/mydata/editalbum`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(formData),
    })
  }
  return resp ? resp.json() : resp
}

/**
 * Submit uploaded album to moderators
 *
 * @param albumID	Album ID
 * @returns			JSON: Modified rows count, new upload_album record
 */
const submitAlbum = async (albumId) => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  if (authData.access_token) {
    resp = await fetch(`${getApiUrl()}/mydata/submitalbum?albumid=${albumId}`, {
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
  createAlbum,
  getAlbum,
  editAlbum,
  submitAlbum,
}
