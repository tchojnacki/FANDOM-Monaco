/* global browser */
browser.runtime.onMessage.addListener(async (request) => {
  switch (request.type) {
    case 'OPEN_EDITOR:C->B':
      if (window.editor) {
        try {
          const win = await browser.windows.get(window.editor.id)
          if (win) {
            // Editor is already open
            return
          }
        } catch (e) {}
      }
      window.data = request.data
      window.editor = await browser.windows.create({
        type: 'popup',
        url: browser.extension.getURL('editor.html')
      })
      break
    case 'MAKE_EDIT:E->B':
      browser.windows.remove(window.editor.id)
      browser.windows.getAll({populate: true, windowTypes: ['normal']}, (wins) => { // Find all non-popup windows
        const foundTabs = []
        wins.forEach((win) => { // Find a tab
          const tab = win.tabs.find((tab) => window.data.url === tab.url.split(/\?|#/)[0]) // Find an open tab, ignore hash and params
          if (tab) {
            foundTabs.push(tab.id)
          }
        })
        if (foundTabs.length > 0) {
          browser.tabs.sendMessage(foundTabs[0], { // Only send the message to one content script
            type: 'MAKE_EDIT:B->C',
            data: {
              text: request.data.text,
              summary: request.data.summary,
              title: window.data.title
            }
          })
        } else { // Tab got closed, open a new window
          browser.tabs.create({
            url: window.data.url
          }, async (newTab) => {
            browser.tabs.onUpdated.addListener(function listener (tabId, info) {
              if (info.status === 'complete' && tabId === newTab.id) { // Wait until the tab is loaded
                browser.tabs.onUpdated.removeListener(listener)
                browser.tabs.sendMessage(newTab.id, {
                  type: 'MAKE_EDIT:B->C',
                  data: {
                    text: request.data.text,
                    summary: request.data.summary,
                    title: window.data.title
                  }
                })
              }
            })
          })
        }
      })
      break
    case 'CLOSE_EDITOR:E->B':
      browser.windows.remove(window.editor.id)
      break
  }
})
