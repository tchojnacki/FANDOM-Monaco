(() => {
  if (window.$('#FandomMonaco').length !== 0) {
    return
  }
  const config = window.mw.config.get(['wgPageName', 'wgCurRevisionId', 'wgScriptPath', 'wgArticlePath', 'wgUserName', 'wgUserLanguage', 'wgNamespaceNumber', 'wgUserGroups', 'wgCityId', 'wgWikiaPageActions'])
  const hasGlobalEI = ['content-volunteer', 'helper', 'util', 'staff', 'vanguard', 'vstf'].some(group => config.wgUserGroups.includes(group))
  const hasLocalEI = config.wgUserGroups.includes('sysop')
  const isDevWiki = config.wgCityId === '7931' // Dev Wiki shouldn't give a warning
  const canEditOtherUsers = config.wgUserGroups.includes('staff')
  const canEditCurrent = config.wgWikiaPageActions.find(a => a.id === 'page:Edit') !== undefined
  const isJS = config.wgPageName.endsWith('.js')
  const isCSS = config.wgPageName.endsWith('.css')
  let lang = null
  let mode = null // or 'inspect' or 'edit' or 'editwarning'
  // Currently supported:
  // local and global CSS and JS user pages
  // CSS and JS MW pages
  if (config.wgNamespaceNumber === 2) { // User pages
    if (isJS || isCSS) {
      mode = 'inspect'
    }
    if (isJS) {
      lang = 'javascript'
    } else if (isCSS) {
      lang = 'css'
    }
    if (canEditCurrent) { // User page owned (or is Staff)
      if (canEditOtherUsers && !config.wgPageName.match(`:${config.wgUserName}\\/.*\\.(css|js)$`)) { // Is Staff on another user page
        mode = 'editwarning'
      } else { // User page owned
        mode = 'edit'
      }
    }
  } else if (config.wgNamespaceNumber === 8) { // MW pages
    if (isJS || isCSS) {
      mode = 'inspect'
    }
    if (isJS) {
      lang = 'javascript'
    } else if (isCSS) {
      lang = 'css'
    }
    if (canEditCurrent) { // Has local or global editinterface
      if (hasGlobalEI && !hasLocalEI && !isDevWiki) { // Is editing using global editinterface
        mode = 'editwarning'
      } else {
        mode = 'edit'
      }
    }
  }

  if (mode !== null && lang !== null) {
    window.$('.page-header__contribution-buttons .wds-list').prepend(
      window.$('<li>').append(
        window.$('<a>', {
          'text': 'Monaco',
          'href': '#',
          'id': 'FandomMonaco'
        }).click((e) => {
          e.preventDefault()
          window.postMessage({
            type: 'OPEN_EDITOR:P->C',
            data: {
              title: config.wgPageName,
              revid: config.wgCurRevisionId,
              api: window.location.origin + config.wgScriptPath,
              url: encodeURI(window.location.origin + config.wgArticlePath.replace('$1', config.wgPageName)),
              lang: lang,
              mode: mode,
              i18n: config.wgUserLanguage
            }
          }, window.location.origin)
        })
      )
    )
    window.mw.hook('fandommonaco.add').fire()
  }

  window.addEventListener('message', (request) => {
    if (request.source === window && request.data.type && request.data.type === 'MAKE_EDIT:C->P') {
      new window.mw.Api().post({
        action: 'edit',
        title: request.data.data.title,
        text: request.data.data.text,
        summary: request.data.data.summary,
        token: window.mw.user.tokens.get('editToken')
      }).then(() => {
        window.location.reload(true)
      })
    }
  }, false)
})()
