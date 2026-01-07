# Network Monitor Chrome Extension

A Chrome extension that displays network requests in a draggable, resizable overlay panel on any website.

## Features

- **Real-time monitoring** of all network requests
- **Filter by type**: Fetch/XHR (default) or All requests
- **Split view**: Request list on the left, details on the right
- **Detailed request information**:
  - **Headers tab**: Request and response headers, general info
  - **Payload tab**: Request body (JSON formatted when applicable)
  - **Response tab**: Response body (JSON formatted when applicable)
- **Draggable panel** - move it anywhere on the page
- **Resizable** - adjust the panel size to your needs
- **Color-coded display**:
  - Methods: GET (green), POST (cyan), PUT (orange), DELETE (red), PATCH (purple)
  - Status codes: 2xx (green), 3xx (cyan), 4xx (orange), 5xx (red), pending (orange)
- **Request details**: Method, status code, type, duration, full URL
- **Clear button** to reset the request list

## Installation

1. **Create the extension folder structure:**
   ```
   network-monitor/
   ├── manifest.json
   ├── background.js
   ├── content.js
   └── icons/ (optional)
       ├── icon16.png
       ├── icon48.png
       └── icon128.png
   ```

2. **Copy the files:**
   - Save `manifest.json` with the manifest code
   - Save `background.js` with the background script
   - Save `content.js` with the content script

3. **Create icons (optional but recommended):**
   - Create 16x16, 48x48, and 128x128 PNG icons
   - Or remove the `icons` section from manifest.json

4. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `network-monitor` folder

## Usage

1. **Open the panel**: Click the extension icon in your Chrome toolbar
2. **Filter requests**: Toggle between "Fetch/XHR" (default) and "All" to filter request types
3. **View details**: Click on any request to see its headers, payload, and response
4. **Navigate tabs**: Switch between Headers, Payload, and Response tabs
5. **Move the panel**: Click and drag the header bar
6. **Resize the panel**: Click and drag the resize handle in the bottom-right corner
7. **Clear requests**: Click the "Clear" button in the header
8. **Close the panel**: Click the × button or click the extension icon again

## How It Works

- The extension intercepts all network requests using Chrome's `webRequest` API
- Requests are captured in real-time and displayed with their details
- The overlay panel is injected into every webpage
- All data is stored temporarily and cleared when you clear the list

## Permissions

- `webRequest`: To intercept and monitor network requests
- `activeTab`: To inject the overlay panel into active tabs
- `scripting`: To run content scripts
- `<all_urls>`: To monitor requests on all websites

## Troubleshooting

- If the panel doesn't appear, try reloading the page after installing
- If network requests aren't showing, check that the extension is enabled
- For any issues, check the Chrome DevTools console for errors