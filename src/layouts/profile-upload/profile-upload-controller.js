import { Controller } from "stimulus"
import config from "../../data/siteConfig"
import { trigger, lang, getLocale } from "../../js/utils"
import { initUploader } from "../../js/multiupload"
// import { axios } from "axios"

const axios = require("axios").default;

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

/***
 * Create empty album
 * Should be called when no albumid provided
 *
 * @returns		Album ID
 */
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

/***
 * Edit unsubmitted album data
 *
 * @param formData	Form data object
 * @returns			JSON: Modified rows count, new upload_album record
 */
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

/***
 * Submit uploaded album to moderators
 *
 * @param albumID	Album ID
 * @returns			JSON: Modified rows count, new upload_album record
 */
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



export default class extends Controller {
	static get targets() {
		return [
			"form",
			"fileSelector",
			"fileSelectorPreview",
			"submitButton",
			"albumid",
			"album_title",
			"title",
			"description",
			"hebrewtitle",
			"hebrewdescription",
			"originalphotos",
			"tags",
			"location",
		];
	}

	connect() {
		this.formTarget.submit = this.submit.bind(this)
	}

	async submit(e) {
		if (e) e.preventDefault()

		// CREATE ALBUM
		// const createAlbumResp = await createAlbum()
		// const albumId = createAlbumResp.data[0].albumid

		// TODO
		this.albumId = 84

		// UPDATE ALBUM DATA
		const uploadedFiles = {};
		const formData = new FormData(this.formTarget);
		formData.set("albumid", this.albumId.selectizeControl.value);
		formData.set("album_title", this.albumtitleTarget.selectizeControl.value);
		formData.set("title", this.titleTarget.selectizeControl.value);
		formData.set("description", this.descriptionTarget.selectizeControl.value);
		formData.set("hebrewtitle", this.hebrewtitleTarget.selectizeControl.value);
		formData.set("hebrewdescription", this.hebrewdescriptionTarget.selectizeControl.value);
		formData.set("tags", this.tagsTarget.selectizeControl.value.join(", "));
		formData.set("addressline", this.locationTarget.selectizeControl.value.join(", "));
		formData.set("original_photos", this.originalphotosTarget.selectizeControl.value);

		editAlbum(JSON.stringify(Object.fromEntries(formData)))
			.then(resp => {
				console.log(resp)
			})
			.catch(err => {
				this.errorMessageHandler(err)
			});
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
		const authData = JSON.parse(localStorage.getItem("auth")) || {}

		e.preventDefault();
		console.log("### ", JSON.stringify(e));
		console.log("@@@", this.initialized);
		if (!this.initialized) {
			/** /
						var initJSON = {
							baseElement: this,
							idListName: "originalphotos",
							fileSelectorName: "image_uploads",
							fileListName: "selected-files",
						}
			/**/
			var initJSON = {
				idListElement: this.originalphotosTarget,
				fileSelectorElement: this.fileSelectorTarget,
				fileListElement: this.fileSelectorPreviewTarget,
			}
			/**/
			var xaxios = new axios.create();
			xaxios.defaults.headers.post["Authorization"] = `Bearer ${authData.access_token}`;
			initUploader(initJSON, xaxios, "");
			this.initialized = true;
		};
		this.fileSelectorTarget.click();
	}


	async updateImageDisplay() {
		this.fileSelectorPreviewTarget.classList.add("is-visible");
		/*
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
		*/
	}
}

/** /
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
/**/