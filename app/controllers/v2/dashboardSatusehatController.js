import models from "../../models"

const { DashboardSatusehat } = models
async function list(req, res, next) {
  try {
    const data = await DashboardSatusehat.findAll()
    return res.status(200).json(data)
  } catch(err) {
    next(err)
  }
}

async function detail(req, res, next) {
  try {
    const { uuid } = req.params
    const data = await DashboardSatusehat.findOne({
      where: { uuid }
    })
    if (!data) {
      return res.status(404).json({ message: req.__("404") })
    }
    return res.status(200).json(data)
  } catch(err) {
    next(err)
  }
}

export default {
  list,
  detail
}