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

![image](https://github.com/connected-web/gfx-suite/assets/6341696/092f0835-6a19-4188-8dbb-698abcf9e2a0)

Private planning board on Miro:
- [https://miro.com/app/board/o9J_khFpBJo=/](https://miro.com/app/board/o9J_khFpBJo=/?moveToWidget=3074457352935427514&cot=14)

## Roadmap

### Beta

- ✅ Assess Alpha and survey for user feedback
- ✅ Implement feedback from Alpha
- ✅ Option to clear local prompt and request history
- ✅ Store initial batch results when making the request
- ✅ Show place holders based on batch size
- ✅ Add button to repeat a batch by editing an existing prompt
- ✅ Display batch details in tabbed view
- ✅ Show more progress on new image generations
- ✅ Hide batch details in tabbed view
- ✅ Store initial batch results when making the request
- ✅ Repeat a batch by editing an existing prompt
- ✅ Fix login screen prompting on every visit

### Alpha Feedback

This feedback has been grouped and prioritised to help build the Beta roadmap.

#### Key
- **Bugs 🐛**: Immediate blockers, need urgent attention.
- **Feature requests ✨**: Enhancements that improve user satisfaction, prioritized after bugs.
- **Neutral suggestions 💡**: Acknowledged but not critical; lower priority.

#### Prioritized feedback

1. **Login screen is far too common**  
   🐛 - This is a user frustration related to frequent logins, and fixing it will reduce friction.

2. **Want a way to build queries on mobile by using icons/emojis tied to filters**  
   ✨ - This is a feature request that improves mobile functionality and filtering experience.

3. **Want a way to build variations on a prompt by combining word lists**  
   ✨ - Enhances creative flexibility for users by offering more options to build prompts.

4. **Want a way to retrieve results from server**  
   🐛 - Critical for getting results efficiently, making this a functional blocker.

5. **Want a way to edit descriptions / summaries of results**  
   ✨ - A feature that improves control over content, enhancing user satisfaction.

6. **Want to clean up bad image generations**  
   ✨ - Helps refine and improve outputs, a feature that would enhance image quality control.

7. **Want to re-request failed images (send automatic report at end of generation?)**  
   🐛 - Automates failure recovery, saving time and improving the reliability of the image generation process.

8. **Want to browse other images without scrolling all the way back to top**  
   ✨ - Improves ease of navigation and enhances the user interface for a better browsing experience.

9. **Suggest render placeholders based on batch size (altho infinite loading scroll is nice)**  
   💡 - A neutral suggestion that acknowledges the current solution but offers an alternative for rendering images based on batch size. Lower priority.

## Change log

### Alpha

#### Setup Phase

- ✅ Initialise project components
- ✅ Create basic GFX Suite Website
- ✅ Create Connected Web Images API
- ✅ Create GFX Suite Remote Crank
- ✅ Setup remote FTP Server for Image Results

#### GFX Suite Website

- ✅ Host GFX Suite Website via CI Pipeline
- ✅ Add user authentication via Connected Web Identity
- ✅ Create Image Request Form
- ✅ Create Page to Diagnose Requests
- ✅ Create Image Browser
- ✅ Create Status Page

#### Connected Web Images API

- Client facing
  - ✅ Host Image API via Connected Web Services AWS
  - ✅ Create Image Request API endpoints to accept requests
  - ✅ Create Image Request API progress endpoints to monitor requests
  - ✅ Create Image Request API results endpoints to browse images
- Internal
  - ✅ Create Image Request API requests endpoints to download Remote Crank image requests
  - ✅ Create Image Request API update endpoints to receive Remote Crank results

#### GFX Suite Remote Crank

- ✅ Run service locally 
- ✅ Integrate Remote Crank with Connected Web Images API to download image requests
- ✅ Integrate Remote Crank with ComfyUI Server to generate images
- ✅ Integrate Remote Crank with Connected Web Images API to upload results
- ✅ Convert PNGs into JPG files before uploading
- ✅ Encrypt images using User's key before uploading
- ✅ Integrate Remote Crank with FTP Server to upload images

#### FTP Server

- ✅ Setup FTP Server
- ✅ Create FTP Server user accounts
- ✅ Create initial FTP Server directories

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
