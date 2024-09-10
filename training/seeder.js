import { entitySeeder } from './entitySeeder'

/* 
ALTER TABLE stocks AUTO_INCREMENT = 1;
ALTER TABLE transactions AUTO_INCREMENT = 1;
ALTER TABLE transaction_items AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_comments AUTO_INCREMENT = 1;
ALTER TABLE order_histories AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;
ALTER TABLE order_order_tag AUTO_INCREMENT = 1;
ALTER TABLE order_stocks AUTO_INCREMENT = 1;
ALTER TABLE batches AUTO_INCREMENT = 1;
*/

const provinceIDs = [
  35
]

const userTypes = [
  'far',
  'imun'
]

const materialIDs = [
  '5', '12', '13', '20', '21', '29', '40', '56', '57'
]

const resetMode = false

for(let prov of provinceIDs) {
  entitySeeder(prov, userTypes, materialIDs, resetMode)
}
// provinces.map(prov => {
//   Promise.all(entitySeeder(prov, userTypes, resetMode))
// })