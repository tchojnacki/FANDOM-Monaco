class PIHandler { // eslint-disable-line no-unused-vars
  constructor (monaco) {
    this.monaco = monaco
  }

  getCompletionProvider () {
    return {
      triggerCharacters: ['<', '/', ' '],
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
            const currentTag = text.substring(lastOpening)
            const tagName = currentTag.substring(1, currentTag.indexOf(' '))
            if (PIHandler.schema.tags[tagName] && PIHandler.schema.tags[tagName].attributes && (currentTag.match(/"/g) || []).length % 2 === 0) {
              suggestions = PIHandler.schema.tags[tagName].attributes.filter(s => s.startsWith(text.substring(text.lastIndexOf(' ') + 1))).map(tag => this.tagToItem(tag, true))
            }
          } else if (text.lastIndexOf('/') > lastOpening) { // Closing tag
            suggestions = [this.tagToItem(lastTag)]
          } else { // Opening tag
            if (outline.length === 0) {
              suggestions = PIHandler.schema.root.children
            } else if (PIHandler.schema.tags[lastTag]) {
              suggestions = PIHandler.schema.tags[lastTag].children
            }
            suggestions = suggestions.filter(s => s.startsWith(text.substring(lastOpening + 1))).map(tag => this.tagToItem(tag))
          }
        }
        return suggestions
      }
    }
  }

  tagToItem (tag, isAttr) {
    return {
      label: tag,
      kind: isAttr ? this.monaco.languages.CompletionItemKind.Property : this.monaco.languages.CompletionItemKind.Field,
      detail: isAttr ? 'attribute' : 'tag'
    }
  }
}

PIHandler.schema = {
  root: {
    children: ['infobox']
  },
  tags: {
    infobox: {
      children: ['title', 'image', 'header', 'navigation', 'data', 'group', 'panel'],
      attributes: ['theme', 'theme-source', 'layout', 'accent-color-source', 'accent-color-text-source', 'accent-color-default', 'accent-color-text-default']
    },
    title: {
      children: ['default', 'format'],
      attributes: ['source']
    },
    data: {
      children: ['default', 'label', 'format'],
      attributes: ['source', 'span', 'layout']
    },
    image: {
      children: ['alt', 'caption', 'default'],
      attributes: ['source']
    },
    alt: {
      children: ['default'],
      attributes: ['source']
    },
    caption: {
      children: ['default', 'format'],
      attributes: ['source']
    },
    group: {
      children: ['data', 'header', 'image', 'title', 'group', 'navigation', 'panel'],
      attributes: ['layout', 'show', 'collapse', 'row-items']
    },
    panel: {
      children: ['section']
    },
    section: {
      children: ['label', 'title', 'image', 'header', 'navigation', 'data', 'group']
    }
  }
}
