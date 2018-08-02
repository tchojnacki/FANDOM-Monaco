/* global browser, MutationObserver */
(() => {
  browser.runtime.onMessage.addListener((request) => {
    if (request.type === 'make_edit') {
      const es = document.createElement('script')
      es.textContent =
`new mw.Api().post({
  action: 'edit',
  title: '${request.data.title}',
  text: '${request.data.text.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}',
  summary: '${request.data.summary.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}',
  token: mw.user.tokens.get('editToken')
}).then(() => {
  window.location.reload(true);
});`
      es.onload = function () {
        this.remove()
      }
      document.head.appendChild(es)
    }
  })

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
        type: 'open_editor',
        data: {
          token: decodeURIComponent(event.target.getAttribute('data-monaco-token')),
          api: decodeURIComponent(event.target.getAttribute('data-monaco-api')),
          title: decodeURIComponent(event.target.getAttribute('data-monaco-title')),
          url: decodeURIComponent(event.target.getAttribute('data-monaco-url')),
          lang: event.target.getAttribute('data-monaco-lang')
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
})()
