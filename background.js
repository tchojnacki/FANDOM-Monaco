/* global browser */
browser.runtime.onMessage.addListener(async (request) => {
  switch (request.type) {
    case 'open_editor':
      if (window.editor) {
        try {
          const win = await browser.windows.get(window.editor.id)
          if (win) {
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
    case 'make_edit':
      browser.windows.remove(window.editor.id)
      browser.windows.getAll({populate: true, windowTypes: ['normal']}, (wins) => {
        const foundTabs = []
        wins.forEach((win) => {
          const tab = win.tabs.find((tab) => window.data.url.startsWith(tab.url))
          if (tab) {
            foundTabs.push(tab.id)
          }
        })
        if (foundTabs.length > 0) {
          browser.tabs.sendMessage(foundTabs[0], {
            type: 'make_edit',
            data: {
              text: request.data.text,
              summary: request.data.summary,
              title: window.data.title
            }
          })
        } else { // Tab got closed
          browser.tabs.create({
            url: window.data.url
          }, async (newTab) => {
            browser.tabs.onUpdated.addListener(function listener (tabId, info) {
              if (info.status === 'complete' && tabId === newTab.id) {
                browser.tabs.onUpdated.removeListener(listener)
                browser.tabs.sendMessage(newTab.id, {
                  type: 'make_edit',
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
    case 'close_editor':
      browser.windows.remove(window.editor.id)
      break
  }
})
