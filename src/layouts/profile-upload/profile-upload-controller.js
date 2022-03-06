import { Controller } from "stimulus"
import config from "../../data/siteConfig"
import { trigger, lang, getLocale, getURLParams } from "../../js/utils"
import { initUploader } from "../../js/multiupload"

const axios = require("axios").default;



/***
 * API call wrapper
 *
 * @param endpoint	Endpoint path without hostname
 * @param method	[GET|POST] TODO - Implement full REST
 * @param headers	Custom headers. Optional.
 * @param body		Request body for POST call. Optional.
 * @param timeout   Timeout, default 10s
 * @param retry		Retry count before throwing network error exception. Default 3 
 * @returns			result JSON
 * @throws          timeoutException
 */
async function apiCall(endpoint, method, headers = {}, body = {}, timeout = 10000, retry = 3) {
	const authData = JSON.parse(localStorage.getItem("auth")) || {}

	if (authData.access_token) {
		var aaxios = new axios.create();
		aaxios.defaults.headers.post["Authorization"] = `Bearer ${authData.access_token}`;
		switch (method) {
			case "GET":
				aaxios.defaults.headers.get["Authorization"] = `Bearer ${authData.access_token}`;
				aaxios.defaults.headers.get += headers;
				aaxios.get(`${config.API_HOST}/${endpoint}`)
					.then((res) => {
						return (res);
					})
					.catch((e) => {
						throw (e);
					});
				break;
			case "POST":
				aaxios.defaults.headers.post["Authorization"] = `Bearer ${authData.access_token}`;
				aaxios.defaults.headers.post += headers;
				aaxios.post(`${config.API_HOST}/${endpoint}`, body)
					.then((res) => {
						return (res);
					})
					.catch((e) => {
						throw (e);
					});
				break;
			default:
				throw new Error("Invalid request method");
		};
	} else throw new Error("Unauthorized call");
}



/***
 * Create empty album
 * Should be called when no albumid provided
 *
 * @returns		JSON album record
 */
const createAlbum = async () => {
	let resp = null
	/** /
		await apiCall ("/mydata/createalbum", "GET")
		.then ((res) => {
			console.log (JSON.stringify (res));
			return (res);		
		})
		.catch ((e) => {
			console.error (e);
			throw (e);
		})
	/**/
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
	/**/
}



/***
 * Load album data
 *
 * @returns		JSON album record
 */
const getAlbum = async id => {
	let resp = null
	console.log(`${config.API_HOST}/mydata/getalbum?albumid=${id}`);
	const authData = JSON.parse(localStorage.getItem("auth")) || {}
	if (authData.access_token) {
		resp = await fetch(`${config.API_HOST}/mydata/getalbum?albumid=${id}`, {
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



/***
 * Edit unsubmitted album data
 *
 * @param formData	Form data object
 * @returns			JSON: Modified rows count, new upload_album record
 */
const editAlbum = async formData => {
	let resp = null
	const authData = JSON.parse(localStorage.getItem("auth")) || {}
	/*
		const jsonData = JSON.stringify(Object.fromEntries(formData))
			.replace(/\\"/g, '"')
			.replace(/:"{"/g, ':{"')
			.replace(/"}"/g, '"}') */
	if (authData.access_token) {
		resp = await fetch(`${config.API_HOST}/mydata/editalbum`, {
			method: "POST",
			mode: "cors",
			headers: {
				Authorization: `Bearer ${authData.access_token}`,
				"Content-Type": "application/json; charset=utf-8",
			},
			body: JSON.stringify(formData),
		});
	};
	return resp ? resp.json() : resp;
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
			"albumtitle",
			"title",
			"description",
			"hebrewtitle",
			"hebrewdescription",
			"originalphotos",
			"tags",
			"location",
		];
	}



	initUploaderComponent(value = {}, albumid = 0) {
		const authData = JSON.parse(localStorage.getItem("auth")) || {}

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
			initUploader(initJSON, xaxios, value, albumid);
			this.initialized = true;
		};
	}



	connect() {
		console.log("### connect");

		this.onPopState();
		this.formTarget.submit = this.submit.bind(this);
	}



	onPopState() {
		const fillData = (res) => {
			console.log(JSON.stringify(res));

			if (res.count > 0) {
				console.log("### albumid", res.data[0].albumid);

				this.albumidTarget.value = res.data[0].albumid;
				this.albumtitleTarget.value = res.data[0].album_title || "";
				this.titleTarget.value = res.data[0].title || "";
				this.descriptionTarget.value = res.data[0].description || "";
				this.hebrewtitleTarget.value = res.data[0].hebrew_title || "";
				this.hebrewdescriptionTarget.value = res.data[0].hebrew_description || "";
				this.originalphotosTarget.value = JSON.stringify(res.data[0].original_photos) || "";
				this.tagsTarget.value = res.data[0].tags || "";
				this.locationTarget.value = res.data[0].addressline || "";

				this.initUploaderComponent(res.data[0].original_photos, res.data[0].albumid);
			};
		};

		var id = getURLParams().id;
		if (id > 0) {
			getAlbum(id)
				.then((res) => fillData(res));
		} else /* if (id == "new") */ {
			createAlbum()
				.then((res) => fillData(res));
		} /* else {
			// TODO - Implement Album list here
		}*/;
	}


	async submit(e) {
		if (e) e.preventDefault();

		// CREATE ALBUM

		// const createAlbumResp = await createAlbum()
		// const albumId = createAlbumResp.data[0].albumid

		/** /
				// UPDATE ALBUM DATA
				const formData = new FormData(this.formTarget);
				formData.set("albumid", this.albumidTarget.value);
				formData.set("album_title", this.albumtitleTarget.value);
				formData.set("title", this.titleTarget.value);
				formData.set("description", this.descriptionTarget.value);
				formData.set("hebrewtitle", this.hebrewtitleTarget.value);
				formData.set("hebrewdescription", this.hebrewdescriptionTarget.value);
				formData.set("tags", this.tagsTarget.selectizeControl.value.join(", "));
				formData.set("addressline", this.locationTarget.selectizeControl.value.join(", "));
				formData.set("original_photos", this.originalphotosTarget.value);
		/**/
		// UPDATE ALBUM DATA
		var formData = {};
		formData["albumid"] = this.albumidTarget.value;
		formData["album_title"] = this.albumtitleTarget.value;
		formData["title"] = this.titleTarget.value;
		formData["description"] = this.descriptionTarget.value;
		formData["hebrewtitle"] = this.hebrewtitleTarget.value;
		formData["hebrewdescription"] = this.hebrewdescriptionTarget.value;
		formData["tags"] = this.tagsTarget.selectizeControl.value.join(", ");
		formData["addressline"] = this.locationTarget.selectizeControl.value.join(", ");
		formData["original_photos"] = JSON.parse(this.originalphotosTarget.value);
		/**/

		console.log("### formdata - ", JSON.stringify(formData));

		editAlbum(formData)
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
		console.error("errorHandler: ", text);

		const errorMessages = {
			"The user has not been activated or is blocked.": await lang("user_signin_error"),
			"Invalid user credentials.": await lang("user_signin_error"),
			'"email" must be a valid email': await lang("user_signin_error"),
			'"email" is not allowed to be empty': await lang("user_signin_error"),
		}

		return errorMessages[text] || text
	}



	chooseFiles(e) {
		e.preventDefault();
		this.initUploaderComponent();
		this.fileSelectorTarget.click();
	}

}
