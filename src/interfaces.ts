export interface PasswordForWeb {
	keyPath?: string;
	passwordPath?: string;
	firstRun: boolean;
}

export const DEFAULT_SETTINGS: PasswordForWeb = {
	keyPath: undefined,
	passwordPath: undefined,
	firstRun: true,
};
