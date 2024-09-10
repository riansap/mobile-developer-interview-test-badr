SELECT *
FROM entities et
WHERE 
	et.`type` = 1
	and et.province_id in (91, 92, 93, 94, 95, 96)
	
update entities
set entities.province_id_new = 94
WHERE 
	entities.id = 1165098

	
UPDATE entities 
SET 
	entities.province_id_old = entities.province_id,
	entities.regency_id_old = entities.regency_id,
	entities.sub_district_id_old = entities.sub_district_id,
	entities.village_id_old = entities.village_id
	
-- MAP THIS TABLE PROVINCE_ID_NEW FROM THE UDPATED PROVINCES TABLE
UPDATE entities, provinces
SET entities.province_id_new = provinces.province_id_new 
WHERE
	entities.province_id_old = provinces.province_id_old

SELECT count(*)
FROM entities e
WHERE e.regency_id_new is NULL;

SELECT 
	et.id,
	et.name,
	et.province_id,
	et.province_id_old,
	et.province_id_new,
	et.regency_id,
	et.regency_id_old,
	et.regency_id_new
FROM entities et
WHERE 
	SUBSTRING(et.regency_id_new, 1, 2) = et.province_id_new

-- MAP THIS TABLE REGENCY_ID_NEW FROM THE UDPATED REGENCIES TABLE
UPDATE entities, regencies
SET 
	entities.regency_id_new = regencies.regency_id_new
WHERE
	entities.regency_id_old = regencies.regency_id_old
	and entities.regency_id_old is not null
	and entities.province_id in (91, 92, 93, 94, 95, 96)
	and regencies.province_id in (91, 92, 93, 94, 95, 96)

-- update province_id_new daerah pemekaran
UPDATE entities e SET e.province_id_new = LEFT(e.regency_id_new, 2) 
WHERE 	e.regency_id_old is not null
	and e.province_id in (91, 92, 93, 94, 95, 96)
  AND e.regency_id_new != e.regency_id_old
	
SELECT *
FROM entities e
JOIN regencies r ON e.regency_id_old = r.regency_id_old
WHERE 
	e.regency_id_old is not null
	and e.province_id in (91, 92, 93, 94, 95, 96)
	and r.province_id in (91, 92, 93, 94, 95, 96)

SELECT count(*)
FROM entities e
WHERE e.regency_id_new is NULL;

SELECT *
FROM entities et
WHERE 
	SUBSTRING(et.sub_district_id_new, 1, 4) = et.regency_id_new

-- MAP THIS TABLE SUB_DISTRICT_ID_NEW FROM THE UDPATED SUB_DISTRICTS TABLE
UPDATE entities, sub_districts
SET 
	entities.sub_district_id_new = sub_districts.sub_district_id_new
WHERE 
	entities.sub_district_id_old = sub_districts.sub_district_id_old
	and entities.sub_district_id_old is not null
	and entities.regency_id in (9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109, 9110,
  9111, 9112, 9113, 9114, 9115, 9116, 9117, 9118, 9119, 9120,
  9121, 9122, 9123, 9124, 9125, 9126, 9127, 9128, 9171, 9201,
  9202, 9203, 9204, 9205, 9206, 9207, 9208, 9209, 9210, 9211,
  9212, 9271, 9471)
	and sub_districts.regency_id_old in (9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109, 9110,
  9111, 9112, 9113, 9114, 9115, 9116, 9117, 9118, 9119, 9120,
  9121, 9122, 9123, 9124, 9125, 9126, 9127, 9128, 9171, 9201,
  9202, 9203, 9204, 9205, 9206, 9207, 9208, 9209, 9210, 9211,
  9212, 9271, 9471)
	
SELECT regency_id_old
FROM regencies r
WHERE r.province_id_old in (91, 92, 93, 94, 95, 96)
	
SELECT *
FROM entities e
JOIN sub_districts sd ON e.sub_district_id_old = sd.sub_district_id_old
WHERE
	e.sub_district_id_old is not null
	and e.regency_id in (9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109, 9110,
  9111, 9112, 9113, 9114, 9115, 9116, 9117, 9118, 9119, 9120,
  9121, 9122, 9123, 9124, 9125, 9126, 9127, 9128, 9171, 9201,
  9202, 9203, 9204, 9205, 9206, 9207, 9208, 9209, 9210, 9211,
  9212, 9271, 9471)
	and sd.regency_id in (9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109, 9110,
  9111, 9112, 9113, 9114, 9115, 9116, 9117, 9118, 9119, 9120,
  9121, 9122, 9123, 9124, 9125, 9126, 9127, 9128, 9171, 9201,
  9202, 9203, 9204, 9205, 9206, 9207, 9208, 9209, 9210, 9211,
  9212, 9271, 9471)

SELECT count(*)
FROM entities e
WHERE e.sub_district_id_new is NULL;

SELECT * FROM sub_districts sd
WHERE 
	SUBSTRING(sd.sub_district_id_new, 1, 4) != sd.regency_id_new 

-- MAP THIS TABLE VILLAGE_ID_NEW FROM THE UDPATED VILLAGES TABLE
UPDATE entities, villages
SET 
	entities.village_id_new = villages.village_id_new 
WHERE 
	entities.village_id_old = villages.village_id_old 
	and entities.village_id_old is not null
	and entities.province_id in (91, 92, 93,94,95,96)

SELECT count(*)
FROM entities e
WHERE e.village_id_new is NULL and e.village_id is not null;

SELECT 
	et.id,
	et.name,
	et.sub_district_id,
	et.sub_district_id_old,
	et.sub_district_id_new,
	et.village_id,
	et.village_id_old,
	et.village_id_new
FROM entities et
WHERE 
	SUBSTRING(et.village_id_new, 1, 6) != et.sub_district_id_new

SELECT type
FROM entities e
WHERE e.village_id is not NULL
group by type

SELECT 
	e.id,
	e.name,
	e.village_id,
	e.village_id_old,
	e.village_id_new
FROM entities e
WHERE e.village_id is not null

SELECT * FROM villages vl
WHERE vl.id = 9271061002

-- UPDATE PROVINCE_ID_NEW TYPE 2
UPDATE entities 
SET entities.province_id_new = LEFT(entities.regency_id_new, 2)
WHERE
	entities.`type` = 2 
	and entities.regency_id_old != regency_id_new
	
-- UPDATE REGENCY_ID_NEW TYPE 3 
UPDATE entities 
SET entities.regency_id_new = LEFT(entities.sub_district_id_new, 4)
WHERE
	entities.`type` = 3
	and entities.sub_district_id_old != sub_district_id_new
	
-- UPDATE PROVINCE_ID_NEW TYPE 3
UPDATE entities 
SET entities.province_id_new = LEFT(entities.regency_id_new, 2)
WHERE
	entities.`type` = 3
	and entities.sub_district_id_old != sub_district_id_new	

-- UPDATE PRIMARY ID
UPDATE entities et
SET 
	et.province_id = COALESCE(et.province_id_new, et.province_id),
	et.regency_id = COALESCE(et.regency_id_new, et.regency_id),
	et.sub_district_id = COALESCE(et.sub_district_id_new, et.sub_district_id),
	et.village_id = COALESCE(et.village_id_new, et.village_id)
WHERE 
	et.province_id_new != et.province_id_old