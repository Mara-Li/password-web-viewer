# Password for Web Browsing

This plugin was created following a discussion on the [Obsidian.md forum](https://forum.obsidian.md/t/restriction-option-for-the-web-viewer-plugin/95810/2). I think it's important that parent can control the access to the web browser for their children. This plugin is a first step to add a password to the web browser.

> [!warning]
> If the plugin is disabled, the web browser will be accessible. It is more a proof-of-concept than a real security feature.

## Usage
### 🚀 Quick start
First, go into the settings of the plugin and set a password.
The passwords will be saved encrypted into your configuration folder (`.obsidian`) by default.

Then, go into the core plugin and enable the web browser. You will be prompt to enter the password.

### Reset the password

You need to go into the settings of the plugin and set a new password. When clicking on `change password`, you will be prompt to enter the old password. Then, you can set a new password.

> [!warning]
> This plugin doesn't store the data in `data.json`. Uninstalling the plugin **doesn't** reset the password.
> If you forgot the password, please contact the author via <a href="mailto:support@mara-li.fr">support@mara-li.fr</a> with the subject `[PASSWORD] Password lost`.


## 📥 Installation

- [ ] From Obsidian's community plugins
- [x] Using BRAT with `https://github.com/Mara-Li/`
- [x] From the release page: 
    - Download the latest release
    - Unzip `pin-web-browser.zip` in `.obsidian/plugins/` path
    - In Obsidian settings, reload the plugin
    - Enable the plugin


### 🎼 Languages

- [x] English
- [ ] French

To add a translation:
1. Fork the repository
2. Add the translation in the `src/i18n/locales` folder with the name of the language (ex: `fr.json`). 
    - You can get your locale language from Obsidian using [obsidian translation](https://github.com/obsidianmd/obsidian-translations) or using the commands (in templater for example) : `<% tp.obsidian.moment.locale() %>`
    - Copy the content of the [`en.json`](./src/i18n/locales/en.json) file in the new file
    - Translate the content
3. Edit `i18n/i18next.ts` :
    - Add `import * as <lang> from "./locales/<lang>.json";`
    - Edit the `ressource` part with adding : `<lang> : {translation: <lang>}`

