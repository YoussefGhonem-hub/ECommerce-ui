import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GuestUserService {
    private readonly storageKey = 'guestUserId';

    constructor() { }

    /**
     * Return existing guest id from localStorage or create a new one.
     */
    public getGuestId(): string {
        try {
            const existing = localStorage.getItem(this.storageKey);
            if (existing) return existing;

            const newId = this.generateUuid();
            localStorage.setItem(this.storageKey, newId);
            return newId;
        } catch (e) {
            // In case localStorage is unavailable, fallback to a volatile id
            return this.generateUuid();
        }
    }

    /**
     * Helper: deterministic random uuid v4-like string (sufficient for client-side id)
     */
    private generateUuid(): string {
        // RFC4122 version 4 compliant-ish UUID generator
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
