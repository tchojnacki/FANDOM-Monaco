/* global monaco, browser, JSHINT */
require(['vs/editor/editor.main'], async () => {
  async function getBackgroundData () {
    return (await browser.runtime.getBackgroundPage()).data
  }

  async function getPageContent () {
    const data = await getBackgroundData()
    const response = await window.fetch(`${data.api}/api.php?action=query&titles=${data.title}&prop=revisions&rvprop=content&format=json&cb=${Math.floor(new Date().getTime() / 1000)}`, {
      cache: 'no-store' /* The CacheBuster might be heavy on the servers but we NEED the most recent version if we want to edit. */
    })
    const json = await response.json()
    const content = json.query.pages[Object.keys(json.query.pages)[0]].revisions ? json.query.pages[Object.keys(json.query.pages)[0]].revisions[0]['*'] : ''
    return content
  }

  function hideSpinner () {
    document.getElementsByClassName('overlay')[0].classList.add('invisible')
    setTimeout(() => {
      document.getElementsByClassName('spinner')[0].classList.add('hidden')
      document.getElementsByClassName('dialog')[0].classList.remove('hidden')
    }, 500)
  }

  function showDialog (title, content, actions) {
    return new Promise((resolve) => {
      const overlay = document.getElementsByClassName('overlay')[0]
      const dialog = document.getElementsByClassName('dialog')[0]
      const dialogActions = dialog.querySelector('.dialog-actions')
      dialog.querySelector('.dialog-title').textContent = title
      dialog.querySelector('.dialog-content').textContent = content
      overlay.classList.remove('invisible')

      dialogActions.innerHTML = ''
      actions.forEach((a) => {
        const button = document.createElement('div')
        button.classList.add('dialog-button')
        button.textContent = a.text
        button.addEventListener('click', () => {
          resolve(a.action)
          overlay.classList.add('invisible')
        })
        dialogActions.appendChild(button)
      })
    })
  }

  window.editorVisible = true
  const { title, url, lang, mode } = await getBackgroundData()
  document.title = title
  document.getElementById('pagename').textContent = title
  document.getElementById('pagename').setAttribute('href', url)
  if (mode !== 'inspect') {
    document.getElementById('diff').style.display = 'block'
    document.getElementById('summary').style.display = 'inline-block'
    document.getElementById('diff-container').style.display = 'block'
  }
  window.previousContent = await getPageContent()

  if (lang === 'javascript') {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      (await (await window.fetch('./lib.d.ts')).text()),
      'lib.d.ts'
    )
  }

  window.editor = monaco.editor.create(document.getElementById('editor-container'), {
    value: window.previousContent,
    language: lang,
    theme: 'vs-dark',
    readOnly: true
  })

  if (lang === 'javascript') {
    window.jshintConfig = {
      esversion: 5,
      curly: true,
      eqeqeq: true,
      freeze: true,
      futurehostile: true,
      latedef: true,
      nocomma: true,
      nonbsp: true,
      shadow: false,
      strict: 'implied',
      '-W117': true, /* No undef - Wikia's got a lot of weird global variables */
      unused: true,
      asi: true,
      eqnull: true
    }
    window.jshintMap = (e) => {
      return {
        startLineNumber: e.line,
        startColumn: e.character,
        endLineNumber: e.line,
        endColumn: e.character,
        message: e.reason,
        severity: e.code.startsWith('E') ? monaco.Severity.Error : monaco.Severity.Warning
      }
    }
    JSHINT.jshint(window.editor.getValue(), window.jshintConfig)
    monaco.editor.setModelMarkers(window.editor.getModel(), 'jshint', (JSHINT.jshint.data().errors || []).map(window.jshintMap))
  }

  hideSpinner()

  if (mode !== 'inspect') {
    window.editor.model.onDidChangeContent((event) => {
      if (window.editor.getValue() !== window.previousContent) {
        document.getElementById('publish').textContent = window.previousContent === '' ? 'Publikuj' : 'Zapisz'
      } else {
        document.getElementById('publish').textContent = 'Zamknij'
      }
      if (lang === 'javascript') {
        JSHINT.jshint(window.editor.getValue(), window.jshintConfig)
        monaco.editor.setModelMarkers(window.editor.getModel(), 'jshint', (JSHINT.jshint.data().errors || []).map(window.jshintMap))
      }
    })

    window.diffEditor = monaco.editor.createDiffEditor(document.getElementById('diff-container'))

    window.editor.updateOptions({ readOnly: false })
  }

  window.addEventListener('resize', () => {
    window.editor.layout()
    if (mode !== 'inspect') {
      window.diffEditor.layout()
    }
  })

  if (mode !== 'inspect') {
    document.getElementById('diff').addEventListener('click', async () => {
      if (window.editorVisible) {
        window.editorVisible = false
        document.getElementById('editor-container').style.setProperty('flex', '0')
        document.getElementById('diff-container').style.setProperty('flex', '1')
        document.getElementById('diff').textContent = 'Edytuj'

        const originalModel = monaco.editor.createModel(window.previousContent, `text/${lang}`)
        const modifiedModel = monaco.editor.createModel(window.editor.getValue(), `text/${lang}`)

        window.diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel
        })
      } else {
        window.editorVisible = true
        document.getElementById('editor-container').style.setProperty('flex', '1')
        document.getElementById('diff-container').style.setProperty('flex', '0')
        document.getElementById('diff').textContent = 'Różnica'
      }
      window.editor.layout()
      window.diffEditor.layout()
    })
  }

  document.getElementById('publish').addEventListener('click', async () => {
    if (window.editor.getValue() !== window.previousContent && mode !== 'inspect') {
      if (mode === 'editwarning') {
        const dialog = await showDialog(
          'Nie jesteś administratorem',
          'Edytujesz ten plik jedynie na mocy swoich uprawnień globalnych. Upewnij się, że masz zgodę lokalnej społeczności na dokonanie zmian.',
          [{
            action: 'CANCEL',
            text: 'Anuluj'
          }, {
            action: 'PUBLISH',
            text: 'Publikuj'
          }]
        )
        if (dialog !== 'PUBLISH') {
          return
        }
      }
      // TODO: Check for edit conflicts
      browser.runtime.sendMessage({
        type: 'make_edit',
        data: {
          text: window.editor.getValue(),
          summary: document.getElementById('summary').value
        }
      })
    } else {
      browser.runtime.sendMessage({
        type: 'close_editor'
      })
    }
  })
})
