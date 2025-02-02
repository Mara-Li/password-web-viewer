import { type App, Modal, Setting } from "obsidian";
import htmlNotice from "../htmlNotice";

export default class extends Modal {
	password: string;
	onSubmit: (result: string) => void;
	constructor(app: App, password: string, onSubmit: (result: string) => void) {
		super(app);
		this.password = password;
		this.setTitle("Password for Web Browsing");
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClasses(["password-for-web-browsing"]);
		let name = "";

		new Setting(contentEl).addText((text) => {
			text
				.setPlaceholder("Your password")
				.setValue("")
				.onChange(async (value) => {
					name = value;
				});
			text.inputEl.type = "password";
		});

		new Setting(contentEl).addButton((button) => {
			button
				.setButtonText("Submit")
				.setCta()
				.onClick(async () => {
					if (name !== this.password) {
						htmlNotice("<span class='pin error'>Password is incorrect</span>");
						return;
					}
					this.close();
					this.onSubmit(name);
				});
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
