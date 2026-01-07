let networkRequests = [];
let panelVisible = false;
let panel, header, content, resizer;
let isDragging = false;
let isResizing = false;
let currentX, currentY, initialX, initialY;
let initialWidth, initialHeight;
let filterMode = 'fetch'; // 'fetch' or 'all'
let selectedRequest = null;

function createPanel() {
  if (panel) return;
  
  // Wait for body to be available
  if (!document.body) {
    return;
  }

  // Create main panel
  panel = document.createElement('div');
  panel.id = 'network-monitor-panel';
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 800px;
    height: 600px;
    background: #1e1e1e;
    border: 1px solid #3c3c3c;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    z-index: 2147483647;
    display: none;
    flex-direction: column;
    font-family: 'Segoe UI', system-ui, sans-serif;
  `;

  // Create header
  header = document.createElement('div');
  header.style.cssText = `
    background: #2d2d2d;
    padding: 12px 16px;
    border-bottom: 1px solid #3c3c3c;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 8px 8px 0 0;
    user-select: none;
  `;

  const leftSection = document.createElement('div');
  leftSection.style.cssText = 'display: flex; align-items: center; gap: 12px;';

  const title = document.createElement('span');
  title.textContent = 'Network Monitor';
  title.style.cssText = `
    color: #fff;
    font-weight: 600;
    font-size: 14px;
  `;

  // Filter buttons
  const filterContainer = document.createElement('div');
  filterContainer.style.cssText = 'display: flex; gap: 4px;';

  const fetchBtn = createFilterButton('Fetch/XHR', 'fetch');
  const allBtn = createFilterButton('All', 'all');

  filterContainer.appendChild(fetchBtn);
  filterContainer.appendChild(allBtn);

  leftSection.appendChild(title);
  leftSection.appendChild(filterContainer);

  const controls = document.createElement('div');
  controls.style.cssText = 'display: flex; gap: 8px;';

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear';
  clearBtn.style.cssText = `
    background: #3c3c3c;
    border: none;
    color: #fff;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `;
  clearBtn.onmouseover = () => clearBtn.style.background = '#4c4c4c';
  clearBtn.onmouseout = () => clearBtn.style.background = '#3c3c3c';
  clearBtn.onclick = () => {
    networkRequests = [];
    selectedRequest = null;
    renderRequests();
  };

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    line-height: 20px;
  `;
  closeBtn.onmouseover = () => closeBtn.style.color = '#ff5555';
  closeBtn.onmouseout = () => closeBtn.style.color = '#fff';
  closeBtn.onclick = () => togglePanel();

  controls.appendChild(clearBtn);
  controls.appendChild(closeBtn);
  header.appendChild(leftSection);
  header.appendChild(controls);

  // Create content area with split view
  content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
    display: flex;
    overflow: hidden;
  `;

  // Create resizer
  resizer = document.createElement('div');
  resizer.style.cssText = `
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: se-resize;
    background: linear-gradient(135deg, transparent 50%, #3c3c3c 50%);
    border-radius: 0 0 8px 0;
  `;

  panel.appendChild(header);
  panel.appendChild(content);
  panel.appendChild(resizer);
  document.body.appendChild(panel);

  setupDragging();
  setupResizing();
  renderRequests();
}

function createFilterButton(text, mode) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.cssText = `
    background: ${filterMode === mode ? '#0066cc' : '#3c3c3c'};
    border: none;
    color: #fff;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    transition: 300ms;
  `;
  btn.onmouseover = () => {
    if (filterMode !== mode) btn.style.background = '#4c4c4c';
  };
  btn.onmouseout = () => {
    btn.style.background = filterMode === mode ? '#0066cc' : '#3c3c3c';
  };
  btn.onclick = () => {
    filterMode = mode;
    selectedRequest = null;
    renderRequests();
  };
  return btn;
}

