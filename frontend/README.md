# Holocron frontend

## Setup and installation
Go to http://localhost:8000/ after following the setup steps for running the application either locally or in a docker container.

### Local
  * `cd frontend`
  * `npm install`
  * `npm run dev`

### Docker
To run the application in docker, either for the first time or after changing `docker-compose.yml`:
* `npm run docker-first` 

After that the following commands may prove useful:
* `npm run docker-start`   
* `npm run docker-stop`
* `npm run docker-restart`
* `npm run docker-clear`

For reference, the following guide was used to configure docker: [How to use React or Vue with Vite and Docker ](https://dev.to/ysmnikhil/how-to-build-with-react-or-vue-with-vite-and-docker-1a3l)

## Additional Info

### API Client
Client is generated using [swagger-typescript-api](https://github.com/acacode/swagger-typescript-api):
* `npm run gen`

