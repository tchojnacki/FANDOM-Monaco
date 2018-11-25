(() => {
  if (window.fandomMonacoLoaded) { // Only load the script once per page
    return
  }
  window.fandomMonacoLoaded = true

  const buttonSuffix = '(M)'
  const config = window.mw.config.get(['wgPageName', 'wgCurRevisionId', 'wgScriptPath', 'wgArticlePath', 'wgCanonicalSpecialPageName', 'wgUserName', 'wgUserLanguage', 'wgNamespaceNumber', 'wgUserGroups', 'wgCityId', 'wgWikiaPageActions'])
  const hasGlobalEI = ['content-volunteer', 'helper', 'util', 'staff', 'vanguard', 'vstf'].some(group => config.wgUserGroups.includes(group))
  const hasLocalEI = config.wgUserGroups.includes('sysop')
  const isDevWiki = config.wgCityId === '7931' // Dev Wiki shouldn't give a warning
  const canEditOtherUsers = config.wgUserGroups.includes('staff')
  const canEditCurrent = config.wgWikiaPageActions.find(a => a.id === 'page:Edit') !== undefined
  const isJS = config.wgPageName.endsWith('.js') || config.wgPageName.endsWith('.javascript')
  const isCSS = config.wgPageName.endsWith('.css')
  const isLESS = config.wgPageName.endsWith('.less')
  const isJSON = config.wgPageName.endsWith('.json')
  const isInfobox = config.wgNamespaceNumber === 10 && window.$('.template-classification-type-text[data-type="infobox"]').length === 1 // A template with "Infobox" type
  const isNPI = config.wgNamespaceNumber === 10 && window.$('.templatedraft-module').length === 1 && window.$('.templatedraft-module [data-id="templatedraft-module-button-approve"]').length === 0 // A template containing "Convert this infobox" module
  let lang = null
  let mode = 'inspect' // or 'edit' or 'editwarning'
  if (isJS) {
    lang = 'javascript'
  } else if (isCSS) {
    lang = 'css'
  } else if (isLESS) {
    lang = 'less'
  } else if (isJSON) {
    lang = 'json'
  } else if (isInfobox && !isNPI) { // Only for Portable Infoboxes
    lang = 'xml'
  }

  if (config.wgNamespaceNumber === 2) { // User pages
    if (canEditCurrent) { // User page owned (or is Staff)
      if (canEditOtherUsers && !config.wgPageName.match(`:${config.wgUserName}\\/.*\\.(js|javascript|css|less|json)$`)) { // Is Staff on another user page
        mode = 'editwarning'
      } else { // User page owned
        mode = 'edit'
      }
    }
  } else if (config.wgNamespaceNumber === 8) { // MW pages
    if (canEditCurrent) { // Has local or global editinterface
      if (hasGlobalEI && !hasLocalEI && !isDevWiki) { // Is editing using global editinterface
        mode = 'editwarning'
      } else {
        mode = 'edit'
      }
    }
  } else if (config.wgNamespaceNumber === 10) { // Templates
    if (canEditCurrent) {
      mode = 'edit'
    }
  }

  if (lang !== null) {
    // Edit button (or View Source button)
    const initialElement = window.$('.page-header__contribution-buttons #ca-edit').length === 1 ? window.$('.page-header__contribution-buttons #ca-edit') : window.$('.page-header__contribution-buttons [href*="action=edit"]')
    if (initialElement.length === 0) {
      return
    }
    const editText = initialElement.find('span').text()
    const targetUrl = window.location.href.split(/\?|#/)[0]
    initialElement.find('span').text(`${editText} ${buttonSuffix}`)
    initialElement.attr('href', '#').click((e) => {
      e.preventDefault()
      window.postMessage({
        type: 'OPEN_EDITOR:P->C', // Message to content.js
        data: {
          title: config.wgPageName,
          revid: config.wgCurRevisionId,
          api: window.location.origin + config.wgScriptPath,
          url: targetUrl,
          lang: lang,
          mode: mode,
          i18n: config.wgUserLanguage
        }
      }, window.location.origin)
      document.activeElement.blur()
    })
    // Keep the original button in a dropdown
    window.$('.page-header__contribution-buttons .wds-list').prepend(
      window.$('<li>').append(
        window.$('<a>', {
          'text': editText,
          'href': `${targetUrl}?action=edit`
        })
      )
    )
    // A hook that can be used by other scripts
    window.mw.hook('fandomMonaco.add').fire()
  }

  // Create infobox draft from the rail module
  if (isNPI) {
    const initialElement = window.$('.templatedraft-module [href$="?action=edit&conversion=1"]')
    if (initialElement.length === 0) {
      return
    }
    const targetUrl = initialElement.attr('href').split(/\?|#/)[0]
    const pageName = config.wgPageName + targetUrl.split(config.wgPageName)[1]
    const targetElement = initialElement.clone().appendTo(initialElement.parent())
    targetElement.find('.templatedraft-module-button').text(`${initialElement.text()} ${buttonSuffix}`)
    targetElement.attr('href', '#').click((e) => {
      e.preventDefault()
      window.postMessage({
        type: 'OPEN_EDITOR:P->C', // Message to content.js
        data: {
          title: pageName,
          revid: -1, // Newest revision
          api: window.location.origin + config.wgScriptPath,
          url: targetUrl,
          lang: 'xml',
          mode: 'edit',
          i18n: config.wgUserLanguage
        }
      }, window.location.origin)
      document.activeElement.blur()
    })
  }

  // Create infobox draft in Special:Insights
  if (config.wgCanonicalSpecialPageName === 'Insights' && window.$('.insights-list[data-type="nonportableinfoboxes"]').length === 1) {
    window.$('.insights-list[data-type="nonportableinfoboxes"] a[href$="action=edit&conversion=1"]').each((_i, elem) => {
      const el = window.$(elem)
      const targetUrl = el.attr('href').split(/\?|#/)[0]
      const pageName = targetUrl.match(/^.*\/(.*?):(.*)$/)[1] + ':' + targetUrl.match(/^.*\/(.*?):(.*)$/)[2]
      el.clone().appendTo(el.parent()).text(buttonSuffix).click((e) => {
        e.preventDefault()
        window.postMessage({
          type: 'OPEN_EDITOR:P->C', // Message to content.js
          data: {
            title: pageName,
            revid: -1,
            api: window.location.origin + config.wgScriptPath,
            url: targetUrl,
            lang: 'xml',
            mode: 'edit',
            i18n: config.wgUserLanguage
          }
        }, window.location.origin)
        document.activeElement.blur()
      })
    })
  }

  window.addEventListener('message', (request) => { // Message from content.js
    if (request.source === window && request.data.type) {
      switch (request.data.type) {
        case 'MAKE_EDIT:C->P':
          new window.mw.Api().post({
            action: 'edit',
            title: request.data.data.title,
            text: request.data.data.text,
            summary: request.data.data.summary,
            token: window.mw.user.tokens.get('editToken')
          }).done((data) => {
            if (data && data.edit && data.edit.result && data.edit.result === 'Success') {
              window.location.reload()
            } else {
              new window.BannerNotification(request.data.data.requesterror || '[REQUEST_ERROR]', 'error').show()
            }
          }).fail(() => {
            new window.BannerNotification(request.data.data.networkerror || '[NETWORK_ERROR]', 'error').show()
          })
          break
        case 'DISPLAY_BANNER:C->P':
          new window.BannerNotification(request.data.data.text || '', request.data.data.type || undefined, undefined, request.data.data.timeout || undefined).show()
          break
      }
    }
  }, false)
})()