function setupDragging() {
  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    initialX = e.clientX - panel.offsetLeft;
    initialY = e.clientY - panel.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      panel.style.left = currentX + 'px';
      panel.style.top = currentY + 'px';
      panel.style.right = 'auto';
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

function setupResizing() {
  resizer.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isResizing = true;
    initialWidth = panel.offsetWidth;
    initialHeight = panel.offsetHeight;
    initialX = e.clientX;
    initialY = e.clientY;
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      e.preventDefault();
      const width = initialWidth + (e.clientX - initialX);
      const height = initialHeight + (e.clientY - initialY);
      
      panel.style.width = Math.max(600, width) + 'px';
      panel.style.height = Math.max(400, height) + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
}

function togglePanel() {
  panelVisible = !panelVisible;
  if (panel) {
    panel.style.display = panelVisible ? 'flex' : 'none';
  }
}

function getStatusColor(status) {
  if (status === 'pending') return '#ffa500';
  if (status === 'error') return '#ff5555';
  if (status >= 200 && status < 300) return '#50fa7b';
  if (status >= 300 && status < 400) return '#8be9fd';
  if (status >= 400 && status < 500) return '#ffb86c';
  if (status >= 500) return '#ff5555';
  return '#6272a4';
}

function getMethodColor(method) {
  const colors = {
    'GET': '#50fa7b',
    'POST': '#8be9fd',
    'PUT': '#ffb86c',
    'DELETE': '#ff5555',
    'PATCH': '#bd93f9'
  };
  return colors[method] || '#f8f8f2';
}

function isXHRorFetch(type) {
  return type === 'xmlhttprequest' || type === 'fetch';
}

function getFilteredRequests() {
  if (filterMode === 'fetch') {
    return networkRequests.filter(req => isXHRorFetch(req.type));
  }
  return networkRequests;
}

function renderRequests() {
  if (!content) return;

  content.innerHTML = '';

  // Left panel - Request list
  const requestList = document.createElement('div');
  requestList.style.cssText = `
    width: ${selectedRequest ? '40%' : '100%'};
    border-right: ${selectedRequest ? '1px solid #3c3c3c' : 'none'};
    overflow-y: auto;
    padding: 8px;
    transition: width 0.2s;
  `;

  const filteredRequests = getFilteredRequests();
  
  if (filteredRequests.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = filterMode === 'fetch' 
      ? 'No Fetch/XHR requests captured yet...'
      : 'No network requests captured yet...';
    empty.style.cssText = `
      color: #6272a4;
      text-align: center;
      padding: 40px;
      font-size: 13px;
    `;
    requestList.appendChild(empty);
  } else {
    filteredRequests.slice().reverse().forEach(req => {
      const reqEl = document.createElement('div');
      reqEl.style.cssText = `
        background: ${selectedRequest?.id === req.id ? '#333' : '#2d2d2d'};
        border: 1px solid ${selectedRequest?.id === req.id ? '#0066cc' : '#3c3c3c'};
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: background 0.2s;
      `;
      reqEl.onmouseover = () => {
        if (selectedRequest?.id !== req.id) reqEl.style.background = '#333';
      };
      reqEl.onmouseout = () => {
        if (selectedRequest?.id !== req.id) reqEl.style.background = '#2d2d2d';
      };
      reqEl.onclick = () => {
        selectedRequest = req;
        renderRequests();
      };

      const firstLine = document.createElement('div');
      firstLine.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 6px;
        align-items: center;
      `;

      const method = document.createElement('span');
      method.textContent = req.method;
      method.style.cssText = `
        color: ${getMethodColor(req.method)};
        font-weight: 700;
        font-size: 11px;
        background: rgba(255,255,255,0.1);
        padding: 2px 6px;
        border-radius: 3px;
      `;

      const status = document.createElement('span');
      status.textContent = req.status === 'pending' ? '⏳' : req.status === 'error' ? '❌' : req.status;
      status.style.cssText = `
        color: ${getStatusColor(req.status)};
        font-weight: 700;
        font-size: 11px;
        background: rgba(255,255,255,0.1);
        padding: 2px 6px;
        border-radius: 3px;
      `;

      const type = document.createElement('span');
      type.textContent = req.type;
      type.style.cssText = `
        color: #bd93f9;
        font-size: 10px;
        background: rgba(189,147,249,0.2);
        padding: 2px 6px;
        border-radius: 3px;
      `;

      if (req.duration) {
        const duration = document.createElement('span');
        duration.textContent = `${req.duration}ms`;
        duration.style.cssText = `
          color: #6272a4;
          font-size: 10px;
          margin-left: auto;
        `;
        firstLine.appendChild(duration);
      }

      firstLine.appendChild(method);
      firstLine.appendChild(status);
      firstLine.appendChild(type);

      const url = document.createElement('div');
      const urlObj = new URL(req.url);
      url.textContent = urlObj.pathname + urlObj.search;
      url.title = req.url;
      url.style.cssText = `
        color: #8be9fd;
        font-size: 11px;
        word-break: break-all;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;

      reqEl.appendChild(firstLine);
      reqEl.appendChild(url);
      requestList.appendChild(reqEl);
    });
  }

  content.appendChild(requestList);

  // Right panel - Request details
  if (selectedRequest) {
    const detailsPanel = document.createElement('div');
    detailsPanel.style.cssText = `
      width: 60%;
      overflow-y: auto;
      padding: 12px;
      color: #d4d4d4;
    `;

    // Tabs
    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
      border-bottom: 1px solid #3c3c3c;
      padding-bottom: 8px;
    `;

    const tabButtons = ['Headers', 'Payload', 'Response'];
    let activeTab = 'Headers';

    const tabContent = document.createElement('div');
    tabContent.style.cssText = `
      font-size: 12px;
      line-height: 1.6;
    `;

    const renderTabContent = (tab) => {
      tabContent.innerHTML = '';
      
      if (tab === 'Headers') {
        const section = createSection('General', [
          ['Request URL', selectedRequest.url],
          ['Request Method', selectedRequest.method],
          ['Status Code', selectedRequest.status],
          ['Remote Address', selectedRequest.remoteAddress || 'N/A']
        ]);
        tabContent.appendChild(section);

        if (selectedRequest.requestHeaders) {
          const reqHeaders = createSection('Request Headers', 
            Object.entries(selectedRequest.requestHeaders)
          );
          tabContent.appendChild(reqHeaders);
        }

        if (selectedRequest.responseHeaders) {
          const resHeaders = createSection('Response Headers',
            Object.entries(selectedRequest.responseHeaders)
          );
          tabContent.appendChild(resHeaders);
        }
      } else if (tab === 'Payload') {
        if (selectedRequest.requestBody) {
          try {
            const parsed = JSON.parse(selectedRequest.requestBody);
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(parsed, null, 2);
            pre.style.cssText = `
              background: #2d2d2d;
              padding: 12px;
              border-radius: 4px;
              overflow-x: auto;
              color: #50fa7b;
              margin: 0;
            `;
            tabContent.appendChild(pre);
          } catch {
            const pre = document.createElement('pre');
            pre.textContent = selectedRequest.requestBody;
            pre.style.cssText = `
              background: #2d2d2d;
              padding: 12px;
              border-radius: 4px;
              overflow-x: auto;
              color: #f8f8f2;
              margin: 0;
            `;
            tabContent.appendChild(pre);
          }
        } else {
          const empty = document.createElement('div');
          empty.textContent = 'No payload data';
          empty.style.color = '#6272a4';
          tabContent.appendChild(empty);
        }
      } else if (tab === 'Response') {
        if (selectedRequest.responseBody) {
          try {
            const parsed = JSON.parse(selectedRequest.responseBody);
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(parsed, null, 2);
            pre.style.cssText = `
              background: #2d2d2d;
              padding: 12px;
              border-radius: 4px;
              overflow-x: auto;
              color: #8be9fd;
              margin: 0;
            `;
            tabContent.appendChild(pre);
          } catch {
            const pre = document.createElement('pre');
            pre.textContent = selectedRequest.responseBody;
            pre.style.cssText = `
              background: #2d2d2d;
              padding: 12px;
              border-radius: 4px;
              overflow-x: auto;
              color: #f8f8f2;
              margin: 0;
            `;
            tabContent.appendChild(pre);
          }
        } else if (selectedRequest.status === 'pending') {
          const pending = document.createElement('div');
          pending.textContent = 'Request pending...';
          pending.style.color = '#ffa500';
          tabContent.appendChild(pending);
        } else {
          const empty = document.createElement('div');
          empty.textContent = 'No response body';
          empty.style.color = '#6272a4';
          tabContent.appendChild(empty);
        }
      }
    };

    tabButtons.forEach(tabName => {
      const btn = document.createElement('button');
      btn.textContent = tabName;
      btn.style.cssText = `
        background: ${activeTab === tabName ? '#0066cc' : 'transparent'};
        border: none;
        color: ${activeTab === tabName ? '#fff' : '#8be9fd'};
        padding: 6px 12px;
        border-radius: 4px 4px 0 0;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      `;
      btn.onmouseover = () => {
        if (activeTab !== tabName) btn.style.background = '#2d2d2d';
      };
      btn.onmouseout = () => {
        if (activeTab !== tabName) btn.style.background = 'transparent';
      };
      btn.onclick = () => {
        activeTab = tabName;
        tabs.querySelectorAll('button').forEach((b, i) => {
          b.style.background = tabButtons[i] === activeTab ? '#0066cc' : 'transparent';
          b.style.color = tabButtons[i] === activeTab ? '#fff' : '#8be9fd';
        });
        renderTabContent(activeTab);
      };
      tabs.appendChild(btn);
    });

    renderTabContent(activeTab);

    detailsPanel.appendChild(tabs);
    detailsPanel.appendChild(tabContent);
    content.appendChild(detailsPanel);
  }
}

function createSection(title, entries) {
  const section = document.createElement('div');
  section.style.cssText = 'margin-bottom: 20px;';

  const sectionTitle = document.createElement('div');
  sectionTitle.textContent = title;
  sectionTitle.style.cssText = `
    color: #fff;
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 8px;
  `;

  const table = document.createElement('div');
  table.style.cssText = `
    background: #2d2d2d;
    border-radius: 4px;
    padding: 8px;
  `;

  entries.forEach(([key, value]) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 12px;
      padding: 6px 0;
      border-bottom: 1px solid #3c3c3c;
    `;

    const keyEl = document.createElement('div');
    keyEl.textContent = key + ':';
    keyEl.style.cssText = `
      color: #bd93f9;
      font-weight: 500;
    `;

    const valueEl = document.createElement('div');
    valueEl.textContent = value || 'N/A';
    valueEl.style.cssText = `
      color: #f8f8f2;
      word-break: break-all;
    `;

    row.appendChild(keyEl);
    row.appendChild(valueEl);
    table.appendChild(row);
  });

  section.appendChild(sectionTitle);
  section.appendChild(table);
  return section;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'toggle-panel') {
    createPanel();
    togglePanel();
  } else if (message.type === 'network-request') {
    createPanel();
    networkRequests.push(message.data);
    if (panelVisible) {
      renderRequests();
    }
  } else if (message.type === 'network-complete') {
    const index = networkRequests.findIndex(r => r.id === message.data.id);
    if (index !== -1) {
      networkRequests[index] = { ...networkRequests[index], ...message.data };
      if (panelVisible && selectedRequest?.id === message.data.id) {
        selectedRequest = networkRequests[index];
      }
      if (panelVisible) {
        renderRequests();
      }
    }
  }
});

