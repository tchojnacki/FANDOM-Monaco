/* global browser, MutationObserver */
(() => {
  const s = document.createElement('script')
  s.src = browser.extension.getURL('injected.js')
  s.onload = function () {
    this.remove()
  }
  document.head.appendChild(s)

  function setEventListener () {
    document.getElementById('FandomMonaco').addEventListener('click', (event) => {
      event.preventDefault()
      browser.runtime.sendMessage({
        type: 'OPEN_EDITOR:C->B',
        data: {
          token: decodeURIComponent(event.target.getAttribute('data-monaco-token')),
          api: decodeURIComponent(event.target.getAttribute('data-monaco-api')),
          title: decodeURIComponent(event.target.getAttribute('data-monaco-title')),
          url: decodeURIComponent(event.target.getAttribute('data-monaco-url')),
          lang: event.target.getAttribute('data-monaco-lang'),
          mode: event.target.getAttribute('data-monaco-mode')
        }
      })
    })
  }

  if (document.getElementById('FandomMonaco')) {
    setEventListener()
  } else {
    const observer = new MutationObserver(() => {
      if (document.getElementById('FandomMonaco')) {
        setEventListener()
        observer.disconnect()
      }
    })
    observer.observe(document.querySelector('.page-header__contribution-buttons .wds-list'), { childList: true })
  }

  browser.runtime.onMessage.addListener((request) => {
    if (request.type === 'MAKE_EDIT:B->C') {
      window.postMessage({
        type: 'MAKE_EDIT:C->P',
        data: request.data
      }, '*')
    }
  })
})()
