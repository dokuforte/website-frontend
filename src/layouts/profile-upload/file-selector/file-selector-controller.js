import { Controller } from "stimulus"
import axios from "axios"
import config from "../../../data/siteConfig"

const UPLOADSTATUS = {
  WAITING: 0,
  PROGRESS: 1,
  STOPPED: 2,
  ERROR: 3,
  COMPLETED: 4,
}

const ENDPOINTS = {
  UPLOAD: "/multiupload/data/",
  UPLOAD_STATUS: "/multiupload/status/",
  UPLOAD_REQUEST: "/multiupload/request/",
}

const DEFAULT_FILE_UPLOAD_PARAMS = {
  startingByte: 0,
  sliceSize: 262144,
}

export default class extends Controller {
  static get targets() {
    return ["fileSelector", "fileSelectorPreview", "file"]
  }

  connect() {
    // DOM element external functions
    this.element.addFiles = this.addFiles.bind(this)
    this.element.getUploadedFiles = this.getUploadedFiles.bind(this)

    // init axios
    const authData = JSON.parse(localStorage.getItem("auth")) || {}
    if (authData.access_token) {
      // eslint-disable-next-line new-cap
      this.axios = new axios.create()
      this.axios.defaults.headers.post.Authorization = `Bearer ${authData.access_token}`
    }
  }

  // When people hit the upload button, the file selector GUI is triggered
  chooseFiles(e) {
    e.preventDefault()
    this.fileSelectorTarget.click()
  }

  // Populate fileElements based on existing uploaded files data
  // this can be called externally
  addFiles(uploadedFiles) {
    this.fileSelectorPreviewTarget.classList.remove("is-hidden")

    Object.entries(uploadedFiles).forEach(([key, value]) => {
      const fileElement = this.createFileElement(key, value)
      fileElement.uploadParams = { uploadID: key }
      fileElement.file = { name: value }
      fileElement.dataset.status = UPLOADSTATUS.COMPLETED
    })
  }

  // returns a list of already uploaded files in an object
  getUploadedFiles() {
    const items = {}
    this.fileTargets.forEach(file => {
      if (Number(file.dataset.status) === UPLOADSTATUS.COMPLETED) {
        items[file.uploadParams.uploadID] = file.file.name
      }
    })
    return items
  }

  createFileElement(uploadId, fileName) {
    const template = document.getElementById("file-selector-item")
    const fileElement = template.content.firstElementChild.cloneNode(true)
    this.fileSelectorPreviewTarget.appendChild(fileElement)

    if (uploadId) {
      fileElement.querySelector(
        ".file-selector-item__preview"
      ).style.backgroundImage = `url(${config.API_HOST}/assets/${uploadId}?key=thumb)`
      // ?key=full
    }
    fileElement.querySelector(".file-selector-item__label").innerText = fileName

    // init delete and retry buttons
    fileElement.querySelector(".file-selector-item__remove").parentFileElement = fileElement
    fileElement.querySelector(".file-selector-item__retry").parentFileElement = fileElement

    return fileElement
  }

  removeFileElement(e) {
    e.currentTarget.parentFileElement.remove()

    if (this.fileTargets.length === 0) this.fileSelectorPreviewTarget.classList.add("is-hidden")
  }

  startUpload(e) {
    Array.from(e.currentTarget.files).forEach(file => {
      this.fileSelectorPreviewTarget.classList.remove("is-hidden")

      const fileElement = this.createFileElement(null, file.name)
      fileElement.file = file
      fileElement.uploadParams = DEFAULT_FILE_UPLOAD_PARAMS

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.addEventListener("load", event => {
        fileElement.querySelector(".file-selector-item__preview").style.backgroundImage = `url(${event.target.result})`
      })

      this.startUploadFile(fileElement)
    })
  }

  onUploadError(err, fileElement) {
    fileElement.dataset.status = UPLOADSTATUS.ERROR
    console.log("onError ", fileElement.file.name, " - ", JSON.stringify(err))
  }

  onUploadProgress(fileElement) {
    fileElement.dataset.status = UPLOADSTATUS.PROGRESS
    const percentage = `${Math.floor(fileElement.uploadParams.percentage)}%`
    fileElement.querySelector(".file-selector-item__label").innerText = `${fileElement.file.name}`
    fileElement.querySelector(".file-selector-item__percentage").innerText = `(${percentage})`
    fileElement.querySelector(".file-selector-item__progress").style.width = percentage
  }

  onUploadComplete(fileElement) {
    if (fileElement.uploadParams.percentage < 100) {
      this.resumeFileUpload(fileElement)
    } else {
      fileElement.dataset.status = UPLOADSTATUS.COMPLETED
    }
  }

  startUploadFile(fileElement) {
    // API call with correct credentials
    this.axios
      .post(`${config.API_HOST}${ENDPOINTS.UPLOAD_REQUEST}`, {
        filename: fileElement.file.name,
        filetype: "application/MediaStream",
        filesize: 0,
      })
      .then(res => {
        fileElement.uploadParams = { ...fileElement.uploadParams, ...res.data }
        this.uploadFileChunks(fileElement)
      })
      .catch(err => {
        this.onUploadError(err, fileElement)
      })
  }

  abortUpload(e) {
    const fileElement = e.currentTarget.parentNode.parentNode
    fileElement.dataset.status = UPLOADSTATUS.STOPPED
  }

  resumeFileUpload(el) {
    const fileElement = el.currentTarget ? el.currentTarget.parentFileElement : el

    fileElement.dataset.status = UPLOADSTATUS.WAITING
    // try to get the status just in case it failed mid upload
    fetch(
      `${config.API_HOST}${ENDPOINTS.UPLOAD_STATUS}?filename=${fileElement.file.name}&uploadid=${fileElement.uploadParams.uploadID}`
    )
      .then(res => res.json())
      .then(res => {
        // if uploaded we continue
        fileElement.uploadParams.startingByte = Number(res.uploadSize)
        this.uploadFileChunks(fileElement)
      })
      .catch(err => {
        // there was something else, so the upload should stop
        this.onUploadError(err, fileElement)
      })
  }

  uploadFileChunks(fileElement) {
    const chunk = fileElement.file.slice(
      fileElement.uploadParams.startingByte,
      fileElement.uploadParams.startingByte + fileElement.uploadParams.sliceSize
    )

    const formData = new FormData()
    formData.append("uploadid", fileElement.uploadParams.uploadID)
    formData.append("type", fileElement.uploadParams.type)
    formData.append("chunk", chunk, fileElement.file.name)

    this.axios
      .post(`${config.API_HOST}${ENDPOINTS.UPLOAD}`, formData, {
        headers: {
          "Content-Range": `bytes=${fileElement.uploadParams.startingByte} - ${fileElement.uploadParams.startingByte +
            chunk.size} / ${fileElement.file.size}`,
          "X-File-Id": fileElement.uploadParams.uploadID,
          "X-File-Type": fileElement.uploadParams.type,
        },
        onUploadProgress: e => {
          const loaded = fileElement.uploadParams.startingByte + e.loaded
          fileElement.uploadParams.percentage = (loaded * 100) / fileElement.file.size
          this.onUploadProgress(fileElement)
        },
      })
      .catch(err => {
        this.onUploadError(err, fileElement)
      })
      .then(res => {
        if (res && res.status === 200) {
          this.onUploadComplete(fileElement)
        } else {
          this.onUploadError(res, fileElement)
        }
      })
  }
}