// Initialize on load and notify background script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtension);
} else {
  initExtension();
}

function initExtension() {
  createPanel();
  
  // Inject the interceptor script into the page
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      'use strict';

      // Intercept fetch
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0] instanceof Request ? args[0].url : args[0];
        
        return originalFetch.apply(this, args).then(async (response) => {
          const clonedResponse = response.clone();
          
          try {
            const contentType = response.headers.get('content-type');
            let body;
            
            if (contentType && contentType.includes('application/json')) {
              body = await clonedResponse.text();
            } else if (contentType && contentType.includes('text')) {
              body = await clonedResponse.text();
            } else {
              body = '[Binary Data]';
            }
            
            window.postMessage({
              type: 'network-response-captured',
              url: url,
              body: body,
              status: response.status
            }, '*');
            
          } catch (err) {
            console.error('Error capturing fetch response:', err);
          }
          
          return response;
        });
      };

      // Intercept XMLHttpRequest
      const XHR = XMLHttpRequest.prototype;
      const originalOpen = XHR.open;
      const originalSend = XHR.send;

      XHR.open = function(method, url) {
        this._url = url;
        this._method = method;
        return originalOpen.apply(this, arguments);
      };

      XHR.send = function(body) {
        this.addEventListener('load', function() {
          try {
            let responseBody = this.responseText;
            
            if (!responseBody && this.response) {
              responseBody = typeof this.response === 'string' 
                ? this.response 
                : '[Binary Data]';
            }
            
            window.postMessage({
              type: 'network-response-captured',
              url: this._url,
              body: responseBody,
              status: this.status
            }, '*');
            
          } catch (err) {
            console.error('Error capturing XHR response:', err);
          }
        });
        
        return originalSend.apply(this, arguments);
      };
    })();
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
  
  // Listen for intercepted responses
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'network-response-captured') {
      // Find the matching request and update it
      const req = networkRequests.find(r => r.url === event.data.url && !r.responseBody);
      if (req) {
        req.responseBody = event.data.body;
        if (panelVisible && selectedRequest?.id === req.id) {
          selectedRequest = req;
          renderRequests();
        }
      }
    }
  });
  
  // Notify background script that content script is ready
  chrome.runtime.sendMessage({ type: 'content-script-ready' }).catch(() => {
    // Background script might not be ready yet, that's ok
  });
}