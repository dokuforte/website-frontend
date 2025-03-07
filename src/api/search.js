import { slugify, getLocale, getURLParams, getApiUrl } from "../js/utils"
import config from "../data/siteConfig"

// simplify and localize the Elastic server response
const transformResults = (resp) => {
  const r = {
    total: resp.hits.total.value,
    items: [],
  }

  // adding the aggregated years (photo count per all year in search range) to the results
  if (resp.aggregations && resp.aggregations.years && resp.aggregations.years.buckets) {
    r.years = []
    resp.aggregations.years.buckets.forEach((year) => {
      if (year.key > 0) {
        r.years.push({ year: year.key, count: year.doc_count })
      }
    })
  }

  if (resp.hits.hits.length > 0) {
    resp.hits.hits.forEach((hit) => {
      // eslint-disable-next-line no-underscore-dangle
      const item = {}

      item.mid = hit.id
      item.year = hit.year
      item.photoId = hit.photosource
      item.created = hit.created
      item.description = hit.description
      item.context = hit.context
      item.donor = hit.donor ? hit.donor.name : null
      item.author = hit.author
      item.tags = hit.tags
      item.country = hit.countries && hit.countries.length > 0 ? hit.countries.map((country) => country.name) : null
      item.place = hit.places && hit.places.length > 0 ? hit.places.map((place) => place.name) : null
      item.locality = hit.locality ? hit.locality.name : null
      item.approximate = hit.approximate
      item.order = hit.order

      r.items.push(item)
    })
  }

  return r
}

// get the total number of published photos
const totalRequest = async (data) => {
  const url = `${getApiUrl()}/api/media/get-total`
  const lang = { lang: getLocale() }
  const resp = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ data, ...lang }),
  })

  return resp.json()
}

// search request
const searchRequest = async (data) => {
  let url = `${getApiUrl()}/api/media/search`

  const q = getURLParams()
  if (q.esurl && q.esauth) {
    url = q.esurl
  }

  // The server requires a il language code for Hebrew
  const lang = { lang: getLocale() }

  const resp = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      Authorization: `Basic ${btoa(q.esurl && q.esauth ? q.esauth : "cmVhZGVyOnIzYWRtMzEwMjRyZWFk")}`,
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ data, ...lang }),
  })

  return resp.json()
}

// check search params and build the query
const search = (params) => {
  return new Promise((resolve, reject) => {
    // init the default query params
    const query = {
      where: [],
      matching: [],
      multi: [],
    }

    // returns all records when query field is empty
    if (!params || (params && params.q === "")) {
      query.match_all = true
    }

    // set a query for getting the recently added items
    if (params.latest === "") {
      query.where.push({ "latest IS": true })
    }

    // if query (search term) exists
    if (params.q && params.q !== "") {
      const words = params.q.split(", ")

      words.forEach((word) => {
        query.multi.push(`${slugify(word)}`)
      })
    }

    // if there's a tag search attribute defined (advanced search)
    if (params.tag) {
      const tag = slugify(params.tag)
      query.matching.push({ model: "Tags", field: "name", value: `${tag}` })
    }

    // if there's a year search attribute defined (advanced search)
    if (params.year) {
      query.where.push({ year: `${params.year}` })
    }

    // if there's a city search attribute defined (advanced search)
    if (params.locality) {
      const locality = slugify(params.locality)
      query.matching.push({ model: "Localities", field: "name", value: `${locality}` })
    }

    // if there's a country search attribute defined (advanced search)
    if (params.country) {
      const country = slugify(params.country)
      query.matching.push({ model: "Countries", field: "name", value: `${country}` })
    }

    // if there's a place search attribute defined (advanced search)
    if (params.place) {
      const { place } = params
      query.matching.push({ model: "Places", field: "name", value: `${place}` })
    }

    // if there's a donor search attribute defined (advanced search)
    if (params.donor) {
      const donor = slugify(params.donor)
      query.matching.push({ model: "Donors", field: "name", value: `${donor}` })
    }

    // if there's a photographer search attribute defined (advanced search)
    if (params.photographer) {
      const photographer = slugify(params.photographer)
      query.where.push({ author: photographer })
    }

    // if there's an id search attribute defined (advanced search)
    if (params.id) {
      const id = slugify(params.id)
      query.where.push({ "Media.id": `${id}` })
    }

    // if there's a year range defined (advanced search / range filter)
    if (params.year_from || params.year_to) {
      if (params.year_from) query.where.push({ "year >=": `${params.from}` })
      if (params.year_to) query.where.push({ "year <=": `${params.year_to}` })
    }

    const body = {
      size: params.size || config.THUMBNAILS_QUERY_LIMIT,
      offset: params.offset || 0,
      sort: {
        order: "asc",
      },
      track_total_hits: true,
      query,
    }

    if (params.offset === 0 || params.offset === undefined) {
      body.aggs = {
        years: {
          terms: {
            field: "year",
            size: 100000,
            order: { _key: "asc" },
          },
        },
      }
    }

    searchRequest(body)
      .then((resp) => {
        resolve(transformResults(resp))
      })
      .catch((err) => {
        reject(err)
      })
  })
}

// get the total number of published photos
const getTotal = () => {
  return new Promise((resolve, reject) => {
    const body = {
      size: 0,
      track_total_hits: true,
      query: {
        bool: {
          must: [
            {
              match_all: {},
            },
            {
              range: {
                year: {
                  gt: 0,
                },
              },
            },
          ],
        },
      },
    }

    totalRequest(body)
      .then((resp) => {
        resolve(transformResults(resp))
      })
      .catch((err) => {
        reject(err)
      })
  })
}

// get an aggregated list of all donators
const getDonators = () => {
  const lang = { lang: getLocale() }
  return fetch(`${getApiUrl()}/api/donors/list`, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ ...lang }),
  })
    .then((res) => res.json())
    .then((json) => {
      const donatorsData = json.data
      donatorsData.forEach((donator) => {
        const nameArray = donator.name.split(" ")
        donator.name_transformed = `${nameArray.pop()}, ${nameArray.join(" ")}`
      })
      return donatorsData.sort((a, b) => {
        return a.name_transformed.localeCompare(b.name_transformed, "en", { ignorePunctuation: false })
      })
    })
}

// get a random record
const getRandom = (size = 1) => {
  return new Promise((resolve, reject) => {
    const body = {
      size,
      query: {
        function_score: {
          query: {
            bool: {
              must: [
                {
                  match_all: {},
                },
                {
                  range: {
                    year: {
                      gt: 0,
                    },
                  },
                },
              ],
            },
          },
          functions: [
            {
              random_score: {
                seed: Math.round(Math.random() * 100000000).toString(),
              },
            },
          ],
        },
      },
    }

    searchRequest(body)
      .then((resp) => {
        resolve(transformResults(resp))
      })
      .catch((err) => {
        reject(err)
      })
  })
}

const getDataById = (array) => {
  return new Promise((resolve, reject) => {
    const body = {
      size: array.length,
      query: {
        id: {
          values: array.map((item) => item),
        },
      },
    }

    searchRequest(body)
      .then((resp) => {
        resolve(transformResults(resp))
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export default {
  search,
  getTotal,
  getDonators,
  getRandom,
  getDataById,
}
