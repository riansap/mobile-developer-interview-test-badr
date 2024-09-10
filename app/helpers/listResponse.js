export default function listResponse(total, page, perPage, data) {
  return {
    total: total,
    page: page,
    perPage: perPage,
    list: data
  }
}