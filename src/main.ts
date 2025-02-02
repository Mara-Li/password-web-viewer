import i18next from "i18next";
import { Notice, Plugin, normalizePath } from "obsidian";
import HtmlNotice from "./htmlNotice";
import { resources, translationLanguage } from "./i18n";
import { DEFAULT_SETTINGS, type PasswordForWeb } from "./interfaces";
import InputPassword from "./modal";
import { PasswordforWebBrowsingSettingTab } from "./settings";

export default class PasswordforWebBrowsing extends Plugin {
	settings!: PasswordForWeb;
	private keyPath: string = normalizePath(
		`${this.app.vault.configDir}/${this.manifest.id}.key.json`
	);
	private passwordPath: string = normalizePath(
		`${this.app.vault.configDir}/${this.manifest.id}.password.json`
	);
	private enableTheBrowserPlugin: boolean = false;

	async saveEncryptedPassword(content: string, type: "key" | "password" = "key") {
		let path = type === "key" ? this.keyPath : this.passwordPath;

		if (!path) {
			const vaultDir = this.app.vault.configDir;
			path = normalizePath(`${vaultDir}/${this.manifest.id}.${type}.json`);

			if (type === "key") {
				this.keyPath = path;
				this.settings.keyPath = path;
			} else {
				this.passwordPath = path;
				this.settings.passwordPath = path;
			}
			await this.saveSettings();
		}

		console.log(`💾 Sauvegarde de ${type} dans ${path}`);
		await this.app.vault.adapter.write(path, content);
	}

	/**
	 * Generate and store the key for encryption and decryption for the password file
	 */
	async generateAndStoreKey() {
		const key = await crypto.subtle.generateKey(
			{
				name: "AES-GCM",
				length: 256,
			},
			true,
			["encrypt", "decrypt"]
		);
		const exportedKey = await crypto.subtle.exportKey("jwk", key);
		await this.saveEncryptedPassword(JSON.stringify(exportedKey), "key");
		return key;
	}

	async getStoredKey(path: string) {
		try {
			const file = await this.app.vault.adapter.read(path);
			return await crypto.subtle.importKey(
				"jwk",
				JSON.parse(file),
				{ name: "AES-GCM", length: 256 },
				true,
				["encrypt", "decrypt"]
			);
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	async encryptAndStorePassword(password: string) {
		const key =
			(await this.getStoredKey(this.keyPath)) ?? (await this.generateAndStoreKey());
		const encoder = new TextEncoder();
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const encrypted = await crypto.subtle.encrypt(
			{
				name: "AES-GCM",
				iv,
			},
			key,
			encoder.encode(password)
		);
		const data = {
			encryptedData: Array.from(new Uint8Array(encrypted)),
			iv: Array.from(iv),
		};
		await this.saveEncryptedPassword(JSON.stringify(data), "password");
		console.log("Password encrypted and stored");
	}

	async decryptPassword() {
		const key = await this.getStoredKey(this.keyPath);
		if (!key) {
			console.error("Key not found");
			return null;
		}
		try {
			const storedData = await this.app.vault.adapter.read(this.passwordPath);
			const { encryptedData, iv } = JSON.parse(storedData);
			const decrypted = await crypto.subtle.decrypt(
				{
					name: "AES-GCM",
					iv: new Uint8Array(iv),
				},
				key,
				new Uint8Array(encryptedData)
			);
			const decoder = new TextDecoder();
			return decoder.decode(decrypted);
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	async getDefaultPath() {
		if (
			this.settings.keyPath &&
			(await this.app.vault.adapter.exists(this.settings.keyPath))
		)
			this.keyPath = this.settings.keyPath;
		else {
			this.settings.keyPath = this.keyPath;
			await this.saveSettings();
		}
		if (
			this.settings.passwordPath &&
			(await this.app.vault.adapter.exists(this.settings.passwordPath))
		)
			this.passwordPath = this.settings.passwordPath;
		else {
			this.settings.passwordPath = this.passwordPath;
			await this.saveSettings();
		}
	}

	async onload() {
		console.log(`[${this.manifest.name}] Loaded`);
		await this.loadSettings();
		await this.getDefaultPath();
		//load i18next
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
			returnNull: false,
			returnEmptyString: false,
		});

		this.addSettingTab(new PasswordforWebBrowsingSettingTab(this.app, this));
		this.registerEvent(
			this.app.internalPlugins.on("change", async (plugin) => {
				//@ts-ignore
				if (plugin.instance.id !== "webviewer") {
					return;
				}
				//@ts-ignore
				if (plugin.enabled && !this.enableTheBrowserPlugin) {
					if (this.settings.firstRun) {
						new Notice("Please set a password for web browsing");
						//@ts-ignore
						plugin.disable();
						this.app.setting.openTabById(`${this.manifest.id}`);
					} else {
						const password = await this.decryptPassword();
						if (!password) {
							new Notice("Password not found or incorrect");
							return;
						}
						//@ts-ignore
						new InputPassword(
							this.app,
							async (result) => {
								if (result !== password) {
									HtmlNotice(
										"<span class='pin error'>Password is incorrect. Can't enable the core plugin.</span>"
									);
									return;
								} else {
									HtmlNotice(
										"<span class='pin success'>Password is correct! Enabling the core plugin.</span>"
									);
								}
							},
							plugin,
							password
						).open();
					}
				}
			})
		);
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}

	private async loadPrivateData() {
		const privateDataPath = normalizePath(
			`${this.app.vault.configDir}/${this.manifest.id}.json`
		);
		if (!(await this.app.vault.adapter.exists(privateDataPath))) {
			await this.app.vault.adapter.write(
				privateDataPath,
				JSON.stringify(DEFAULT_SETTINGS, null, 2)
			);
			return DEFAULT_SETTINGS;
		}
		const file = await this.app.vault.adapter.read(privateDataPath);
		return JSON.parse(file) as PasswordForWeb;
	}

	private async savePrivateData(data: PasswordForWeb) {
		const privateDataPath = normalizePath(
			`${this.app.vault.configDir}/${this.manifest.id}.json`
		);
		console.log("Saving private data", data);
		await this.app.vault.adapter.write(privateDataPath, JSON.stringify(data, null, 2));
	}

	async loadSettings() {
		this.settings = await this.loadPrivateData();
		console.log("Settings loaded", this.settings);
	}

	async saveSettings() {
		await this.savePrivateData(this.settings);
	}
}
