import config from "../data/siteConfig"

const CUSTOM_SEARCH_PREFIX = "/custom/search"

const search = async params => {
  let query = `${CUSTOM_SEARCH_PREFIX}/${params.q}` || ""

  if (params.year && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/year/${params.year}`
  }

  if (params.id && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/id/${params.id}`
  }

  if (params.donatedby && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/donatedby/${params.donatedby}`
  }

  if (params.tag && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/tag/${params.tag}`
  }

  if (params.source && !params.q) {
    query = `${CUSTOM_SEARCH_PREFIX}/source/${params.source}`
  }

  const url = `${config.API_HOST}${query}`
  const resp = await fetch(url, {
    method: "GET",
    mode: "cors",
  })

  const respData = await resp.json()
  return respData
}

// get the total number of published photos
const getTotal = async () => {
  const resp = await fetch(`${config.API_HOST}/items/photo/?meta=*&filter[status][_eq]=published&limit=0`, {
    method: "GET",
    mode: "cors",
  })

  return resp.json()
}

// get an aggregated list of all donators
const getDonators = async () => {
  const resp = await fetch(`${config.API_HOST}/custom/autocomplete/donatedby`, {
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
