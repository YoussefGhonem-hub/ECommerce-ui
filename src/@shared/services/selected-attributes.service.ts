import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface ProductAttributeSelection {
    productId: string;
    cartItemId: string;
    attributes: Array<{
        attributeId: string;
        attributeName: string;
        valueId: string;
        value: string;
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class SelectedAttributesService {
    // Store selected attributes by cart item ID
    private selectedAttributesMap = new Map<string, ProductAttributeSelection>();

    // Observable to notify subscribers of changes
    private _attributesChanged = new BehaviorSubject<Map<string, ProductAttributeSelection>>(new Map());
    public attributesChanged$ = this._attributesChanged.asObservable();

    constructor() {
        // Load from localStorage on initialization
        this.loadFromStorage();
    }

    /**
     * Update selected attributes for a cart item
     * @param cartItemId - The cart item ID
     * @param productId - The product ID
     * @param attributes - Array of selected attributes
     */
    updateSelectedAttributes(cartItemId: string, productId: string, attributes: any[]): void {
        if (!cartItemId || !productId) {
            console.warn('[SelectedAttributesService] Missing cartItemId or productId');
            return;
        }

        const selection: ProductAttributeSelection = {
            productId,
            cartItemId,
            attributes: attributes.map(attr => ({
                attributeId: attr.attributeId,
                attributeName: attr.attributeName,
                valueId: attr.valueId,
                value: attr.value
            }))
        };

        this.selectedAttributesMap.set(cartItemId, selection);
        this.saveToStorage();
        this._attributesChanged.next(new Map(this.selectedAttributesMap));

        console.log('[SelectedAttributesService] Updated attributes for cart item:', cartItemId, selection);
    }

    /**
     * Get selected attributes for a specific cart item
     * @param cartItemId - The cart item ID
     * @returns Array of selected attributes or null if not found
     */
    getSelectedAttributes(cartItemId: string): any[] | null {
        if (!cartItemId) return null;

        const selection = this.selectedAttributesMap.get(cartItemId);
        return selection ? selection.attributes : null;
    }

    /**
     * Remove selected attributes for a cart item (e.g., when item is removed from cart)
     * @param cartItemId - The cart item ID
     */
    removeSelectedAttributes(cartItemId: string): void {
        if (!cartItemId) return;

        this.selectedAttributesMap.delete(cartItemId);
        this.saveToStorage();
        this._attributesChanged.next(new Map(this.selectedAttributesMap));

        console.log('[SelectedAttributesService] Removed attributes for cart item:', cartItemId);
    }

    /**
     * Clear all selected attributes (e.g., after checkout completion)
     */
    clearAll(): void {
        this.selectedAttributesMap.clear();
        this.saveToStorage();
        this._attributesChanged.next(new Map(this.selectedAttributesMap));

        console.log('[SelectedAttributesService] Cleared all selected attributes');
    }

    /**
     * Get all selected attributes
     */
    getAllSelections(): Map<string, ProductAttributeSelection> {
        return new Map(this.selectedAttributesMap);
    }

    /**
     * Save to localStorage for persistence
     */
    private saveToStorage(): void {
        try {
            const data = Array.from(this.selectedAttributesMap.entries());
            localStorage.setItem('selectedAttributes', JSON.stringify(data));
        } catch (e) {
            console.error('[SelectedAttributesService] Error saving to localStorage:', e);
        }
    }

    /**
     * Load from localStorage
     */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem('selectedAttributes');
            if (data) {
                const parsed = JSON.parse(data);
                this.selectedAttributesMap = new Map(parsed);
                console.log('[SelectedAttributesService] Loaded from storage:', this.selectedAttributesMap.size, 'items');
            }
        } catch (e) {
            console.error('[SelectedAttributesService] Error loading from localStorage:', e);
            this.selectedAttributesMap = new Map();
        }
    }
}
