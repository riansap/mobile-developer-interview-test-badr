// import amqp from 'amqplib/callback_api'
import axios from 'axios'
import moment from 'moment'
import models from '../../models'
import NodeCache from 'node-cache'
const myCache = new NodeCache({stdTTL: 600,checkperiod:0})

const { TrackingLog } = models

const easyGoUrl = process.env.EASYGO_URL
const smileUrl = process.env.SMILE_URL
const headers = {
  'Token': process.env.EASYGO_TOKEN,
  'Content-Type' : 'application/json'
}

export function formatCreateEasyGoPayload(order, nopol, token = '', callbackHost = '') {
  const data = {
    no_do: order.id,
    no_sj: '',
    car_plate: nopol,
    tgl_do: moment(order.shipped_at).format('YYYY-MM-DD HH:mm:ss'), //'2021-01-07 18:50:17',
    opsi_complete: 1,
    allow_multiple_do: 0,
    replace_coord: 0,
    maxtime_delivery: 24,
    maxtime_checking: 72,
    alert_telegram: '',
    alert_email: '',
    alert_dur_idle: 0,
    alert_dur_notUpdate: 0,
    alert_dur_terlarang: 0,
    alert_tujuan_lain: 0,
    dur_valid_geofence: 2,
    project: '',
    user_login: '',
    driver_id: 0,
    url_reply:'https://api-imunisasi-logistik.kemkes.go.id/tracking-logs/push',
    geo_asal: [
      {
        code: order.vendor.code,
        name: order.vendor.name,
        radius: 200,
        lon: order.vendor.lng,
        lat: order.vendor.lat,
        plan_time: ''
      }
    ],
    geo_tujuan: [
      {
        code: order.customer.code,
        name: order.customer.name,
        radius: 200,
        lon: order.customer.lng,
        lat: order.customer.lat,
        plan_time: '',
        cust_alert_telegram: '',
        cust_alert_email: ''
        // std_km_delivery: 10,
        // std_minute_delivery: 60
      }
    ]
  }

  const payload = {
    url: `${easyGoUrl}/api/do/AddOrUpdateDOV1ByLatLon`, 
    method: 'POST',
    headers: headers,
    data: data,
  
  }
  console.log(payload)
  return payload
}

export async function getLastPosition(nopol = [], no_do = null) {
  try {
    let data = []
    for(const [i, nopolItem] of nopol.entries()) {
      let options = [{
        nopol: nopolItem
      }]
      if(no_do) options.push({no_do: no_do})
      const historyData = await TrackingLog.findAll({
        limit: 1,
        where: options,
        order: [['updated_at', 'DESC']]
      })
      if(historyData.length>0){
        let { nopol, curr_temp, lon, lat, updated_time, status_do } = historyData[0]
        data.push({
          nopol,
          status: getStatusLabel(status_do),
          temperature: curr_temp,
          timestamp: updated_time,
          lon,
          lat
        })
      }
    }
    return data
  } catch (error) {
    console.log(error)
  }
}

export function getLastPositionEasyGo(listNopol = []) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'POST',
      url: `${easyGoUrl}/api/report/lastposition`,
      headers: headers,
      data: {
        list_nopol: listNopol
      }
    }).then((response) => {
      let resData = response.data.Data
      if(Array.isArray(resData) && resData.length > 0) {
        for(let i = 0; i<=resData.length; i++) {
          var trackingData = null
          if(resData[i]) {
            let { currentDO, currentStatusVehicle, nopol, temperatur1, stime, lat, lon, is_alarm } = resData[i]
            var newTemp = temperatur1
            if(nopol==='KEMENKES (GUDANG VAKSIN 1)' || nopol==='KEMENKES (GUDANG VAKSIN 2)'){
              // newTemp = 2.7
              axios({
                method: 'POST',
                url: 'https://api-imunisasi-logistik.kemkes.go.id/tracking-logs/push',
                headers: headers,
                data: {
                  nopol,
                  lat,
                  lon,
                  curr_temp: newTemp
                }
              }).then((response)=>{
                console.log(response)
              })
            }

            TrackingLog.create({
              nopol,
              status_do: currentDO ? currentDO.status_do: null,
              no_do: currentDO ? currentDO.no_do: null,
              curr_temp: newTemp,
              updated_time: stime ? moment(stime).format('YYYY-MM-DD HH:mm:ss'): 
                moment().format('YYYY-MM-DD HH:mm:ss'),
              lat,
              lon,
              is_alarm,
              vehicle_status: currentStatusVehicle ? currentStatusVehicle.status : null
            })
          }
          if(i==resData.length-1){
            resolve('success')
          }
        }
      }else{
        resolve('no data inserted')
      }
    }).catch((error) => {
      reject(error)
    })
  })
}

