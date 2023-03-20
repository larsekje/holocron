# Holocron - backend
A collection of tools and resources to aid the GM in a campaign of SWRPG.


Architecture based on https://ryax.tech/how-to-build-backend-part1/
- domain: 
- application:
- infrastructure: The arms and legs of the application. CRUD for db and REST goes here

## Setup and installation
### Local
Create a virtual environment and install poetry with `pip install poetry`, and then `poetry install` for dependencies. 

Mark `\backend` as source to fix IDE complaining about imports: **Settings | Project: holocron | Project Structure**:

Verify everything is ok by running `app.py` and check http://localhost:8080/docs.

### Docker

The docker container expects the following files and folders:
- /pickle/
- /data/
- config.yml

## Usage
See http://192.168.0.249:32781/docs for swagger documentation
