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
        url: browser.extension.getURL('editor.html'),
        width: 800,
        height: 600
      })
      break
    case 'make_edit':
      browser.windows.remove(window.editor.id)
      browser.windows.getAll({populate: true, windowTypes: ['normal']}, (windows) => {
        browser.tabs.sendMessage(windows[0].tabs.find((tab) => window.data.url.startsWith(tab.url)).id, {
          type: 'make_edit',
          data: {
            text: request.data.text,
            summary: request.data.summary,
            title: window.data.title
          }
        })
      })
      break
    case 'close_editor':
      browser.windows.remove(window.editor.id)
      break
  }
})
