import config from "../../data/siteConfig";
import { Controller } from "stimulus";
import { trigger, lang, getLocale, getURLParams } from "../../js/utils";
import { initUploader, findElementByClassName } from "../../js/multiupload";
import { datepicker } from "../../js/datepicker";

const axios = require("axios").default;
// const datepicker = require("js-datepicker").default;



/**
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
 * Load album list
 *
 * @returns		JSON album record
 */
const getAlbumList = async id => {
	let resp = null
	console.log(`${config.API_HOST}/mydata/getalbumlist`);
	const authData = JSON.parse(localStorage.getItem("auth")) || {}
	if (authData.access_token) {
		resp = await fetch(`${config.API_HOST}/mydata/getalbumlist`, {
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
		resp = await fetch(`${config.API_HOST}/mydata/submitalbum?albumid=${albumId}`, {
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
			"submitalbum",
			"submitalbumbutton",
			"savealbumbutton",
			"albumid",
			"albumtitle",
			"title",
			"description",
			"hebrewtitle",
			"hebrewdescription",
			"originalphotos",
			"tags",
			"date",
			"date_approx",
			"location",
			"uploadalbum",
			"uploadlist",
			"uploadalbumlist",
			"saveindicator",
			"loadindicator",
			"thankyou",
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
		function pageReady (that) {
			var saveDelay;

			that.loadindicatorTarget.style.display = "none";

			var formInputs = [
				that.albumtitleTarget,
				that.titleTarget,
				that.descriptionTarget,
				that.hebrewtitleTarget,
				that.hebrewdescriptionTarget,
				that.originalphotosTarget,
				that.tagsTarget,
				that.dateTarget,
				that.date_approxTarget,
			 	that.locationTarget,
			];

			formInputs.forEach ((item) => {
				item.addEventListener('change', resetSaveDelay);
				item.addEventListener('keyup', resetSaveDelay);
			});

			function startSaveDelay () {
				saveDelay = setTimeout (saveAll, 5000);
			}

			function resetSaveDelay () {
				try { clearTimeout (saveDelay); } catch (e) { ; };
				startSaveDelay ();
			}

			function saveAll () {
				// alert ("Changed");
				clearTimeout (saveDelay);
				// that.savealbumbuttonTarget.click();
				that.submit (null);
			}
		}

		const fillData = (res) => {
			const datePicker = datepicker (this.dateTarget, {
				formatter: (input, date, instance) => {
    				const value = date.toLocaleDateString ("en-GB");
    				input.value = value; // => '1/1/2099';
				}
			});
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
				this.dateTarget.value = res.data[0].date || "";
				this.date_approxTarget.checked = res.data[0].approx ? 1 : 0;
				
				this.initUploaderComponent(res.data[0].original_photos, res.data[0].albumid);
			};
		};

		var id = getURLParams().id;
		switch (id) {
			case (id > 0 ? id : 0):
				lang ("upload")
				.then ((txt) => {
					var pageTitle = findElementByClassName (this.uploadlistTarget, "profile-content__title");
					pageTitle.innerHTML = txt + " (" + id.toString () + ")"; 				
				})
				.catch ((e) => {});
				
				getAlbum(id)
					.then((res) => {
						this.uploadalbumTarget.style.display = "block";
						this.uploadlistTarget.style.display = "none";
						fillData(res);
						pageReady(this);
					});
				break;
			case "myalbums":
				lang ("my_uploads")
				.then ((txt) => {
					var pageTitle = findElementByClassName (this.uploadlistTarget, "profile-content__title");
					pageTitle.innerHTML = txt; 				
				})
				.catch ((e) => {});
				
				this.uploadlistTarget.style.display = "block";
				this.uploadalbumTarget.style.display = "none";
				
				{
					const listElement = document.createElement ("li");
					listElement.className = "profile-upload__album-list";
					const listLink = document.createElement ("a");
					listLink.href = "/en/profile/upload?id=add";
					lang ("new_topic").then ((res) => {	listLink.text = "New"; });
					listElement.appendChild (listLink);
					this.uploadlistTarget.appendChild (listElement);
				}

				getAlbumList ()
				.then ((res) => {
					res.data.forEach (n => {findElementByClassName
						console.log (JSON.stringify (n));
						const listElement = document.createElement ("li");
						listElement.className = "profile-upload__album-list";
						const listLink = document.createElement ("a");
						listLink.href = "/en/profile/upload?id=" + n.albumid;
						// listLink.className = "profile-upload__album-list";
						listLink.text = n.date + " - " + n.album_title;
						listElement.appendChild (listLink);
						this.uploadlistTarget.appendChild (listElement);
					// };
					});
					pageReady(this);
				})
				break;
			case "new":
			case "add":
			default:
				createAlbum()
				.then((res) => {
					this.uploadalbumTarget.style.display = "block";
					this.uploadlistTarget.style.display = "none";
					fillData(res);	
					lang ("upload")
					.then ((txt) => {
						var pageTitle = findElementByClassName (this.uploadlistTarget, "profile-content__title");
						pageTitle.innerHTML = txt + " (" + res.data[0].albumid.toString () + ")"; 				
				})
				.catch ((e) => {});
					pageReady(this);
				});
				break;
		};
	}


	async finish(e) {
		if (e) e.preventDefault();

		this.saveindicatorTarget.style.display = "block";
		submitAlbum (this.albumidTarget.value)
		.then ((res) => {
			console.log (res);
			this.saveindicatorTarget.style.display = "none";
			this.uploadalbumTarget.style.display = "none";
			this.thankyouTarget.style.display = "block";
		});
	}


	async submit(e) {
		if (e) e.preventDefault();

		this.saveindicatorTarget.style.display = "block";

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
		formData["date"] = this.dateTarget.value.length < 6 ? "null" : this.dateTarget.value;
		formData["approx"] = this.date_approxTarget.checked ? "true" : "false";
		formData["original_photos"] = JSON.parse(this.originalphotosTarget.value);
		/**/

		console.log("### formdata - ", JSON.stringify(formData));

		editAlbum(formData)
			.then(resp => {
				console.log(resp)
				this.saveindicatorTarget.style.display = "none";
			})
			.catch(err => {
				this.errorMessageHandler(err)
				this.saveindicatorTarget.style.display = "none";
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
