import dedent from "dedent";
import { type App, PluginSettingTab, Setting, sanitizeHTMLToDom } from "obsidian";
import HtmlNotice from "./htmlNotice";
import type { PasswordForWeb } from "./interfaces";
import type PasswordforWebBrowsing from "./main";
import InputPassword from "./modal";

export class PasswordforWebBrowsingSettingTab extends PluginSettingTab {
	plugin: PasswordforWebBrowsing;
	settings: PasswordForWeb;
	allowChangePassword: boolean = false;
	constructor(app: App, plugin: PasswordforWebBrowsing) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = plugin.settings;
	}

	changePassword(setting: Setting, firstRun: boolean = false): void {
		let password = "";
		let confirmPassword = "";
		setting
			.addText((text) => {
				text.setPlaceholder("Your password").onChange(async (value) => {
					if (value.trim().length === 0) {
						HtmlNotice("<span class='pin error'>Password cannot be empty</span>");
						return;
					}
					password = value;
				});
				text.inputEl.type = "password";
			})
			.addText((text) => {
				text.setPlaceholder("Confirm your password").onChange(async (value) => {
					if (value.trim().length === 0) {
						HtmlNotice("<span class='pin error'>Password cannot be empty</span>");
						return;
					}
					confirmPassword = value;
				});
				text.inputEl.type = "password";
			})
			.addButton((button) => {
				button
					.setButtonText("Submit")
					.setCta()
					.onClick(async () => {
						if (password !== confirmPassword) {
							HtmlNotice("<span class='pin error'>The passwords don't match</span>");
							return;
						}
						if (!password || password.trim().length === 0) {
							HtmlNotice("<span class='pin error'>Password cannot be empty</span>");
							return;
						} else HtmlNotice("<span class='pin success'>Password saved</span>");
						await this.plugin.encryptAndStorePassword(password);
						if (firstRun) {
							this.settings.firstRun = false;
							await this.plugin.saveSettings();
						}

						this.display();
					});
			});
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		const desc = dedent(`This plugin allows to open a modal that will ask for a password when you try to enable the new core plugin "Web Browsing".<br>To prevent the password from being stored in plain text, it is encrypted using the AES-GCM algorithm.<br>
		
		<div data-callout-metadata="" data-callout-fold="" data-callout="warning" class="callout"><div class="callout-title" dir="auto"><div class="callout-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg></div><div class="callout-title-inner">Warning</div></div><div class="callout-content">
		<p dir="auto">If you forgot your password, please send an email to <a href="mailto:support@mara-li.fr" target="_blank" rel="noopener nofollow">the support.</a><br>
		The email should have the header : <code>[PASSWORD] Password lost</code>.<br>
		<strong>Uninstalling the plugin won't remove the password !</strong></p>
		</div></div>
	
`);
		containerEl.addClass("password-for-web-browsing");
		containerEl.appendChild(sanitizeHTMLToDom(desc));

		if (this.settings.firstRun) {
			const firstRun = new Setting(containerEl)
				.setName("First run")
				.setDesc(
					sanitizeHTMLToDom(
						"This is the first time you run this plugin.<br>Please configure your password. You will need it for changing afterward."
					)
				)
				.setHeading();
			this.changePassword(firstRun, true);
		} else {
			new Setting(containerEl).addButton((button) => {
				button
					.setButtonText("Change password")
					.setClass("change-password")
					.setWarning()
					.onClick(async () => {
						const oldPassword = await this.plugin.decryptPassword();
						if (!oldPassword) {
							HtmlNotice("<span class='pin error'>Password not found</span>");
							return;
						}
						new InputPassword(this.app, async (password) => {
							if (password.trim().length === 0) {
								HtmlNotice("<span class='pin error'>Password cannot be empty</span>");
								return;
							}
							if (oldPassword !== password) {
								HtmlNotice("<span class='pin error'>The password doesn't match.</span>");

								return;
							} else {
								this.allowChangePassword = true;
								this.display();
							}
						}).open();
					});
			});
			if (this.allowChangePassword) {
				const changePassword = new Setting(containerEl);
				this.changePassword(changePassword);
				this.display();
			}
		}
	}
}
