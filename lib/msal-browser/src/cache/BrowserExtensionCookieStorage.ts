/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { getCookieExpirationTime, SameSiteOptions } from "./CookieStorage.js";

export class BrowserExtensionCookieStorage {
    private cookieUrl = chrome.runtime.getURL("/");

    async getItem(key: string): Promise<string | undefined> {
        const cookie = await chrome.cookies.get({
            url: this.cookieUrl,
            name: encodeURIComponent(key),
        });

        return cookie?.value;
    }

    async setItem(
        key: string,
        value: string,
        cookieLifeDays?: number,
        secure: boolean = true,
        sameSite: SameSiteOptions = SameSiteOptions.Lax
    ): Promise<void> {
        await chrome.cookies.set({
            url: this.cookieUrl,
            name: encodeURIComponent(key),
            value: encodeURIComponent(value),
            expirationDate: cookieLifeDays
                ? getCookieExpirationTime(cookieLifeDays).getTime() / 1000
                : undefined,
            path: "/",
            secure,
            sameSite:
                sameSite === SameSiteOptions.None ? "no_restriction" : "lax",
        });
    }
}
