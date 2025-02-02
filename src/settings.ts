import dedent from "dedent";
import i18next from "i18next";
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
				text.setPlaceholder(i18next.t("password")).onChange(async (value) => {
					if (value.trim().length === 0) {
						HtmlNotice(`<span class='pin error'>${i18next.t("error.empty")}</span>`);
						return;
					}
					password = value;
				});
				text.inputEl.type = "password";
			})
			.addText((text) => {
				text.setPlaceholder(i18next.t("confirm")).onChange(async (value) => {
					if (value.trim().length === 0) {
						HtmlNotice(`<span class='pin error'>${i18next.t("error.empty")}</span>`);
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
							HtmlNotice(`<span class='pin error'>${i18next.t("error.match")}</span>`);
							return;
						}
						if (!password || password.trim().length === 0) {
							HtmlNotice(`<span class='pin error'>${i18next.t("error.empty")}</span>`);
							return;
						} else HtmlNotice(`<span class='pin success'>${i18next.t("success")}</span>`);
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

		const desc =
			dedent(`${i18next.t("desc.explanation")}<br>${i18next.t("desc.encryption")}<br>
		
		<div data-callout-metadata="" data-callout-fold="" data-callout="warning" class="callout"><div class="callout-title" dir="auto"><div class="callout-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg></div><div class="callout-title-inner">${i18next.t("desc.warning")}</div></div><div class="callout-content">
		<p dir="auto">${i18next.t("desc.sendTo")} <a href="mailto:support@mara-li.fr" target="_blank" rel="noopener nofollow">${i18next.t("desc.support")}</a><br>
		${i18next.t("desc.shouldHeader")}<code>[PASSWORD] Password lost</code>.<br>
		<strong>${i18next.t("desc.uninstall")}</strong></p>
		</div></div>
	
`);
		containerEl.addClass("password-for-web-browsing");
		containerEl.appendChild(sanitizeHTMLToDom(desc));

		if (this.settings.firstRun) {
			const firstRun = new Setting(containerEl)
				.setName(i18next.t("firstRun.title"))
				.setDesc(
					sanitizeHTMLToDom(
						`${i18next.t("firstRun.prompt")}<br>${i18next.t("firstRun.encryption")}`
					)
				)
				.setHeading();
			this.changePassword(firstRun, true);
		} else {
			new Setting(containerEl).addButton((button) => {
				button
					.setButtonText(i18next.t("changePassword"))
					.setClass("change-password")
					.setWarning()
					.onClick(async () => {
						const oldPassword = await this.plugin.decryptPassword();
						if (!oldPassword) {
							HtmlNotice(
								`<span class='pin error'>${i18next.t("error.passwordNotFound")}</span>`
							);
							return;
						}
						new InputPassword(this.app, async (password) => {
							if (password.trim().length === 0) {
								HtmlNotice(`<span class='pin error'>${i18next.t("error.empty")}</span>`);
								return;
							}
							if (oldPassword !== password) {
								HtmlNotice(`<span class='pin error'>${i18next.t("error.match")}</span>`);

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
