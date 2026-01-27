import dayjs from "dayjs"
import markdownIt from "markdown-it"
import markdownItAttrs from "markdown-it-attrs"
import markdownItAnchor from "markdown-it-anchor"

const md = markdownIt()

export const findItem = (scope, key, value) => {
  return scope.find((item) => {
    return item[key] === value
  })
}

export const trim = (string) => {
  return String(string).trim()
}

export const unescape = (string) => {
  return decodeURIComponent(String(string))
}

export const size = (obj) => {
  if (typeof obj === "string" || Array.isArray(obj)) return obj.length
  if (typeof obj === "object") return Object.keys(obj).length
  return null
}

export const split = (str, separator) => {
  return String(str).split(separator)
}

export const join = (str, separator, ...args) => {
  const arr = [str, ...args].filter((el) => {
    return el != null && el !== ""
  })
  return arr.join(separator)
}

export const push = (arr, item) => (typeof arr === "object" ? [item] : arr.push(item))

export const date = (timestamp, locale) => {
  const dateFormat = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
  return dateFormat.format(new Date(parseInt(timestamp, 10)))
}

export const toTimestamp = (dateString) => {
  return dayjs(dateString).format("x")
}

export const transformName = (arr) => {
  arr.forEach((item) => {
    const fullName = item.name.split(" ")
    const firstName = fullName[0]
    const lastName = fullName.slice(1).join(" ")

    item.name_transformed = `${lastName}, ${firstName}`
  })

  return arr.sort((a, b) => a.name_transformed.localeCompare(b.name_transformed))
}

export const sort = (arr, sortBy, order = "asc") => {
  const arrSorted = arr.sort((a, b) => {
    const comparison = String(a[sortBy]).localeCompare(String(b[sortBy]))

    if (order === "asc") {
      return comparison
    }
    return -comparison
  })

  return arrSorted
}

export const markdownify = (str) => {
  if (str) {
    md.use(markdownItAttrs).use(markdownItAnchor)
    return md.render(str)
  }
  return str
}

export const slugify = (str, removeSpaces = true) => {
  let s = String(str)

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

  // remove special chars
  s = s.replace(/[.,·/:;?#'""''«»+]/g, "")

  if (removeSpaces) {
    s = s.replace(/_| /g, "-")
  }

  return s
}

export const lowcase = (s) => s.toLowerCase()

export const slice = (s, start, end) => {
  if (!s || s.length === 0) return null
  return s.slice(start, end)
}
