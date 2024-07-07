# Local Data

Requests from the GFX Suite Website are processed by the Connected Web Images API.

The API queues requests and waits for the GFX Suite Remote Crank to download and process them.

When the requests are downloaded, they are stored in the `localdata` directory until processed. This ensures that the requests are not lost if the Remote Crank is restarted.

## Folder Structure

- `localdata/requests` - Contains the requests downloaded from the API
- `localdata/results` - Contains the results of processed requests