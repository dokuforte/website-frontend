import siteConfig from "../data/siteConfig"
import langData from "../data/lang.json"

export const getLocale = () => {
  let lang = document.querySelector("body").dataset.lang || undefined
  lang = lang === "he" ? "il" : lang
  return lang
}

export const lang = (key) => {
  const l = langData[getLocale()]
  const val = l[key] ? l[key] : key
  return val.replace(/(?:\r\n|\r|\n)/g, "<br/>")
}

export const isTouchDevice = () => {
  return "ontouchstart" in window || window.navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0
}

export const trigger = (eventId, obj = {}, scope = document) => {
  const event = new CustomEvent(eventId, {
    detail: obj,
  })
  scope.dispatchEvent(event)
}

export const click = () => {
  return isTouchDevice() ? "touchstart" : "click"
}

export const getURLParams = () => {
  return Object.fromEntries(new URLSearchParams(window.location.search.substring(1)))
}

export const getPrettyURLValues = (path) => {
  const values = (path || window.location.pathname).split("/")
  while (values[0] === "") values.shift()
  while (values[values.length - 1] === "") values.pop()
  return values
}

export const removeClassByPrefix = (el, prefix) => {
  const regx = new RegExp(`\\b${prefix}(.[^\\s]*)?\\b`, "g")
  // eslint-disable-next-line no-param-reassign
  el.className = el.className.replace(regx, "")
  return el
}

export const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export const stripTags = (str) => {
  const element = document.createElement("div")
  element.innerHTML = str
  return element.innerText
}

export const slugify = (str, removeSpaces) => {
  let s = str.toString()

  const map = {
    a: "Ä|ä|À|à|Á|á|Â|â|Ã|ã|Å|å|Ǎ|ǎ|Ą|ą|Ă|ă|Æ|æ|Ā|ā",
    c: "Ç|ç|Ć|ć|Ĉ|ĉ|Č|č",
    d: "Ď|đ|Đ|ď|ð",
    e: "È|è|É|é|Ê|ê|Ë|ë|Ě|ě|Ę|ę|Ė|ė|Ē|ē",
    g: "Ĝ|ĝ|Ģ|ģ|Ğ|ğ",
    h: "Ĥ|ĥ",
    i: "Ì|ì|Í|í|Î|î|Ï|ï|ı|Ī|ī|Į|į",
    j: "Ĵ|ĵ",
    k: "Ķ|ķ",
    l: "Ĺ|ĺ|Ļ|ļ|Ł|ł|Ľ|ľ|Ŀ|ŀ",
    n: "Ñ|ñ|Ń|ń|Ň|ň|Ņ|ņ",
    o: "Ö|ö|Ò|ò|Ó|ó|Ô|ô|Õ|õ|Ő|ő",
    r: "Ŕ|ŕ|Ř|ř",
    s: "Ś|ś|Ŝ|ŝ|Ş|ş|Š|š|Ș|ș",
    t: "Ť|ť|Ţ|ţ|Þ|þ|Ț|ț",
    u: "Ü|ü|Ù|ù|Ú|ú|Û|û|Ű|ű|Ũ|ũ|Ų|ų|Ů|ů|Ū|ū",
    w: "Ŵ|ŵ",
    y: "Ý|ý|Ÿ|ÿ|Ŷ|ŷ",
    z: "Ź|ź|Ž|ž|Ż|ż",
  }

  s = s.toLowerCase()

  Object.keys(map).forEach((pattern) => {
    s = s.replace(new RegExp(map[pattern], "g"), pattern)
  })

  if (removeSpaces) {
    s = s.replace(new RegExp("·|/|_|,|:|;| ", "g"), "-")
  }

  return s
}

export const setPageMeta = (title, description, imgSrc) => {
  if (title) {
    const titleText = `Dokuforte — ${title}`
    document.title = titleText
    document.querySelector('meta[property="twitter:title"]').setAttribute("content", titleText)
    document.querySelector('meta[property="og:title"]').setAttribute("content", titleText)
  }
  if (description) {
    document.querySelector('meta[name="description"]').setAttribute("content", description)
    document.querySelector('meta[property="twitter:description"]').setAttribute("content", description)
    document.querySelector('meta[property="og:description"]').setAttribute("content", description)
  }
  if (imgSrc) {
    document.querySelector('meta[property="twitter:image:src"]').setAttribute("content", imgSrc)
    document.querySelector('meta[property="og:image"]').setAttribute("content", imgSrc)
  }
}