export function getHistoryData(startDate, endDate, nopol) {
  // easyGoUrl
  return new Promise((resolve, reject) => {
    // console.log(headers)
    axios({
      method: 'POST',
      url: `${easyGoUrl}/api/report/historydata`,
      headers: headers,
      data: {
        lstNoPOL: [nopol],
        start_time: startDate,
        stop_time: endDate
      }
    }).then((response) => {
      // console.log(response.data)
      var resultList = []
      if(response.data.Data.length>0) {
        for(const data of response.data.Data){
          resultList.push({
            update_time: data.gps_time,
            curr_lat: data.lat,
            curr_long: data.lon,
            temp: data.temperature1
          })
        }
      } 
      resolve(resultList)
    }).catch((error) => {
      console.log(error)
      reject(error)
    })
  })
}

function getStatusLabel(status) {
  status = parseInt(status)
  switch (status) {
  case null:
  case 0:
  case 1:
  case 2:
    return 'Dalam Perjalanan'
  case 5:
    return 'Ada Masalah'
  default:
    return 'Sampai Tujuan'
  }
}

export function getCanvasUrl(nopol = '') {
  let buffer = Buffer.from(process.env.EASYGO_USERNAME+'|'+process.env.EASYGO_PASSWORD)
  let token_canvas = buffer.toString('base64')
  let url = `${process.env.EASYGO_CANVAS}/MapsCanvas/Index?token=${token_canvas}`

  if(nopol) {
    return `${url}&nopol=${nopol}&zoom=15`
  }
  return url
}

export async function getCanvasTrackingUrl(order) {
  let { nopol, startDate, startEnd } = order
  startDate = moment(startDate).format('YYYY-MM-DD HH:mm:ss')
  startEnd = moment(startEnd).format('YYYY-MM-DD HH:mm:ss')
  // get auth token
  // let url = await getJWTToken().then((jwt) => {
  //   url = `${process.env.EASYGO_CANVAS}/DetailMaps?token=${jwt}&car_plate=${nopol}&start_date=${startDate}&start_end=${startEnd}`
  //   return url
  // })
  let jwt = await getJWTToken()
  let url = `${process.env.EASYGO_CANVAS}/DetailMaps?token=${jwt}&car_plate=${nopol}&start_date=${startDate}&start_end=${startEnd}`
  return url
}

function getJWTToken() {
  return new Promise((resolve, reject) => {
    try {
      let jwt = myCache.get('easygo_jwt')
      console.log('check easygo_jwt cache')
      console.log(jwt)
      const username = process.env.EASYGO_USERNAME
      const password = process.env.EASYGO_PASSWORD
      if(jwt == undefined) {
        axios({
          method: 'GET',
          url: `${process.env.EASYGO_CANVAS}/token/${username}/${password}`
        }).then((response)=>{
          let jwt = response.data.token
          myCache.set('easygo_jwt', jwt, 60000)
          resolve(jwt)
        })
      } else {
        resolve(jwt)
      }
    } catch(err) {
      reject(err)
    }
  })
}
