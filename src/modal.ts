import i18next from "i18next";
import { type App, Modal, Setting } from "obsidian";
export default class extends Modal {
	onSubmit: (result: string) => void;
	webview: unknown;
	oldPassword?: string;
	password: string | null = null;
	constructor(
		app: App,
		onSubmit: (result: string) => void,
		webview?: unknown,
		oldPassword?: string
	) {
		super(app);
		this.setTitle(i18next.t("input"));
		this.onSubmit = onSubmit;
		this.webview = webview;
		this.oldPassword = oldPassword;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClasses(["password-for-web-browsing"]);

		new Setting(contentEl).addText((text) => {
			text
				.setPlaceholder(i18next.t("password"))
				.setValue("")
				.onChange(async (value) => {
					this.password = value;
				});
			text.inputEl.type = "password";
		});

		new Setting(contentEl).addButton((button) => {
			button
				.setButtonText(i18next.t("submit"))
				.setCta()
				.onClick(async () => {
					this.close();
					this.onSubmit(this.password ?? "");
				});
		});
	}

	onClose() {
		const { contentEl } = this;
		if (this.webview && this.password !== this.oldPassword) {
			//@ts-ignore
			this.webview.disable();
		}
		contentEl.empty();
	}
}
