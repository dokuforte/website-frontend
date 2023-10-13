import config from "../data/siteConfig"
import { getLocale } from "../js/utils"

const CUSTOM_SEARCH_PREFIX = "/search"

const search = async params => {
  let query = `${CUSTOM_SEARCH_PREFIX}/${params.q || ""}`

  if (params.year && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/year/${params.year}`
  }

  if (params.id && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/id/${params.id}`
  }

  if (params.donatedby && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/donatedby/${params.donatedby}`
  }

  if (params.location && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/address/${params.location}`
  }

  if (params.tag && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/tag/${params.tag}`
  }

  if (params.source && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/source/${params.source}`
  }

  if (params.latest !== undefined) {
    query = `${query}/_latest`
  }

  const offset = params.offset ? `offset=${params.offset}` : ""
  const limit = params.limit ? `limit=${params.limit}` : ""
  const yearFrom = params.year_from ? `year_from=${params.year_from}` : ""
  const yearTo = params.year_to ? `year_to=${params.year_to}` : ""

  const queryParams = `${limit}&${offset}&${yearFrom}&${yearTo}`

  const url = `${config.API_HOST}/api/media/search${query}${queryParams.length > 0 ? `?${queryParams}` : ""}`
  const resp = await fetch(url, {
    method: "GET",
    mode: "cors",
  })

  const respData = await resp.json()
  return respData
}

// get the total number of published photos
const getTotal = async () => {
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
  const lang = { lang: getLocale() }
  const resp = await fetch(`${config.API_HOST}/api/media/get-total`, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ body, ...lang }),
  })

  return resp.json()
}

// get an aggregated list of all donators
const getDonators = async () => {
  const resp = await fetch(`${config.API_HOST}/autocomplete/donatedby`, {
    method: "GET",
    mode: "cors",
  })
  const respData = await resp.json()
  return respData
}

const getDataById = () => {}

export default {
  search,
  getTotal,
  getDonators,
  getDataById,
}
