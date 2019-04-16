class PIHandler { // eslint-disable-line no-unused-vars
  constructor (monaco) {
    this.monaco = monaco
  }

  getCompletionProvider () {
    return {
      triggerCharacters: ['<', '/', ' ', '"'],
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
            if (PIHandler.schema.tags[tagName]) { // Known tag
              if ((currentTag.match(/"/g) || []).length % 2 === 0) { // Outside of double quotes
                const currentAttr = currentTag.substring(currentTag.lastIndexOf(' ') + 1)
                suggestions = (PIHandler.schema.tags[tagName].attributes || []).map(attr => attr.name).filter(s => s.startsWith(currentAttr)).map(attr => this.tagToItem(tagName, attr))
              } else if (PIHandler.schema.tags[tagName].attributes.length > 0) { // Inside of double quotes and tag has attributes
                const beforeQuote = currentTag.substring(0, currentTag.lastIndexOf('='))
                const currentAttr = beforeQuote.substring(beforeQuote.lastIndexOf(' ') + 1)
                const attrData = PIHandler.schema.tags[tagName].attributes.find(attr => attr.name === currentAttr)
                const currentVal = currentTag.substring(currentTag.lastIndexOf('"') + 1)
                if (attrData && attrData.values) { // Known attribute that has "values" property
                  suggestions = attrData.values.filter(val => val.startsWith(currentVal)).map(val => ({
                    label: val,
                    kind: this.monaco.languages.CompletionItemKind.EnumMember,
                    detail: 'value'
                  }))
                }
              }
            }
          } else if (text.lastIndexOf('/') > lastOpening) { // Closing tag
            if (outline.length !== 0) {
              suggestions = [this.tagToItem(lastTag)]
            }
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

  tagToItem (tag, attr) {
    const isAttr = attr !== undefined
    return {
      label: isAttr ? attr : tag,
      kind: isAttr ? this.monaco.languages.CompletionItemKind.Field : this.monaco.languages.CompletionItemKind.Class,
      detail: isAttr ? 'attribute' : 'tag',
      documentation: isAttr ? PIHandler.schema.tags[tag].attributes.find(a => a.name === attr).documentation : (PIHandler.schema.tags[tag] ? PIHandler.schema.tags[tag].documentation : null)
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
      attributes: [{
        name: 'theme',
        documentation: 'The name of the theme to apply. Adds a class to the infobox of the form .pi-theme-$1, with spaces transformed into hyphens (-). Does not overwrite theme-source or type.'
      }, {
        name: 'theme-source',
        documentation: 'The name of the parameter to use as a theme. Adds a class to the infobox of the form .pi-theme-$1, with spaces transformed into hyphens (-). Does not overwrite theme or type.'
      }, {
        name: 'type',
        documentation: 'The name of the type to apply. Adds a class to the infobox of the form .type-$1, with spaces transformed into hyphens (-). Does not overwrite theme or theme-source.'
      }, {
        name: 'accent-color-source',
        documentation: 'The name of the parameter to use as an accent color.'
      }, {
        name: 'accent-color-default',
        documentation: 'The default accent color. Accepts a 3- or 6-digit hexadecimal color code, e.g. #f00 or #ff0000.'
      }, {
        name: 'accent-color-text-source',
        documentation: 'The name of the parameter to use as a text accent color.'
      }, {
        name: 'accent-color-text-default',
        documentation: 'The default text accent color. Accepts a 3- or 6-digit hexadecimal color code, e.g. #f00 or #ff0000.'
      }, {
        name: 'layout',
        documentation: 'Possible values: default, stacked.',
        values: ['default', 'stacked']
      }, {
        name: 'name',
        documentation: 'Internal name for the element and its children. Assigned to the data-item-name attribute in the resulting HTML.'
      }],
      documentation: 'The <infobox> tag holds all others and delimits the scope of the infobox.'
    },
    title: {
      children: ['default', 'format'],
      attributes: [{
        name: 'source',
        documentation: 'The name of the parameter to use.'
      }, {
        name: 'name',
        documentation: 'Internal name for the element and its children. Assigned to the data-item-name attribute in the resulting HTML.'
      }],
      documentation: 'The <title> tag states infobox title. Images used in <title> tags do not appear on mobile.'
    },
    data: {
      children: ['default', 'label', 'format'],
      attributes: [{
        name: 'source',
        documentation: 'The name of the parameter to use.'
      }, {
        name: 'span',
        documentation: 'The number of columns to span. Only available in smart groups.'
      }, {
        name: 'layout',
        documentation: 'Possible values: default. Only available in smart groups.',
        values: ['default']
      }, {
        name: 'name',
        documentation: 'Internal name for the element and its children. Assigned to the data-item-name attribute in the resulting HTML.'
      }],
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
      attributes: [{
        name: 'source',
        documentation: 'The name of the parameter to use.'
      }, {
        name: 'name',
        documentation: 'Internal name for the element and its children. Assigned to the data-item-name attribute in the resulting HTML.'
      }],
      documentation: 'The <image> tag is used to insert images or video inside an infobox. It can only be styled using the community\'s CSS, and cannot be manually resized. Images are normalized, such that [[File:Example.jpg]] and Example.jpg do the same thing. Multiple images can be passed by using a <gallery> tag.\n\nHere, the default tag is used to specify an image to be used when no image has been chosen on an article. For example, <default>Example.jpg</default>.'
    },
    alt: {
      children: ['default'],
      attributes: [{
        name: 'source',
        documentation: 'The name of the parameter to use.'
      }],
      documentation: 'The <alt> tag can be used only inside <image> tag.'
    },
    caption: {
      children: ['default', 'format'],
      attributes: [{
        name: 'source',
        documentation: 'The name of the parameter to use.'
      }],
      documentation: 'The <caption> tag can be used only inside <image> tag.'
    },
    group: {
      children: ['data', 'header', 'image', 'title', 'group', 'navigation', 'panel'],
      attributes: [{
        name: 'layout',
        documentation: 'Possible values: default, horizontal.',
        values: ['default', 'horizontal']
      }, {
        name: 'show',
        documentation: 'Possible values: default, incomplete.',
        values: ['default', 'incomplete']
      }, {
        name: 'collapse',
        documentation: 'Possible values: open, closed. Only available if the group\'s first child is a <header> tag.',
        values: ['open', 'closed']
      }, {
        name: 'row-items',
        documentation: 'Turns the group into a smart group spanning n columns. Smart groups arrange their cells (<data> tags) horizontally, and automatically wrap to a new row once the current one exceeds that limit. Cells are stretched to take up as much space as possible on the last row.'
      }, {
        name: 'name',
        documentation: 'Internal name for the element and its children. Assigned to the data-item-name attribute in the resulting HTML.'
      }],
      documentation: 'The <data> tag is used for grouping fields, can provide header for each group. A group won\'t be rendered (including any headers) if all fields are empty. However, if the show attribute is set to incomplete, it will render all of the group\'s fields if at least one field is not empty.'
    },
    header: {
      attributes: [{
        name: 'name',
        documentation: 'Internal name for the element and its children. Assigned to the data-item-name attribute in the resulting HTML.'
      }],
      documentation: 'The <header> tag denotes the beginning of a section or group of tags.'
    },
    navigation: {
      attributes: [{
        name: 'name',
        documentation: 'Internal name for the element and its children. Assigned to the data-item-name attribute in the resulting HTML.'
      }],
      documentation: 'The <navigation> tag is used for providing any wikitext.'
    },
    panel: {
      children: ['header', 'section'],
      attributes: [{
        name: 'name',
        documentation: 'Internal name for the element and its children. Assigned to the data-item-name attribute in the resulting HTML.'
      }],
      documentation: 'The <panel> tag is used to create tabbed interfaces, where the contents of each tab is wrapped in a <section> tag.'
    },
    section: {
      children: ['title', 'data', 'label', 'image', 'group', 'header', 'navigation'],
      attributes: [{
        name: 'name',
        documentation: 'Internal name for the element and its children. Assigned to the data-item-name attribute in the resulting HTML.'
      }],
      documentation: 'The <section> tag represents the contents of a tab. The clickable toggle is represented by a <label> tag. Labels default to their zero-based index if omitted; if all tabs within a panel are unlabeled, then they are stacked vertically.'
    }
  }
}
