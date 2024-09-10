import Excel from 'exceljs'
import _ from 'lodash'
import models from '../../models'

export async function annualPlannningXLS(data) {
    try {
        const workbook = new Excel.Workbook()

        workbook.creator = 'SMILE'
        workbook.views = [
            {
                x: 0,
                y: 0,
                width: 10000,
                height: 20000,
                firstSheet: 0,
                activeTab: 1,
                visibility: 'visible',
            },
        ]

        const worksheet = workbook.addWorksheet('Annual Planning', {
            properties: { tabColor: { argb: 'FFC0000' } },
            headerFooter: { firstHeader: 'Cold Storage Annual Planning', firstFooter: 'Cold Storage Annual Planning' },
        })

        const alignmentCenter = { vertical: 'middle', horizontal: 'center', wrapText: true }
        const alignmentMiddle = { vertical: 'middle', wrapText: true }

        worksheet.getRow(1).values = [
            'No.', 'Nama Entitas', 'Provinsi', 'Kab/Kota', 'Per 1 Tahun', '', 'Per 3 Bulan', '', '', 'Per 1 Bulan'
        ]



        worksheet.getRow(2).values = [
            'No.', 'Nama Entitas', 'Provinsi', 'Kab/Kota', 'Kebutuhan Volume 1 Tahun', 'Kebutuhan Volume 1 Tahun (Normal)',
            'Volume 3 Bulan (Normal)', 'Volume Puncak Q3 (Agustus)', 'Volume Puncak Q4 (November)',
            'Volume 1 Bulan', 'Volume Puncak (Agustus)', 'Volume Puncak (November)'
        ]

        worksheet.mergeCells('A1:A2')
        worksheet.mergeCells('B1:B2')
        worksheet.mergeCells('C1:C2')
        worksheet.mergeCells('D1:D2')

        worksheet.mergeCells('E1:F1')
        worksheet.mergeCells('G1:I1')
        worksheet.mergeCells('J1:L1')

        worksheet.getCell('E1:F1').alignment = alignmentCenter
        worksheet.getCell('G1:I1').alignment = alignmentCenter
        worksheet.getCell('J1:L1').alignment = alignmentCenter

        worksheet.getCell('A1:A2').alignment = alignmentMiddle
        worksheet.getCell('B1:B2').alignment = alignmentMiddle
        worksheet.getCell('C1:C2').alignment = alignmentMiddle
        worksheet.getCell('D1:D2').alignment = alignmentMiddle

        const arrColumnData = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
        const borderStyle = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        }

        for (let i = 1; i <= 2; i++) {
            for (let arrCol of arrColumnData) {
                const colCell = worksheet.getCell(`${arrCol}${i}`)
                colCell.border = borderStyle
                colCell.font = { bold: true }
            }

        }

        let start = 3
        for (let item of data) {
            worksheet.getRow(start).values = [
                start - 2, item?.entity?.name, item?.entity?.province?.name, item?.entity?.regency?.name,
                item?.yearly_volume_need, item?.yearly_volume,
                item?.quartal_volume, item?.peak_volume_q3, item?.peak_volume_q4,
                item?.monthly_volume, item?.peak_volume_augustus, item?.peak_volume_november
            ]
            for (let arrCol of arrColumnData) {
                const colCell = worksheet.getCell(`${arrCol}${start}`)
                colCell.border = borderStyle
            }
            start++
        }

        return workbook

    } catch (err) {
        console.log(err)
    }
}

