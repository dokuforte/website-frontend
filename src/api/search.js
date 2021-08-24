import config from "../data/siteConfig"

const search = async params => {
  const url = `${config.API_HOST}/items/photo/?meta=*&filter[status][_eq]=published&limit=20`
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
