(() => {
  if (window.$('#FandomMonaco').length !== 0) {
    return
  }
  const config = window.mw.config.get(['wgPageName', 'wgScriptPath', 'wgUserName', 'wgNamespaceNumber'])
  if (config.wgPageName.match(new RegExp(`:${config.wgUserName}/.*\\.(js|css)$`)) && config.wgNamespaceNumber === 2) {
    const lang = config.wgPageName.match(/\.(css|js)$/)[1] === 'js' ? 'javascript' : 'css'
    window.$('.page-header__contribution-buttons .wds-list').append(
      window.$('<li>').append(
        window.$('<a>', {
          'text': 'Monaco',
          'href': '#',
          'id': 'FandomMonaco',
          'data-monaco-api': encodeURIComponent(window.location.origin + config.wgScriptPath),
          'data-monaco-title': encodeURIComponent(config.wgPageName),
          'data-monaco-url': encodeURIComponent(window.location.href),
          'data-monaco-lang': lang
        })
      )
    )
  }
})()