export async function annualPlanningDetailXLS({ annual_planning, annual_planning_temperature, annual_planning_materials, coldstorage }) {
    try {

        const workbook = new Excel.Workbook()

        workbook.creator = 'SMILE'
        workbook.views = [
            {
                x: 0,
                y: 0,
                width: 10000,
                height: 20000,
                firstSheet: 0,
                activeTab: 1,
                visibility: 'visible',
            },
        ]

        const worksheet = workbook.addWorksheet('Annual Planning Detail', {
            properties: { tabColor: { argb: 'FFC0000' } },
            headerFooter: { firstHeader: 'Cold Storage Annual Planning', firstFooter: 'Cold Storage Annual Planning' },
        })

        worksheet.properties.defaultColWidth = 19

        const arrColumnData = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

        const keysValues = [
            'yearly_volume_need',
            'yearly_volume',
            'quartal_volume',
            'peak_volume_q3',
            'peak_volume_q4',
            'monthly_volume',
            'peak_volume_augustus',
            'peak_volume_november'
        ]

        const alignmentCenter = { vertical: 'middle', horizontal: 'center', wrapText: true }
        //const alignmentMiddle = { vertical: 'middle', wrapText: true }

        const borderStyle = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        }

        const headerTitleCell = worksheet.getCell('A1')
        headerTitleCell.value = 'Detail Coldstorage Annual Planning'
        worksheet.mergeCells('A1:K1')
        headerTitleCell.alignment = alignmentCenter

        const asset_coldchain = []
        let assets = []

        for (let coldAsset of (coldstorage?.asset_type || [])) {
            asset_coldchain.push(coldAsset.name + ` (${coldAsset.min_temp}℃ - ${coldAsset.max_temp}℃)`)
            for (let it of coldAsset?.assets) {
                assets.push({
                    ...it.dataValues,
                    min_temp: coldAsset.min_temp,
                    max_temp: coldAsset.max_temp
                })
            }
        }

        worksheet.getRow(2).values = ['Nama Entitas : ', annual_planning?.entity?.name]
        worksheet.getRow(3).values = ['Asset Coldchain :', asset_coldchain.join(', ')]

        worksheet.mergeCells('B2:K2')
        worksheet.mergeCells('B3:K3')


        let start = 4
        const tableColdchain = function (item) {
            const { temperature_max, temperature_min } = item?.range_temperature || {}

            if (item?.range_temperature) {
                worksheet.getRow(start).values = [`Rentang Suhu ${temperature_min}℃ - ${temperature_max}℃`]
                worksheet.getCell(`A:${start}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'Fffc000' },
                    bgColor: { argb: 'Fffc000' }
                }

                start++

                worksheet.getRow(start).values = [`Kapasitas Neto Penyimpanan (Liter) :`, Number((item?.dataValues?.capacity_nett || 0).toFixed(2))]
            } else {
                worksheet.getRow(start).values = [`Kapasitas Neto Penyimpanan (Liter) Total :`, Number((coldstorage?.capacity_nett || 0).toFixed(2))]
            }

            start++

            worksheet.getRow(start).values = ['', 'Kebutuhan Volume 1 tahun', 'Volume 1 tahun Normal', 'Volume 3 bulan Normal', 'Volume puncak Q3 (Agustus)', 'Volume Puncak Q4 (November)', 'Volume 1 bulan Normal', 'Volume puncak (Agustus)', 'Volume Puncak (November)']
            start++

            const values1 = ['Volume']
            const values2 = ['% Terpakai']
            for (let keyIndex of keysValues) {
                values1.push(item[keyIndex])
                values2.push(
                    (item[keyIndex + '_percent'] ?? item?.dataValues[keyIndex + '_percent']) / 100
                )
            }

            worksheet.getRow(start).values = values1
            start++

            worksheet.getRow(start).values = values2
            start++
            let line = 1
            for (let i = start - 3; i < start; i++) {
                if (line === 1) {
                    worksheet.getRow(i).height = 45
                }

                for (let arrCol of arrColumnData) {
                    const colCell = worksheet.getCell(`${arrCol}${i}`)
                    colCell.border = borderStyle
                    colCell.alignment = { wrapText: true }

                    if (arrCol != 'A') {
                        colCell.font = { bold: true }
                        if (line === 1 && (arrCol === 'D' || arrCol === 'E' || arrCol === 'F')) {
                            colCell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'Fddebf7' },
                                bgColor: { argb: 'Fddebf7' }
                            }
                        } else {
                            colCell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'Fe2efda' },
                                bgColor: { argb: 'Fe2efda' }
                            }
                        }

                        if (line == 3) {
                            colCell.numFmt = '0.00%'
                        }
                    }
                }

                line++
            }
        }

        const rangeTemperatures = await models.RangeTemperature.findAll()

        tableColdchain(annual_planning)
        start++

        if (annual_planning?.entity?.type != 3) {
            for (let range of annual_planning_temperature) {
                tableColdchain(range)
                start++
            }
        }

        start++

        const tableMaterials = function () {
            const headerTable = ['Bulan', 'No', 'Nama Material', 'Nama Aktivitas', 'SKU', 'Kebutuhan 1 Tahun (dosis)',
                'Kebutuhan 1 Tahun (vial)', 'Kebutuhan 1 Tahun (Boks)', 'Kebutuhan Volume 1 tahun'
            ]


            if (annual_planning?.entity?.type != 3) {
                headerTable.unshift('Rentang Suhu')
                arrColumnData.push('J')
            }

            worksheet.getRow(start).values = headerTable
            worksheet.getRow(start).height = 40

            for (let arrCol of arrColumnData) {
                const colCell = worksheet.getCell(`${arrCol}${start}`)
                colCell.font = { color: { argb: 'FFFFFFF' }, bold: true }
                colCell.alignment = { wrapText: true, vertical: 'middle' }
                colCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F064f99' },
                    bgColor: { argb: 'F064f99' }
                }
            }

            start++

            const groupByMonth = _.groupBy(annual_planning_materials, 'month_name')
            let number = 1

            if (annual_planning?.entity?.type != 3) {
                // for entity type Dinkes etc
                for (let range of rangeTemperatures) {

                    worksheet.getCell(`A${start}`).value = `${range.temperature_min}℃ - ${range.temperature_max}℃`
                    for (let keyMonth in groupByMonth) {
                        const materialRanges = groupByMonth[keyMonth].filter(it => it?.material?.range_temperature_id === range.id)
                        if (materialRanges.length > 0) {
                            worksheet.getCell(`B${start}`).value = keyMonth
                            number = 1
                            for (let item of materialRanges) {
                                worksheet.getCell(`C${start}`).value = number
                                worksheet.getCell(`D${start}`).value = item?.material?.name
                                worksheet.getCell(`E${start}`).value = item?.activity?.name
                                worksheet.getCell(`F${start}`).value = item?.material?.pieces_per_unit
                                worksheet.getCell(`G${start}`).value = item?.yearly_need
                                worksheet.getCell(`H${start}`).value = item?.yearly_vial
                                worksheet.getCell(`I${start}`).value = item?.yearly_box
                                worksheet.getCell(`J${start}`).value = item?.yearly_volume_need

                                number++
                                start++
                            }
                        }

                    }

                }
            } else {
                // for entity type PUSKESMAS
                for (let keyMonth in groupByMonth) {
                    const materialRanges = groupByMonth[keyMonth]
                    worksheet.getCell(`A${start}`).value = keyMonth
                    number = 1
                    for (let item of materialRanges) {
                        worksheet.getCell(`B${start}`).value = number
                        worksheet.getCell(`C${start}`).value = item?.material?.name
                        worksheet.getCell(`D${start}`).value = item?.activity?.name
                        worksheet.getCell(`E${start}`).value = item?.material?.pieces_per_unit
                        worksheet.getCell(`F${start}`).value = item?.yearly_need
                        worksheet.getCell(`G${start}`).value = item?.yearly_vial
                        worksheet.getCell(`H${start}`).value = item?.yearly_box
                        worksheet.getCell(`I${start}`).value = item?.yearly_volume_need

                        number++
                        start++
                    }

                }
            }

        }

        tableMaterials()

        return workbook
    } catch (err) {
        console.log(err)
    }
}