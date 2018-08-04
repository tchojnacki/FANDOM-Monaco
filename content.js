/* global browser */
(() => {
  const s = document.createElement('script')
  s.src = browser.extension.getURL('injected.js')
  s.onload = function () {
    this.remove()
  }
  document.head.appendChild(s)

  browser.runtime.onMessage.addListener((request) => {
    if (request.type === 'MAKE_EDIT:B->C') {
      window.postMessage({
        type: 'MAKE_EDIT:C->P',
        data: request.data
      }, window.location.origin)
    }
  })

  window.addEventListener('message', (request) => {
    if (request.source === window && request.data.type && request.data.type === 'OPEN_EDITOR:P->C') {
      browser.runtime.sendMessage({
        type: 'OPEN_EDITOR:C->B',
        data: request.data.data
      })
    }
  })
})()
