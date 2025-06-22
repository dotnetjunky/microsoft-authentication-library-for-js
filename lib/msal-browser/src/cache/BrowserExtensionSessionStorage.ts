/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";

import { IWindowStorage } from "./IWindowStorage.js";

export class BrowserExtensionSessionStorage implements IWindowStorage<string> {
    private allSettings: Record<string, string> = {};
    private initialized: boolean = false;

    constructor(private readonly logger: Logger) {}

    async initialize(): Promise<void> {
        this.allSettings = await chrome.storage.session.get(null);
        this.initialized = true;
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.uninitializedPublicClientApplication
            );
        }
    }

    getItem(key: string): string | null {
        this.ensureInitialized();

        const item = this.allSettings[key];
        return item && typeof item === "string" ? item : null;
    }

    getUserData(key: string): string | null {
        return this.getItem(key);
    }

    setItem(key: string, value: string): void {
        this.ensureInitialized();

        this.allSettings[key] = value;
        chrome.storage.session
            .set({
                [key]: value,
            })
            .then(() => {
                this.logger.trace(`Set item in local storage: ${key}`);
            })
            .catch((error) => {
                this.logger.error(
                    `Failed to set item in local storage: ${error}`
                );
            });
    }

    async setUserData(key: string, value: string): Promise<void> {
        this.setItem(key, value);
    }

    removeItem(key: string): void {
        this.ensureInitialized();

        delete this.allSettings[key];
        chrome.storage.session
            .remove(key)
            .then(() => {
                this.logger.trace(`Removed item from local storage: ${key}`);
            })
            .catch((error) => {
                this.logger.error(
                    `Failed to remove item from local storage: ${error}`
                );
            });
    }

    getKeys(): string[] {
        this.ensureInitialized();
        return Object.keys(this.allSettings);
    }

    containsKey(key: string): boolean {
        this.ensureInitialized();
        return this.allSettings.hasOwnProperty(key);
    }
}
