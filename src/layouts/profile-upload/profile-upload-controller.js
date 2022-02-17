import { Controller } from "stimulus"
import config from "../../data/siteConfig"
import { trigger, lang, getLocale } from "../../js/utils"

const SLICE_SIZE = 262144

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
  if (authData.access_token) {
    const queryParams = new URLSearchParams(formData).toString()
    resp = await fetch(`${config.API_HOST}/mydata/editalbum?${queryParams}`, {
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

const uploadFile = (fileNode, albumid) => {
  return new Promise((resolve, reject) => {
    const authData = JSON.parse(localStorage.getItem("auth")) || {}
    if (!authData.access_token) reject()

    const { file } = fileNode
    let fileId
    let uploadId
    let startingByte = 0
    let uploadSize = 0

    const checkUploadProgress = async () => {
      const statusResp = await fetch(
        `${config.API_HOST}/multiupload/status/?fileName=${file.name}&uploadid=${uploadId}`
      )

      const statusRespData = await statusResp.json()
      console.log("checkUploadSize", statusRespData.uploadSize)
      return statusRespData.uploadSize
    }

    const onChunkUploadProgress = e => {
      uploadSize = startingByte + e.loaded
      console.log("chunkUploadProgress", uploadSize)
    }

    const onChunkUploadFinished = async res => {
      if (res.status === 200) {
        uploadSize = await checkUploadProgress()
        if (file.size === uploadSize) {
          console.log("uploadIsDone")
          resolve(fileId)
        } else {
          startingByte = uploadSize
          console.log("uploadNextChunk", startingByte)
          uploadChunk()
        }
      }
    }

    const onChunkUploadError = err => {
      // TODO: retry 2-3 times to upload the chunk then reject
      console.log("uploadError", err)
      reject()
    }

    const uploadChunk = () => {
      const formData = new FormData()
      const chunk = file.slice(startingByte, startingByte + SLICE_SIZE)
      formData.append("uploadid", uploadId)
      formData.append("type", file.type)
      formData.append("chunk", chunk, file.name)

      fetch(`${config.API_HOST}/multiupload/data/`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Range": `bytes=${startingByte} - ${startingByte + chunk.size} / ${file.size}`,
          "X-File-Id": uploadId,
          "X-File-Type": file.type,
          Authorization: `Bearer ${authData.access_token}`,
        },
        body: formData,
      })
        .then(resp => {
          console.log("chunkUploadFinished", resp)
          onChunkUploadFinished()
        })
        .catch(err => {
          onChunkUploadError(err)
        })
    }

    const uploadParams = {
      albumid,
      filename: file.name,
      filetype: "application/MediaStream",
      filesize: 0,
    }
    const uploadParamsString = new URLSearchParams(uploadParams).toString()
    fetch(`${config.API_HOST}/multiupload/request/?${uploadParamsString}`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
      // body: JSON.stringify(),
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

    editAlbum(formData)
      .then(resp => {
        console.log(resp)
      })
      .catch(e => {
        this.errorMessageHandler(e)
      })

    // START FILE UPLOAD
    this.fileSelectorPreviewTarget.childNodes.forEach(async fileNode => {
      const fileId = await uploadFile(fileNode, this.albumId)
      uploadedFiles[fileId] = `²±${fileNode.file.name}`

      console.log(uploadedFiles)
      formData.set("original_photos", uploadedFiles)
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
