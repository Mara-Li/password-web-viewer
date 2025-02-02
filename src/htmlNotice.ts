import { Notice, sanitizeHTMLToDom } from "obsidian";

export default function HtmlNotice(html: string) {
	return new Notice(sanitizeHTMLToDom(html));
}
