const moment = require("moment")
const md = require("markdown-it")()
const markdownItAttrs = require("markdown-it-attrs")
const markdownItAnchor = require("markdown-it-anchor")

exports.findItem = (scope, key, value) => {
  return scope.find(item => {
    return item[key] === value
  })
}

exports.trim = string => {
  return String(string).trim()
}

exports.unescape = string => {
  return decodeURIComponent(String(string))
}

exports.size = obj => {
  if (typeof obj === "string" || "array") return obj.length
  if (typeof obj === "object") return Object.keys(obj).length
  return null
}

exports.split = (str, separator) => {
  return String(str).split(separator)
}

exports.join = (str, separator, ...args) => {
  const arr = [str, ...args].filter(function(el) {
    return el != null && el !== ""
  })
  return arr.join(separator)
}

exports.push = (arr, item) => (typeof arr === "object" ? [item] : arr.push(item))

exports.date = (timestamp, locale) => {
  const dateFormat = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
  return dateFormat.format(new Date(parseInt(timestamp, 10)))
}

exports.toTimestamp = date => {
  return moment(date).format("x")
}

exports.sort = (arr, sortBy, order = "asc") => {
  const arrSorted = arr.sort((a, b) => {
    if (String(a[sortBy]) < String(b[sortBy])) {
      return order === "asc" ? -1 : 1
    }
    if (String(a[sortBy]) > String(b[sortBy])) {
      return order === "asc" ? 1 : -1
    }
    return 0
  })
  return arrSorted
}

exports.markdownify = str => {
  if (str) {
    md.use(markdownItAttrs).use(markdownItAnchor)
    return md.render(str)
  }
  return str
}

exports.slugify = (str, removeSpaces = true) => {
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

  Object.keys(map).forEach(pattern => {
    s = s.replace(new RegExp(map[pattern], "g"), pattern)
  })

  // remove special chars
  s = s.replace(new RegExp("\\.|,|·|/|:|;|\\?|\\#|'|“|”|’|‘|«|»|\\+", "g"), "")

  if (removeSpaces) {
    s = s.replace(new RegExp("_| ", "g"), "-")
  }

  return s
}

exports.lowcase = s => s.toLowerCase()

exports.slice = (s, start, end) => {
  if (!s || s.length === 0) return null
  return s.slice(start, end)
}
