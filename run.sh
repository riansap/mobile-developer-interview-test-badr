docker-compose pull
docker-compose down
docker-compose up -d
docker exec -i smile-api npm run migrate
# npm install --save-dev
# npm run endpoint:generator

