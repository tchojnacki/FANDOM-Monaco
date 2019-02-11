class PIHandler { // eslint-disable-line no-unused-vars
  constructor (monaco) {
    this.monaco = monaco
  }

  getCompletionProvider () {
    return {
      provideCompletionItems: (model, position) => {
        const text = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column })

        const lastOpening = text.lastIndexOf('<')
        let suggestions = []
        if (lastOpening > text.lastIndexOf('>')) { // In a tag
          const regex = /<(\/?)([a-z][a-z0-9]*)[^>]*?(\/?)>/gi
          let outline = []
          let match
          while (match = regex.exec(text)) { // eslint-disable-line no-cond-assign
            const [, mClosingSlash, mTagName, mSelfClosingSlash] = match
            if (mSelfClosingSlash === '') { // Not a self closing tag
              if (mClosingSlash === '') { // Opening tag
                outline.push(mTagName)
              } else { // Closing tag
                if (outline[outline.length - 1] === mTagName) {
                  outline.pop()
                }
              }
            }
          }

          const lastTag = outline[outline.length - 1]

          if (text.lastIndexOf(' ') > lastOpening) { // Attributes
            // TODO
          } else if (text.lastIndexOf('/') > lastOpening) { // Closing tag
            suggestions = [lastTag]
          } else { // Opening tag
            if (outline.length === 0) {
              suggestions = PIHandler.schema.root.children
            } else if (PIHandler.schema.tags[lastTag]) {
              suggestions = PIHandler.schema.tags[lastTag].children
            }
            suggestions = suggestions.filter(s => s.startsWith(text.substring(text.lastIndexOf('<') + 1)))
          }
        }
        return suggestions.map(tag => this.tagToItem(tag))
      }
    }
  }

  tagToItem (tag) {
    return {
      label: tag,
      kind: this.monaco.languages.CompletionItemKind.Field,
      detail: 'tag'
    }
  }
}

PIHandler.schema = {
  root: {
    children: ['infobox']
  },
  tags: {
    infobox: {
      children: ['title', 'image', 'header', 'navigation', 'data', 'group', 'panel']
    },
    title: {
      children: ['default', 'format']
    },
    data: {
      children: ['default', 'label', 'format']
    },
    image: {
      children: ['alt', 'caption', 'default']
    },
    alt: {
      children: ['default']
    },
    caption: {
      children: ['default', 'format']
    },
    group: {
      children: ['data', 'header', 'image', 'title', 'group', 'navigation', 'panel']
    },
    panel: {
      children: ['section']
    },
    section: {
      children: ['label', 'title', 'image', 'header', 'navigation', 'data', 'group']
    }
  }
}
