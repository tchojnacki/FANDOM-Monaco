/* global monaco, browser, JSHINT */

class FMEditor {
  constructor () {
    this.editorVisible = true
    FMEditor.instance = this
  }

  async init () {
    await this.getBackgroundData() // Now this.bgData exists
    this.setDocumentUp()
    this.previousContent = await this.getPageContent()
    await this.setEditorsUp() // Now this.editor exists (and sometimes this.diffEditor)
    this.hideSpinner()
    this.createHandlers()
    return this
  }

  async getBackgroundData () {
    this.bgData = (await browser.runtime.getBackgroundPage()).data
  }

  async getPageContent () {
    const response = await window.fetch(`${this.bgData.api}/api.php?action=query&titles=${this.bgData.title}&prop=revisions&rvprop=content&format=json&cb=${Math.floor(new Date().getTime() / 1000)}`, {
      cache: 'no-store' // The CacheBuster might be heavy on the servers but we NEED the most recent version if we want to edit.
    })
    const json = await response.json()
    const content = json.query.pages[Object.keys(json.query.pages)[0]].revisions ? json.query.pages[Object.keys(json.query.pages)[0]].revisions[0]['*'] : ''
    return content
  }

  setDocumentUp () {
    document.getElementById('pagename').textContent = this.bgData.title
    document.getElementById('pagename').setAttribute('href', this.bgData.url)
    if (this.bgData.mode !== 'inspect') {
      document.getElementById('diff').style.display = 'block'
      document.getElementById('summary').style.display = 'inline-block'
      document.getElementById('diff-container').style.display = 'block'
    }
  }

  async setEditorsUp () {
    if (this.bgData.lang === 'javascript') {
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        (await (await window.fetch('./lib.d.ts')).text()),
        'lib.d.ts'
      )
    }
    this.editor = monaco.editor.create(document.getElementById('editor-container'), {
      value: this.previousContent,
      language: this.bgData.lang,
      theme: 'vs-dark',
      readOnly: true
    })
    if (this.bgData.lang === 'javascript' && this.bgData.mode !== 'inspect') {
      this.lint()
      this.diffEditor = monaco.editor.createDiffEditor(document.getElementById('diff-container'))
    }
    if (this.bgData.mode !== 'inspect') {
      this.editor.updateOptions({ readOnly: false })
    }
  }

  lint () {
    JSHINT.jshint(this.editor.getValue(), {
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
      '-W117': true, // No undef - Wikia's got a lot of weird global variables
      unused: true,
      asi: true,
      eqnull: true
    })
    monaco.editor.setModelMarkers(this.editor.getModel(), 'jshint', (JSHINT.jshint.data().errors || []).map((e) => {
      return {
        startLineNumber: e.line,
        startColumn: e.character,
        endLineNumber: e.line,
        endColumn: e.character,
        message: e.reason,
        severity: e.code.startsWith('E') ? monaco.Severity.Error : monaco.Severity.Warning
      }
    }))
  }

  hideSpinner () {
    document.getElementsByClassName('overlay')[0].classList.add('invisible')
    setTimeout(() => {
      document.getElementsByClassName('spinner')[0].classList.add('hidden')
      document.getElementsByClassName('dialog')[0].classList.remove('hidden')
    }, 500)
  }

  showDialog (title, content, actions) {
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

  createHandlers () {
    window.addEventListener('resize', () => {
      this.editor.layout()
      if (this.bgData.mode !== 'inspect') {
        this.diffEditor.layout()
      }
    })

    if (this.bgData.mode !== 'inspect') {
      this.editor.model.onDidChangeContent((event) => {
        if (this.editor.getValue() !== this.previousContent) {
          document.getElementById('publish').textContent = this.previousContent === '' ? 'Publikuj' : 'Zapisz'
        } else {
          document.getElementById('publish').textContent = 'Zamknij'
        }
        if (this.bgData.lang === 'javascript') {
          this.lint()
        }
      })

      document.getElementById('diff').addEventListener('click', async () => {
        if (this.editorVisible) {
          this.editorVisible = false
          document.getElementById('editor-container').style.setProperty('flex', '0')
          document.getElementById('diff-container').style.setProperty('flex', '1')
          document.getElementById('diff').textContent = 'Edytuj'

          const originalModel = monaco.editor.createModel(this.previousContent, `text/${this.bgData.lang}`)
          const modifiedModel = monaco.editor.createModel(this.editor.getValue(), `text/${this.bgData.lang}`)

          this.diffEditor.setModel({
            original: originalModel,
            modified: modifiedModel
          })
        } else {
          this.editorVisible = true
          document.getElementById('editor-container').style.setProperty('flex', '1')
          document.getElementById('diff-container').style.setProperty('flex', '0')
          document.getElementById('diff').textContent = 'Różnica'
        }
        this.editor.layout()
        this.diffEditor.layout()
      })
    }

    document.getElementById('publish').addEventListener('click', async () => {
      if (this.editor.getValue() !== this.previousContent && this.bgData.mode !== 'inspect') {
        if (this.bgData.mode === 'editwarning') {
          const dialog = await this.showDialog(
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
          type: 'MAKE_EDIT:E->B',
          data: {
            text: this.editor.getValue(),
            summary: document.getElementById('summary').value
          }
        })
      } else {
        browser.runtime.sendMessage({
          type: 'CLOSE_EDITOR:E->B'
        })
      }
    })
  }
}

require(['vs/editor/editor.main'], async () => {
  await new FMEditor().init()
})