export const getImgAltText = (data) => {
  return [
    data.country,
    data.place,
    data.city,
    data.description,
    data.year,
    data.donor,
    data.author,
    (data.tags || []).join(", "),
    data.mid ? `Dokuforte #${data.mid}` : false,
  ]
    .filter(Boolean)
    .join(", ")
}

export const onClassChange = (node, callback) => {
  const classObserver = new window.MutationObserver(() => {
    callback(node)
  })
  classObserver.observe(node, {
    attributes: true,
    attributeFilter: ["class"],
  })
}

export const copyToClipboard = async (textToCopy, type) => {
  const input = document.createElement("textarea")
  input.className = "visuallyhidden"
  input.value = textToCopy

  document.body.appendChild(input)

  input.select()

  const res = document.execCommand("copy")
  if (res) {
    trigger("snackbar:show", {
      message: type === "link" ? await lang("copy_link_clipboard") : await lang("copy_text_clipboard"),
      autoHide: true,
      status: "success",
    })
  } else {
    trigger("snackbar:show", {
      message: type === "link" ? await lang("copy_link_clipboard_failed") : await lang("copy_text_clipboard_failed"),
      autoHide: true,
      status: "error",
    })
  }

  document.body.removeChild(input)
  return res
}

export const isElementInViewport = (el) => {
  if (el) {
    const top = document.querySelector(".header") ? document.querySelector(".header").offsetHeight : 0
    const bounds = el.getBoundingClientRect()
    return bounds.top >= top && bounds.bottom <= window.innerHeight
  }
  return false
}

export const setCookie = (name, value, days) => {
  let expires = ""
  if (days > 0) {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    expires = `; expires=${date.toUTCString()}`
  } else {
    expires = "; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  document.cookie = `${name}=${value || ""}${expires}; path=/`
}

export const getCookie = (name) => {
  const nameEQ = `${name}=`
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

export const getStorageParam = (paramName, isLocal = false) => {
  const storage = isLocal ? window.localStorage : window.sessionStorage
  const param = storage.getItem(paramName)
  if (param) {
    return JSON.parse(param)
  }
  return {}
}

export const setStorageParam = (paramName, paramValue, isLocal = false) => {
  const storage = isLocal ? window.localStorage : window.sessionStorage
  if (typeof paramValue === "object") storage.setItem(paramName, JSON.stringify(paramValue))
  if (paramValue === null) storage.removeItem(paramName)

  const triggerDetail = {}
  triggerDetail[paramName] = paramValue

  trigger("storage:changed", triggerDetail)
}

export const eraseCookie = (name) => {
  document.cookie = `${name}=; Max-Age=-99999999;`
}

export const validateEmail = (email) => {
  const reg = /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+.([A-Za-z]{2,4})$/
  return reg.test(email)
}

export const redirectTo = (href) => {
  let redirectToHref = localStorage.getItem("redirectAfterSignin")
  localStorage.removeItem("redirectAfterSignin")
  if (!redirectToHref) redirectToHref = href
  document.location.href = redirectToHref
}

export const comeBackAfterSignIn = (targetURL) => {
  localStorage.setItem("redirectAfterSignin", targetURL || document.location.href)
  document.location.href = `/${getLocale()}/signin/`
}

export const escapeHTML = (unsafe) => {
  return unsafe
    ? unsafe.replace(/[\u00A0-\u9999<>&]/g, (i) => {
        return `&#${i.charCodeAt(0)};`
      })
    : ""
}

export const photoRes = (size, photoId) => {
  const imageRequest = {
    bucket: siteConfig.PHOTO_BUCKET,
    key: photoId,
    edits: {
      toFormat: "jpeg",
      resize: {},
    },
  }

  if (size === "large") {
    imageRequest.edits.resize.width = `${window.innerWidth > 1600 ? 2560 : 1600}`
  }
  if (size === 240) {
    imageRequest.edits.resize.width = 240
  }
  if (size === 480) {
    imageRequest.edits.resize.width = 480
  }
  // console.log('imageRequest: ', imageRequest)
  const encoded = btoa(JSON.stringify(imageRequest))
  return `${siteConfig.PHOTO_SOURCE}/${encoded}`
}
