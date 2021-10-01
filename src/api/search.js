import config from "../data/siteConfig"

const search = async params => {
  let query = params.q || ""

  if (params.year && !params.q) {
    query = `year/${params.year}`
  }

  if (params.id && !params.q) {
    query = `id/${params.id}`
  }

  if (params.donor && !params.q) {
    query = `donated_by/${params.donor}`
  }

  if (params.tag && !params.q) {
    query = `tag/${params.tag}`
  }

  const url = `${config.API_HOST}/custom/search/${query}`
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
