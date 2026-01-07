// Track network requests per tab
const tabRequests = new Map();

// Buffer requests for tabs where content script isn't ready yet
const pendingRequests = new Map();

// Capture request details
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId > 0) {
      const req = {
        id: details.requestId,
        url: details.url,
        method: details.method,
        type: details.type,
        timestamp: Date.now(),
        status: 'pending',
        requestBody: null
      };
      
      // Capture request body if present
      if (details.requestBody) {
        if (details.requestBody.raw) {
          const decoder = new TextDecoder('utf-8');
          const body = details.requestBody.raw.map(item => 
            decoder.decode(item.bytes)
          ).join('');
          req.requestBody = body;
        } else if (details.requestBody.formData) {
          req.requestBody = JSON.stringify(details.requestBody.formData);
        }
      }
      
      // Store in tab's request buffer
      if (!tabRequests.has(details.tabId)) {
        tabRequests.set(details.tabId, new Map());
      }
      tabRequests.get(details.tabId).set(details.requestId, req);
      
      // Try to send, but buffer if it fails
      sendToTab(details.tabId, {
        type: 'network-request',
        data: req
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// Capture request headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (details.tabId > 0) {
      const tabReqs = tabRequests.get(details.tabId);
      if (tabReqs && tabReqs.has(details.requestId)) {
        const req = tabReqs.get(details.requestId);
        req.requestHeaders = {};
        
        if (details.requestHeaders) {
          details.requestHeaders.forEach(header => {
            req.requestHeaders[header.name] = header.value;
          });
        }
        
        sendToTab(details.tabId, {
          type: 'network-complete',
          data: req
        });
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// Capture response headers
chrome.webRequest.onResponseStarted.addListener(
  (details) => {
    if (details.tabId > 0) {
      const tabReqs = tabRequests.get(details.tabId);
      if (tabReqs && tabReqs.has(details.requestId)) {
        const req = tabReqs.get(details.requestId);
        req.responseHeaders = {};
        
        if (details.responseHeaders) {
          details.responseHeaders.forEach(header => {
            req.responseHeaders[header.name] = header.value;
          });
        }
        
        req.remoteAddress = details.ip;
        
        sendToTab(details.tabId, {
          type: 'network-complete',
          data: req
        });
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Capture final status
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId > 0) {
      const tabReqs = tabRequests.get(details.tabId);
      if (tabReqs && tabReqs.has(details.requestId)) {
        const req = tabReqs.get(details.requestId);
        req.status = details.statusCode;
        req.duration = Date.now() - req.timestamp;
        
        sendToTab(details.tabId, {
          type: 'network-complete',
          data: req
        });
        
        // Fetch response body for XHR/Fetch requests
        if (req.type === 'xmlhttprequest' || req.type === 'fetch') {
          fetchResponseBody(details.tabId, details.requestId, details.url);
        }
        
        // Clean up after a delay
        setTimeout(() => {
          if (tabReqs.has(details.requestId)) {
            tabReqs.delete(details.requestId);
          }
        }, 60000); // Keep for 1 minute
      }
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (details.tabId > 0) {
      const tabReqs = tabRequests.get(details.tabId);
      if (tabReqs && tabReqs.has(details.requestId)) {
        const req = tabReqs.get(details.requestId);
        req.status = 'error';
        req.error = details.error;
        req.duration = Date.now() - req.timestamp;
        
        sendToTab(details.tabId, {
          type: 'network-complete',
          data: req
        });
        
        tabReqs.delete(details.requestId);
      }
    }
  },
  { urls: ["<all_urls>"] }
);

// Fetch response body using a content script injection
function fetchResponseBody(tabId, requestId, url) {
  // We'll inject code to intercept fetch/XHR responses
  // Note: This is a limitation - we can't easily get response bodies from webRequest API
  // The content script will need to intercept fetch/XHR at a higher level
}

// Helper function to send messages with buffering
function sendToTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    // Content script not ready, buffer the message
    if (!pendingRequests.has(tabId)) {
      pendingRequests.set(tabId, []);
    }
    pendingRequests.get(tabId).push(message);
  });
}

// Listen for content script ready signal
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'content-script-ready' && sender.tab) {
    const tabId = sender.tab.id;
    
    // Send all buffered requests
    if (pendingRequests.has(tabId)) {
      const buffered = pendingRequests.get(tabId);
      buffered.forEach(msg => {
        chrome.tabs.sendMessage(tabId, msg).catch(() => {});
      });
      pendingRequests.delete(tabId);
    }
    
    sendResponse({ status: 'ok' });
  } else if (message.type === 'response-body') {
    // Receive response body from content script interceptor
    const tabReqs = tabRequests.get(message.tabId);
    if (tabReqs) {
      tabReqs.forEach((req, id) => {
        if (req.url === message.url) {
          req.responseBody = message.body;
          sendToTab(message.tabId, {
            type: 'network-complete',
            data: req
          });
        }
      });
    }
  }
  return true;
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabRequests.delete(tabId);
  pendingRequests.delete(tabId);
});

// Toggle panel visibility
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { type: 'toggle-panel' }).catch(() => {
    console.log('Content script not loaded yet. Please refresh the page.');
  });
});