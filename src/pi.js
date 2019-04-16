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
            if (PIHandler.schema.tags[tagName] && (currentTag.match(/"/g) || []).length % 2 === 0) {
              suggestions = (PIHandler.schema.tags[tagName].attributes || []).filter(s => s.startsWith(text.substring(text.lastIndexOf(' ') + 1))).map(tag => this.tagToItem(tag, true))
            }
          } else if (text.lastIndexOf('/') > lastOpening) { // Closing tag
            suggestions = [this.tagToItem(lastTag)]
          } else { // Opening tag
            if (outline.length === 0) {
              suggestions = PIHandler.schema.root.children
            } else if (PIHandler.schema.tags[lastTag]) {
              suggestions = PIHandler.schema.tags[lastTag].children || []
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
      kind: isAttr ? this.monaco.languages.CompletionItemKind.Field : this.monaco.languages.CompletionItemKind.Class,
      detail: isAttr ? 'attribute' : 'tag',
      documentation: PIHandler.schema.tags[tag] ? (PIHandler.schema.tags[tag].documentation || null) : null
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
      attributes: ['theme', 'theme-source', 'type', 'accent-color-source', 'accent-color-default', 'accent-color-text-source', 'accent-color-text-default', 'layout', 'name'],
      documentation: 'The <infobox> tag holds all others and delimits the scope of the infobox.'
    },
    title: {
      children: ['default', 'format'],
      attributes: ['source', 'name'],
      documentation: 'The <title> tag states infobox title. Images used in <title> tags do not appear on mobile.'
    },
    data: {
      children: ['default', 'label', 'format'],
      attributes: ['source', 'span', 'layout', 'name'],
      documentation: 'The <data> tag is the standard key-value tag.'
    },
    label: {
      documentation: 'The <label> tag can be used only inside other tags. Accepts wikitext.'
    },
    default: {
      documentation: 'The <default> tag text is used when "source" data is not specified, can be used only inside other tags. Accepts wikitext.'
    },
    format: {
      documentation: 'The <format> tag can be used only inside other tags. Accepts wikitext.'
    },
    image: {
      children: ['alt', 'caption', 'default'],
      attributes: ['source', 'name'],
      documentation: 'The <image> tag is used to insert images or video inside an infobox. It can only be styled using the community\'s CSS, and cannot be manually resized. Images are normalized, such that [[File:Example.jpg]] and Example.jpg do the same thing. Multiple images can be passed by using a <gallery> tag.\n\nHere, the default tag is used to specify an image to be used when no image has been chosen on an article. For example, <default>Example.jpg</default>.'
    },
    alt: {
      children: ['default'],
      attributes: ['source'],
      documentation: 'The <alt> tag can be used only inside <image> tag.'
    },
    caption: {
      children: ['default', 'format'],
      attributes: ['source'],
      documentation: 'The <caption> tag can be used only inside <image> tag.'
    },
    group: {
      children: ['data', 'header', 'image', 'title', 'group', 'navigation', 'panel'],
      attributes: ['layout', 'show', 'collapse', 'row-items', 'name'],
      documentation: 'The <data> tag is used for grouping fields, can provide header for each group. A group won\'t be rendered (including any headers) if all fields are empty. However, if the show attribute is set to incomplete, it will render all of the group\'s fields if at least one field is not empty.'
    },
    header: {
      attributes: ['name'],
      documentation: 'The <header> tag denotes the beginning of a section or group of tags.'
    },
    navigation: {
      attributes: ['name'],
      documentation: 'The <navigation> tag is used for providing any wikitext.'
    },
    panel: {
      children: ['header', 'section'],
      attributes: ['name'],
      documentation: 'The <panel> tag is used to create tabbed interfaces, where the contents of each tab is wrapped in a <section> tag.'
    },
    section: {
      children: ['title', 'data', 'label', 'image', 'group', 'header', 'navigation'],
      attributes: ['name'],
      documentation: 'The <section> tag represents the contents of a tab. The clickable toggle is represented by a <label> tag. Labels default to their zero-based index if omitted; if all tabs within a panel are unlabeled, then they are stacked vertically.'
    }
  }
}
