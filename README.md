# GFX Suite

A set of online tools for providing authenticated access to the Connected Web Images API.

## Key features

- GFX Suite - hosted web interface with user authentication
- Images API - hosted web API for taking image requests
- Remote Crank - locally hosted image gen server
- Image hosting - images uploaded via FTP to be displayed in browser

Utilises [comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI) as a local image gen service; using the Remote Crank to receive and process image requests.

The system is designed for cost-effective hosting - providing a public presence online (accessible from anywhere), while taking advantage of local hardware for relatively expensive image processing tasks.

## Proposed Architecture

![image](https://github.com/connected-web/gfx-suite/assets/6341696/1537688d-414f-49f0-85b8-9a51d4442463)

Private planning board on Miro:
- [https://miro.com/app/board/o9J_khFpBJo=/](https://miro.com/app/board/o9J_khFpBJo=/?moveToWidget=3074457352935427514&cot=14)

## Roadmap

### Setup Phase

- ✅ Initialise project components
- ✅ Create basic GFX Suite Website
- ✅ Create Connected Web Images API
- ✅ Create GFX Suite Remote Crank
- ✅ Setup remote FTP Server for Image Results

### GFX Suite Website

- ✅ Host GFX Suite Website via CI Pipeline
- ✅ Add user authentication via Connected Web Identity
- 🚧 Create Image Request Form
- 🚧 Create Image Browser
- 🚧 Create Status Page

### Connected Web Images API

- Client facing
  - ✅ Host Image API via Connected Web Services AWS
  - 🚧 Create Image Request API endpoints to accept requests
  - 🚧 Create Image Request API progress endpoints to monitor requests
  - 🚧 Create Image Request API results endpoints to browse images
- Internal
  - 🚧 Create Image Request API requests endpoints to download Remote Crank batches
  - 🚧 Create Image Request API update endpoints to receive Remote Crank results

### GFX Suite Remote Crank

- ✅ Run service locally 
- 🚧 Integrate Remote Crank with ComfyUI Server to generate images
- 🚧 Integrate Remote Crank with Connected Web Images API to download batches
- 🚧 Integrate Remote Crank with Connected Web Images API to upload results
- 🚧 Convert PNGs into JPG files before uploading
- 🚧 Integrate Remote Crank with FTP Server to upload images

### FTP Server

- ✅ Setup FTP Server
- ✅ Create FTP Server user accounts
- 🚧 Create FTP Server directories

## Contributing

If you'd like to help with any of these features, please raise an issue or pull request.

## Setup

Prerequisites:

- NodeJS LTS (> 20)

Clone this repo:

```
git clone https://github.com/connected-web/gfx-suite.git
```

Install dependencies:

```
cd gfx-suite
npm install
```
Start the local dev servers, run:

```
npm run start
```

The UI is currently hosted on `http://localhost:8200/`, and communicates with the Connected Web Image API through using credentials from your browser.
