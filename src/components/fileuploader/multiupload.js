console.log("$$$ multiupload.js")
// initUploader (uploadButton, uploadList);

/**
 * Find DOM element by classname, recursively
 *
 * @param element		initial DOM element
 * @param className		class name to look for
 * @param depth			search depth. Optional, 10 if not specified
 * @returns				first DOM element in the list if found, null if not found
 */
export function findElementByClassName(element, className, depth = 10) {
  var e = element

  for (var n = depth; n-- > 0; e = e.parentElement)
    if (e.getElementsByClassName(className).length > 0) return e.getElementsByClassName(className)[0]
  return null
}

/**
 * Uploader init function
 *
 * @param fileInput		file selector element
 * @param iaxios		directus system API instance for axios calls
 * @param value			inputbox value coming from the database
 * @param albumid		album id to attach files to. Optional, TODO
 */
export function initUploader(fileInput, iaxios, value, albumid = 0) {
  /**
   * Static variables
   */
  const fileRequests = new WeakMap()
  var fileList
  var fileEdit
  var fileHandles = {}

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

  const defaultOptions = {
    url: ENDPOINTS.UPLOAD,
    startingByte: 0,
    sliceSize: 262144,

    uploadID: "",
    onAbort() {},
    onProgress() {},
    onError() {},
    onComplete() {},
  }

  var systemAPI = iaxios
  var fileElement = fileInput
  fileHandles = value == null ? {} : value
  try {
    JSON.stringify(fileHandles)
  } catch (e) {
    fileHandles = {}
  }

  console.log("@@@ InitUploader called")

  fileList = findElementByClassName(fileElement, "multiupload_list")
  fileEdit = findElementByClassName(fileElement, "multiupload_edit")

  if (fileHandles != null)
    Object.entries(fileHandles).forEach(([key, value]) => {
      var xfile = {}
      xfile.uploadID = key
      xfile.name = value
      xfile.uploadStatus = UPLOADSTATUS.COMPLETED

      listAddControl(xfile)
      listSetFinished(xfile)
    })

  fileInput.addEventListener("change", event => {
    startUploadProcess(fileInput, systemAPI)
    // event.currentTarget.value = '';
  })

  function listAddControl(file, event) {
    const progressBar = document.createElement("div")
    progressBar.style = "width: 100%; background: #eee; padding: 10px;"
    // progressBar.style.background = "linear-gradient (to right, #eee 0%, #eee 50%, #557 50%, #557 100% );";
    fileList.appendChild(progressBar)

    const progressButton = document.createElement("div")
    progressButton.style =
      "background: white; location: relative; float: right; border: solid black; border-radius: 10px; padding-left: 5px; padding-right: 5px;"
    progressButton.addEventListener("click", () => event(file))
    progressButton.file = file
    progressBar.appendChild(progressButton)

    const progressButtonLabel = document.createElement("div")
    progressButtonLabel.style = "background: transparent;"
    progressButtonLabel.innerText = " ⌛ "
    progressButton.appendChild(progressButtonLabel)

    const progressErrorSign = document.createElement("div")
    progressErrorSign.style = "background: transparent; location: relative; float: right; display: none; padding: 5px;"
    progressErrorSign.innerText = " ⚠️ "
    progressBar.appendChild(progressErrorSign)

    const progressText = document.createElement("div")
    progressText.style = "background: transparent;"
    progressText.innerText = file.name
    progressBar.appendChild(progressText)

    file.progressBar = progressBar
    file.progressButton = progressButton
    file.progressButtonLabel = progressButtonLabel
    file.progressText = progressText
    file.progressErrorSign = progressErrorSign
    file.uploadStatus = UPLOADSTATUS.WAITING
    file.iaxios = iaxios
  }

  function listSetWaiting(filex) {
    filex.progressButtonLabel.innerText = " ⌛ "
  }
  function listSetProgress(filex) {
    filex.progressText.innerText = filex.name + " - " + filex.percentage + "%"
    filex.progressButtonLabel.innerText = " ⏸︎ "
  }
  function listSetStopped(filex) {
    filex.progressButtonLabel.innerText = " ▷ "
  }
  function listSetPaused(filex) {}
  function listSetError(filex) {
    filex.progressButtonLabel.innerText = " ↺ "
    filex.progressErrorSign.style.display = "block"
  }
  function listSetFinished(filex) {
    // filex.progressErrorSign.style.display = "none";
    // filex.progressButton.style.display = "";
    filex.progressButtonLabel.innerText = " x "
    filex.progressText.innerHTML =
      "<image src='/assets/" +
      filex.uploadID +
      "?key=thumb' style='position: relative; float: left; height: 25px; padding-left: 5px; padding-right: 5px; width: 64px;'>" +
      "<a target='_blank' href='/assets/" +
      filex.uploadID +
      "?key=full'>" +
      filex.name +
      "</a>"
    filex.progressText.style.color = "blue"
  }

  /***
   * Start upload process
   *
   * @param fileElement	file selector element
   * @param iaxios		directus system API instance for axios calls
   */
  function startUploadProcess(fileElement, iaxios) {
    /***
     * Upload and track files
     */
    const uploadAndTrackFiles = (() => {
      // const fileList = document.getElementById (uploadList);
      // const fileList = fileElement;
      // const file = fileElement.files;

      var uploader = null

      const setFileElement = file => {
        listAddControl(file, progressButtonClick)
        // create file element here⏹
      }

      function progressButtonClick(filex) {
        /**  /		
				var targ;

				if (!e) var e = window.event;
				if (e.target) targ = e.target;
				else if (e.srcElement) targ = e.srcElement;
				if (targ.nodeType == 3) // defeat Safari bug
				targ = targ.parentNode;
		/**/

        switch (filex.uploadStatus) {
          case UPLOADSTATUS.PROGRESS:
          case UPLOADSTATUS.WAITING:
            uploader.abortFileUpload(filex)
            filex.uploadStatus = UPLOADSTATUS.STOPPED
            listSetStopped(filex)
            break
          case UPLOADSTATUS.ERROR:
            filex.progressErrorSign.style.display = "none"
          case UPLOADSTATUS.STOPPED:
          default:
            uploader.resumeFileUpload(filex)
            filex.uploadStatus = UPLOADSTATUS.WAITING
            listSetWaiting(filex)
            break
        }
      }

      const onProgress = (e, filex) => {
        // console.log ("onProgress ", filex.name, " - ", JSON.stringify (e));
        filex.percentage = Math.floor(e.percentage < 100 ? e.percentage : 100)
        filex.uploadStatus = UPLOADSTATUS.PROGRESS
        listSetProgress(filex)
      }
      const onError = (e, filex) => {
        filex.uploadStatus = UPLOADSTATUS.ERROR
        listSetError(filex)
        console.log("onError ", filex.name, " - ", JSON.stringify(e))
      }
      const onAbort = (e, filex) => {
        filex.uploadStatus = UPLOADSTATUS.STOPPED
        listSetStopped(filex)
        console.log("onAbort ", filex.name, " - ", JSON.stringify(e))
      }
      const onComplete = (e, filex) => {
        if (filex.percentage < 100) {
          uploader.resumeFileUpload(filex)
        } else {
          const fileReq = fileRequests.get(filex)
          filex.uploadStatus = UPLOADSTATUS.COMPLETED

          setTimeout(() => {
            listSetFinished(filex)
            fileHandles[fileReq.options.fileID] = filex.name
            fileEdit.value = JSON.stringify(fileHandles)
            fileEdit.dispatchEvent(new Event("change"))
            // filex.progressText.style.textDecoration = "underline";
          }, 2000)
        }
      }

      return uploadedFiles => {
        //[...uploadedFiles].forEach (setFileElement);
        ;[...uploadedFiles].forEach(setFileElement)
        // document.body.appendChild (progressBox);
        uploader = uploadFiles(uploadedFiles, {
          onProgress,
          onError,
          onAbort,
          onComplete,
        })
      }
    })()

    /***
     * UploadFiles worker
     */

    const uploadFiles = (() => {
      /** */
      const uploadFile = (file, options) => {
        console.log("###/ - ", JSON.stringify(file.name))

        /** /
				return fetch (ENDPOINTS.UPLOAD_REQUEST, {
					mode: 'cors',
					method: 'POST',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'X-XSRF-TOKEN': getCookieValue('XSRF-TOKEN') // TODO
					},
					body: JSON.stringify ({
						filename: file.name,
					}),
				})
				.then (res => res.json ())
				.then (res => {
					options = {...options, ...res};
					fileRequests.set (file, {request: null, options});
					uploadFileChunks (file, options);
				})
				.catch (e => {
					options.onError ({...e, file})
				});
		/** /
				var formData = new FormData ();
				const req = new XMLHttpRequest ();

				req.open ('POST', systemAPI.addTokenToURL (ENDPOINTS.UPLOAD_REQUEST), true);
				req.withCredentials = true;
				req.setRequestHeader ('Content-Type', 'application/json');
				req.onload = (e) => {
					if (req.status === 200) {
						console.log ("### RESULT: " , req.responseText);
						const res = JSON.parse (req.responseText);
						options = {...options, ...res};
						fileRequests.set (file, {request: null, options});
						uploadFileChunks (file, options);
					} else options.onError ({...e, file}); 
				};
				req.onerror = (e) => {
					options.onError ({...e, file})
				};
				req.send (
					JSON.stringify ({
						filename: file.name,
						filetype: "application/MediaStream",
						filesize: 0,
					})
				);
		/**/
        // API call with correct credentials
        console.log("@@@ iaxios : ", JSON.stringify(iaxios.post))
        iaxios
          .post(ENDPOINTS.UPLOAD_REQUEST, {
            filename: file.name,
            filetype: "application/MediaStream",
            filesize: 0,
          })
          .then(res => {
            options = { ...options, ...res.data }
            fileRequests.set(file, { request: null, options })
            uploadFileChunks(file, options)
          })
          .catch(e => {
            options.onError({ ...e, file })
          })
        /**/
      }

      /** */
      const abortFileUpload = file => {
        const fileReq = fileRequests.get(file)

        if (fileReq && fileReq.request) {
          fileReq.request.abort()
          return true
        }

        return false
      }

      /** */
      const retryFileUpload = file => {
        const fileReq = fileRequests.get(file)

        if (fileReq) {
          // try to get the status just in case it failed mid upload
          return fetch(`${ENDPOINTS.UPLOAD_STATUS}?fileName=${file.name}&uploadid=${fileReq.options.uploadID}`)
            .then(res => res.json())
            .then(res => {
              // if uploaded we continue
              uploadFileChunks(file, {
                ...fileReq.options,
                startingByte: Number(res.uploadSize),
              })
            })
            .catch(() => {
              // if never uploaded we start
              uploadFileChunks(file, fileReq.options)
            })
        }
      }

      /** */
      const clearFileUpload = file => {}

      /** */
      const resumeFileUpload = file => {
        const fileReq = fileRequests.get(file)
        if (fileReq) {
          return fetch(`${ENDPOINTS.UPLOAD_STATUS}?filename=${file.name}&uploadid=${fileReq.options.uploadID}`)
            .then(res => res.json())
            .then(res => {
              uploadFileChunks(file, {
                ...fileReq.options,
                startingByte: Number(res.uploadSize),
              })
            })
            .catch(e => {
              fileReq.options.onError(e, file)
            })
        }
      }

      function addProgressBar(file) {
        // TODO
      }

      return (files, options = defaultOptions) => {
        ;[...files].forEach(file => {
          uploadFile(file, { ...defaultOptions, ...options })
        })

        return {
          abortFileUpload,
          retryFileUpload,
          clearFileUpload,
          resumeFileUpload,
        }
      }
    })()

    /***
     * Upload main worker process
     */

    const uploadFileChunks = (file, options) => {
      const formData = new FormData()
      const chunk = file.slice(options.startingByte, options.startingByte + options.sliceSize)
      file.uploadID = options.uploadID

      formData.append("uploadid", options.uploadID)
      formData.append("type", file.type)
      formData.append("chunk", chunk, file.name)

      /** /
			
			const req = new XMLHttpRequest ();

			req.open ('POST', options.url, true);
			req.withCredentials = true;
			req.setRequestHeader (
				'Content-Range',
				`bytes=${options.startingByte} - ${options.startingByte + chunk.size} / ${file.size}`
			);
			req.setRequestHeader ('X-File-Id', options.uploadID);
				
			req.onload = (e) => {
				// it is possible for load 
					// to be called when the request status is not 200
				// this will treat 200 only as success 
					// and everything else as failure
				if (req.status === 200) {
					options.onComplete (e, file);
				} else {
					options.onError (e, file);
				}
			};
				
			req.upload.onprogress = (e) => {
				const loaded = options.startingByte + e.loaded;
				options.onProgress ({
					...e,
					loaded,
					total: file.size,
					percentage: loaded * 100 / file.size,
				}, file);
			};
				
			req.ontimeout = (e) => options.onError (e, file);
				
			req.onabort = (e) => options.onAbort (e, file);
				
			req.onerror = (e) => options.onError (e, file);

			req.onfinish = (e) => { ; };
				
			fileRequests.get (file).request = req;
				
			req.send (formData);
	/**/

      systemAPI
        .post(options.url, formData, {
          headers: {
            "Content-Range": `bytes=${options.startingByte} - ${options.startingByte + chunk.size} / ${file.size}`,
            "X-File-Id": options.uploadID,
            "X-File-Type": file.type,
          },
          onUploadProgress: e => {
            const loaded = options.startingByte + e.loaded
            options.onProgress(
              {
                ...e,
                loaded,
                total: file.size,
                percentage: (loaded * 100) / file.size,
              },
              file
            )
          },
        })
        .catch(e => {
          options.onError(e, file)
        })
        .then(res => {
          // TODO - res is null on error
          if (res.status === 200) {
            options.onComplete(res, file)
          } else {
            options.onError(res, file)
          }
        })

      /**/
    }

    uploadAndTrackFiles(fileElement.files)
  }
}
