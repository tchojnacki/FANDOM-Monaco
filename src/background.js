/* global browser */
window.i18n = {}
window.i18nReady = false

browser.runtime.onMessage.addListener(async (request, sender) => {
  switch (request.type) {
    case 'OPEN_EDITOR:C->B': // Message from content.js
      if (window.editor) {
        try {
          const win = await browser.windows.get(window.editor.id)
          if (win) {
            // Editor is already open
            browser.tabs.sendMessage(sender.tab.id, {
              type: 'DISPLAY_BANNER:B->C', // Message to content.js
              data: {
                text: window.msg('ALREADY_OPEN', request.data.i18n),
                timeout: 2000
              }
            })
            return
          }
        } catch (e) {}
      }
      window.data = request.data
      window.editor = await browser.windows.create({ // Open the editor
        type: 'popup',
        url: browser.extension.getURL('src/editor.html')
      })
      break
    case 'MAKE_EDIT:E->B': // Message from editor.js
      browser.windows.remove(window.editor.id)
      browser.windows.getAll({populate: true, windowTypes: ['normal']}).then((wins) => { // Find all non-popup windows
        const foundTabs = []
        wins.forEach((win) => { // Find a tab
          const tab = win.tabs.find((tab) => window.data.url === tab.url.split(/\?|#/)[0]) // Find an open tab, ignore hash and params
          if (tab) {
            foundTabs.push(tab.id)
          }
        })
        if (foundTabs.length > 0) { // Tab found
          browser.tabs.sendMessage(foundTabs[0], { // Only send the message to one content script
            type: 'MAKE_EDIT:B->C', // Message to content.js
            data: {
              ...request.data,
              title: window.data.title,
              requesterror: window.msg('REQUEST_ERROR', window.data.i18n),
              networkerror: window.msg('NETWORK_ERROR', window.data.i18n)
            }
          })
          browser.tabs.onUpdated.addListener(function listener (tabId, info) { // After editing and reloading
            if (info.status === 'complete' && tabId === foundTabs[0]) { // Wait until the tab is loaded
              browser.tabs.onUpdated.removeListener(listener)
              browser.tabs.sendMessage(foundTabs[0], {
                type: 'DISPLAY_BANNER:B->C',
                data: {
                  text: window.msg('EDIT_SUCCESS', window.data.i18n),
                  type: 'confirm',
                  timeout: 2000
                }
              })
            }
          })
        } else { // Tab got closed, open a new window
          browser.tabs.create({
            url: window.data.url
          }).then(async (newTab) => {
            let alreadyOpened = false
            browser.tabs.onUpdated.addListener(function listener (tabId, info) {
              if (info.status === 'complete' && tabId === newTab.id) { // Wait until the tab is loaded
                if (alreadyOpened) { // Second load
                  browser.tabs.onUpdated.removeListener(listener)
                  browser.tabs.sendMessage(newTab.id, {
                    type: 'DISPLAY_BANNER:B->C', // Message to content.js
                    data: {
                      text: window.msg('EDIT_SUCCESS', window.data.i18n),
                      type: 'confirm',
                      timeout: 2000
                    }
                  })
                } else { // First load
                  alreadyOpened = true
                  browser.tabs.sendMessage(newTab.id, {
                    type: 'MAKE_EDIT:B->C', // Message to content.js
                    data: {
                      ...request.data,
                      title: window.data.title,
                      requesterror: window.msg('REQUEST_ERROR', window.data.i18n),
                      networkerror: window.msg('NETWORK_ERROR', window.data.i18n)
                    }
                  })
                }
              }
            })
          })
        }
      })
      break
    case 'CLOSE_EDITOR:E->B': // Message from editor.js
      browser.windows.remove(window.editor.id)
      break
  }
})

window.msg = (msg, lang) => { // Get i18n message
  if (lang && msg && window.i18nReady && window.i18n[lang] && window.i18n[lang][msg]) {
    return window.i18n[lang][msg]
  }
  if (msg && window.i18nReady && window.i18n.en && window.i18n.en[msg]) {
    return window.i18n.en[msg]
  }
  if (msg) {
    return `[${msg}]`
  }
  return ''
}

async function getTranslations () {
  try {
    // Translations should only load once so the servers aren't spammed
    const response = await window.fetch('https://dev.wikia.com/wiki/MediaWiki:Custom-FANDOM-Monaco/i18n.json?action=raw')
    const text = await response.text()

    // Regex authors: https://dev.wikia.com/wiki/User:Dorumin and https://dev.wikia.com/wiki/User:OneTwoThreeFall
    // Originally created for: https://dev.wikia.com/wiki/MediaWiki:I18n-js/beta.js
    // License: CC BY-SA
    const json = JSON.parse(text.trim().replace(/("(?:\\.|[^"\n\\])+")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m, s) => {
      if (s) {
        return m
      }
      return ''
    }))
    window.i18n = json
    window.i18nReady = true
  } catch (e) {
    console.error('Could not fetch i18n JSON.')
    window.i18n = {}
  }
  return window.i18n
}

getTranslations()
