/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPerformanceClient, Logger } from "@azure/msal-common";
import { LocalStorage } from "./LocalStorage.js";

export class BrowserExtensionLocalStorage extends LocalStorage {
    private allSettings: Record<string, unknown> = {};

    constructor(
        clientId: string,
        logger: Logger,
        performanceClient: IPerformanceClient
    ) {
        super(clientId, logger, performanceClient);
    }

    override async initialize(correlationId: string): Promise<void> {
        this.allSettings = await chrome.storage.local.get(null);
        await super.initialize(correlationId);
    }

    override getItem(key: string): string | null {
        const item = this.allSettings[key];
        return item && typeof item === "string" ? item : null;
    }

    override setItem(key: string, value: string): void {
        this.allSettings[key] = value;
        chrome.storage.local
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

    override removeItem(key: string): void {
        super.removeItem(key);

        delete this.allSettings[key];
        chrome.storage.local
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

    override getKeys(): string[] {
        return Object.keys(this.allSettings);
    }

    override containsKey(key: string): boolean {
        return this.allSettings.hasOwnProperty(key);
    }

    /**
     * Removes all known MSAL keys from the cache
     */
    override clear(): void {
        this.memoryStorage.clear();
        this.allSettings = {};

        chrome.storage.local.remove(this.getKeys()).catch((error) => {
            this.logger.error(
                `Failed to remove items from local storage: ${error}`
            );
        });
    }
}
