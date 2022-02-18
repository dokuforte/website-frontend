import { Controller } from "stimulus"
import config from "../../data/siteConfig"
import { trigger, lang, getLocale } from "../../js/utils"

const SLICE_SIZE = 262144

const delay = ms => new Promise(res => setTimeout(res, ms))

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

const editAlbum = async formData => {
  let resp = null
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  const jsonData = JSON.stringify(Object.fromEntries(formData))
    .replace(/\\"/g, '"')
    .replace(/:"{"/g, ':{"')
    .replace(/"}"/g, '"}')
  if (authData.access_token) {
    resp = await fetch(`${config.API_HOST}/mydata/editalbum`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: jsonData,
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

const uploadFile = (fileNode, albumid) => {
  return new Promise((resolve, reject) => {
    const authData = JSON.parse(localStorage.getItem("auth")) || {}
    if (!authData.access_token) reject()

    const { file } = fileNode
    let fileId
    let uploadId
    let startingByte = 0
    let uploadSize = 0
    let chunkRetries = 0

    const checkUploadProgress = async () => {
      try {
        const statusResp = await fetch(
          `${config.API_HOST}/multiupload/status/?filename=${file.name}&uploadid=${uploadId}`,
          {
            mode: "cors",
            headers: {
              Authorization: `Bearer ${authData.access_token}`,
            },
          }
        )

        const statusRespData = await statusResp.json()
        console.log("checkUploadSize", statusRespData.uploadSize)
        return statusRespData.uploadSize
      } catch (err) {
        throw new Error(err)
      }
    }

    const onChunkUploadProgress = e => {
      uploadSize = startingByte + e.loaded
      console.log("chunkUploadProgress", uploadSize)
    }

    const onChunkUploadFinished = async res => {
      if (res.target.status === 200) {
        chunkRetries = 0

        // const resData = JSON.parse(res.target.responseText)
        // if (resData.rangeEnd === file.size) {
        // console.log("uploadIsDone - rangeEnd")
        // resolve(fileId)
        // } else {
        checkUploadProgress()
          .then(resp => {
            uploadSize = resp

            if (file.size === uploadSize) {
              console.log("uploadIsDone")
              resolve(fileId)
            } else {
              startingByte = uploadSize
              console.log("uploadNextChunk", startingByte)
              // eslint-disable-next-line no-use-before-define
              uploadChunk()
            }
          })
          .catch(err => {
            onChunkUploadError(err)
          })
        // }
      } else {
        onChunkUploadError()
      }
    }

    const onChunkUploadError = async err => {
      console.log("uploadError", err)

      if (chunkRetries <= 3) {
        chunkRetries += 1
        uploadSize = await checkUploadProgress()
        startingByte = uploadSize
        console.log("retry uploading chunk", startingByte)
        setTimeout(uploadChunk, 1500)
      } else {
        reject()
      }
    }

    const uploadChunk = () => {
      const formData = new FormData()
      const chunk = file.slice(startingByte, Math.min(startingByte + SLICE_SIZE, file.size))
      formData.append("uploadid", uploadId)
      formData.append("type", file.type)
      formData.append("chunk", chunk, file.name)

      const request = new XMLHttpRequest()
      request.open("POST", `${config.API_HOST}/multiupload/data/`)
      request.upload.addEventListener("progress", onChunkUploadProgress)
      request.addEventListener("load", onChunkUploadFinished)
      request.addEventListener("error", onChunkUploadError)
      request.addEventListener("timeout", onChunkUploadError)
      request.setRequestHeader("Content-Range", `bytes=${startingByte} - ${startingByte + chunk.size} / ${file.size}`)
      request.setRequestHeader("X-File-Id", uploadId)
      request.setRequestHeader("X-File-Type", file.type)
      request.setRequestHeader("Authorization", `Bearer ${authData.access_token}`)
      request.timeout = 10000
      request.send(formData)
    }

    const uploadParams = {
      albumid,
      filename: file.name,
      filetype: "application/MediaStream",
      filesize: 0,
    }
    fetch(`${config.API_HOST}/multiupload/request/`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(uploadParams),
    })
      .then(async resp => {
        console.log(resp)
        const respData = await resp.json()
        fileId = respData.fileID
        uploadId = respData.uploadID
        console.log("uploadId", uploadId)
        uploadChunk()
      })
      .catch(err => {
        reject(err)
      })
  })
}

export default class extends Controller {
  static get targets() {
    return ["form", "fileSelector", "fileSelectorPreview", "tags", "location", "submitButton"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  async submit(e) {
    if (e) e.preventDefault()

    // CREATE ALBUM
    // const createAlbumResp = await createAlbum()
    // const albumId = createAlbumResp.data[0].albumid

    this.albumId = 84

    // UPDATE ALBUM DATA
    const uploadedFiles = {}
    const formData = new FormData(this.formTarget)
    formData.set("albumid", this.albumId)
    formData.set("album_title", this.albumId)
    formData.set("tags", this.tagsTarget.selectizeControl.value.join(", "))
    formData.set("addressline", this.locationTarget.selectizeControl.value.join(", "))

    editAlbum(JSON.stringify(Object.fromEntries(formData)))
      .then(resp => {
        console.log(resp)
      })
      .catch(err => {
        this.errorMessageHandler(err)
      })

    // START FILE UPLOAD
    this.fileSelectorPreviewTarget.childNodes.forEach(async fileNode => {
      const fileId = await uploadFile(fileNode, this.albumId)
      uploadedFiles[fileId] = `${fileNode.file.name}`

      console.log(uploadedFiles)
      formData.set(`original_photos`, JSON.stringify(uploadedFiles))
      await delay(1200)
      await editAlbum(formData)
    })
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

    return errorMessages[text] || text
  }

  chooseFiles(e) {
    e.preventDefault()
    this.fileSelectorTarget.click()
  }

  async updateImageDisplay() {
    // remove current items
    while (this.fileSelectorPreviewTarget.firstChild) {
      this.fileSelectorPreviewTarget.removeChild(this.fileSelectorPreviewTarget.firstChild)
    }

    const currentFiles = this.fileSelectorTarget.files
    if (currentFiles.length === 0) {
      const cancelMessage = document.createElement("div")
      cancelMessage.className = "cancelled small"
      cancelMessage.textContent = await lang("upload_cancelled")
      this.fileSelectorPreviewTarget.appendChild(cancelMessage)
    } else {
      Array.from(currentFiles).forEach(file => {
        const template = document.getElementById("profile-upload-file")
        const fileNode = template.content.firstElementChild.cloneNode(true)
        this.fileSelectorPreviewTarget.appendChild(fileNode)
        fileNode.querySelector(".file-label").textContent = `${file.name} (${returnFileSize(file.size)})`
        fileNode.querySelector(".file-preview").style.backgroundImage = `url(${URL.createObjectURL(file)})`
        fileNode.file = file
      })
    }
    this.fileSelectorPreviewTarget.classList.add("is-visible")
  }
}
