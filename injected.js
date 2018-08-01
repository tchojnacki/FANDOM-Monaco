(() => {
  if (window.$('#FandomMonaco').length !== 0) {
    return
  }
  const config = window.mw.config.get(['wgPageName', 'wgScriptPath', 'wgUserName', 'wgNamespaceNumber', 'wgUserGroups'])
  let enabled = false
  let lang = 'plain'
  if (config.wgNamespaceNumber === 2) {
    if (config.wgPageName.match(new RegExp(`:${config.wgUserName}/.*\\.js$`))) {
      enabled = true
      lang = 'javascript'
    } else if (config.wgPageName.match(new RegExp(`:${config.wgUserName}/.*\\.css$`))) {
      enabled = true
      lang = 'css'
    }
  } else if (config.wgNamespaceNumber === 8) {
    if (config.wgUserGroups.includes('sysop')) {
      enabled = true
    }
    if (config.wgPageName.endsWith('.js')) {
      lang = 'javascript'
    } else if (config.wgPageName.endsWith('.css')) {
      lang = 'css'
    }
  }

  if (enabled) {
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
