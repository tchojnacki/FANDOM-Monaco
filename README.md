# FANDOM-Monaco
## ⚠️ DEPRECATED ⚠️
### Deprecation notice
This extension is no longer actively supported or maintained. You may or may not be able to get it to work in the current state. You are free to [fork](https://github.com/tchojnacki/FANDOM-Monaco/fork) the extension if you would like to work on it further. The original README of the project is available below.

### Why?
The main reason for deprecation is that I am no longer an active user of the extension, however there are numerous other reasons, namely:
- the [UCP update](https://community.fandom.com/wiki/Help:Unified_Community_Platform#The_Editor) broke the extension and it would have to be rewritten to support it
- the crowdfunded internationalization strings have gotten lost due to removal from the [Fandom Developers Wiki](https://dev.fandom.com/wiki/Fandom_Developers_Wiki)
- [Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/) has been introduced and is aimed at replacing Manifest V2 (with which this extension was developed), meaning another rewrite would be required
- the built-in editor became better over the years and I personally feel like you no longer have to replace it with a custom solution

## About
A browser add-on that lets you replace Fandom's default [Ace Editor](https://ace.c9.io/) with [Monaco Editor](https://microsoft.github.io/monaco-editor/).

## Supported browsers
* Officially supported:
  * Mozilla Firefox (Developer, Nightly or ESR for permanent installation)
  * Google Chrome
* Unofficially supported (these aren't tested although they might work):
  * Microsoft Edge
  * Opera

## Installation
* Mozilla Firefox:
  * Temporary installation:
    1. Download the zip file from the [latest release page](https://github.com/tmkch/FANDOM-Monaco/releases/latest) and unpack it.
    2. Visit `about:debugging`.
    3. Open _Load Temporary Add-on_.
    4. Select the unpacked extension.
  * Permanent installation:
    1. Make sure you are using Developer, Nightly or ESR version of Firefox.
    2. Toggle the `xpinstall.signatures.required` preference in `about:config`.
    3. Install the xpi file from the [latest release page](https://github.com/tmkch/FANDOM-Monaco/releases/latest).
* Google Chrome:
  1. Download the zip file from the [latest release page](https://github.com/tmkch/FANDOM-Monaco/releases/latest) and unpack it.
  2. Visit `chrome://extensions`.
  3. Enable _Developer Mode_ in the top right corner.
  4. Click _Load unpacked_.
  5. Select the unpacked extension.

## Usage
Press the _Edit (M)_ button to open the editor.

By using the extension you allow it to make edits using your Fandom account.

## Legal info
Text content from accessed through the extension is available under the [Creative Commons Attribution-Share Alike License](http://www.wikia.com/Licensing). FANDOM-Monaco isn't endorsed by Fandom, Inc. and doesn't reflect the views or opinions of the company. See also: [License](LICENSE.md), [Third party notices](THIRD-PARTY-NOTICES.md).
