import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '@shared/services/http.service';
import { ProductAttributesController } from '@shared/Controllers/ProductAttributesController';

@Component({
    selector: 'app-product-attributes',
    templateUrl: './product-attributes.component.html',
    styleUrls: ['./product-attributes.component.scss']
})
export class ProductAttributesComponent implements OnInit {
    attributes: any[] = [];
    loading = false;
    error = '';
    // pagination
    pageNumber = 1;
    pageSize = 10;
    totalCount = 0;

    // modal/form
    modalRef: NgbModalRef | null = null;
    attributeForm: FormGroup;
    creating = false;
    editingId: string | null = null;
    // when editing, keep track of existing values and whether they should be removed
    // originalValue is stored to detect edits (so we can replace by removing old id and adding new value)
    existingValues: Array<{ id: string, value: string, originalValue?: string, remove?: boolean }> = [];
    // when adding new values for Color attribute, maintain an array of color strings
    newColorValues: string[] = [];

    // Small color palette for mapping named colors to hex
    private readonly COLOR_PALETTE: { [key: string]: string } = {
        'Red': '#dc3545',
        'Blue': '#007bff',
        'Green': '#28a745',
        'Black': '#000000',
        'White': '#ffffff',
        'Gray': '#6c757d',
        'Grey': '#6c757d'
    };

    // Fallback: generate a deterministic hex color from a string
    private stringToColor(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            // tslint:disable-next-line: no-bitwise
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            // tslint:disable-next-line: no-bitwise
            const value = (hash >> (i * 8)) & 255;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }

    constructor(
        private http: HttpService,
        private fb: FormBuilder,
        private modalService: NgbModal,
        private cdr: ChangeDetectorRef
    ) {
        this.attributeForm = this.fb.group({
            name: ['', Validators.required],
            valuesText: ['']
        });
    }

    ngOnInit(): void {
        this.loadAttributes();
    }

    loadAttributes(page?: number) {
        if (page && page > 0) this.pageNumber = page;
        this.loading = true;
        const query = { pageNumber: this.pageNumber, pageSize: this.pageSize };
        this.http.GET(ProductAttributesController.GetAll, query).subscribe({
            next: (res: any) => {
                // expected shape: { items: [...], totalCount, pageNumber, pageSize }
                if (res) {
                    this.attributes = Array.isArray(res.items) ? res.items : (Array.isArray(res) ? res : (res.data || []));
                    this.totalCount = res.totalCount || 0;
                    this.pageNumber = res.pageNumber || this.pageNumber;
                    this.pageSize = res.pageSize || this.pageSize;
                } else {
                    this.attributes = [];
                    this.totalCount = 0;
                }
                this.loading = false;
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.message || 'Failed to load attributes';
            }
        });
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil((this.totalCount || 0) / this.pageSize));
    }

    changePage(page: number) {
        if (page < 1 || page > this.totalPages) return;
        this.pageNumber = page;
        this.loadAttributes(page);
    }

    changePageSize(size: number) {
        this.pageSize = size;
        this.pageNumber = 1;
        this.loadAttributes(1);
    }

    formatAttributeValues(attr: any): string {
        try {
            const vals = attr && (attr.values || []);
            if (!Array.isArray(vals) || vals.length === 0) return '';
            return vals.map((v: any) => v && (v.value || v.name || '')).filter(Boolean).join(', ');
        } catch (e) {
            return '';
        }
    }
    openCreateModal(content: any) {
        this.editingId = null;
        this.attributeForm.reset({ name: '', valuesText: '' });
        // initialize color inputs for convenience
        this.newColorValues = ['#000000'];
        this.modalRef = this.modalService.open(content, { centered: true });
    }

    openEditModal(attr: any, content: any) {
        this.editingId = attr.attributeId || attr.id || null;
        const values = (attr.values || []).map((v: any) => v.value).join(',');
        this.attributeForm.setValue({ name: attr.attributeName || attr.name || '', valuesText: '' });
        // populate existingValues with remove flag default false and keep originalValue for change detection
        this.existingValues = (attr.values || []).map((v: any) => ({ id: v.id, value: v.value, originalValue: v.value, remove: false }));
        // If editing a Color attribute, normalize values to valid #RRGGBB for the color input
        if ((this.attributeForm.get('name')?.value || '').toLowerCase() === 'color') {
            this.existingValues = this.existingValues.map(ev => ({
                ...ev,
                // keep originalValue, but set value to a normalized hex string suitable for <input type="color">
                value: this.normalizeColorForInput(ev.value)
            }));
        }
        // reset newColorValues when editing; user can still add additional colors via the add control
        this.newColorValues = [];
        this.modalRef = this.modalService.open(content, { centered: true });
    }

    /**
     * Normalize various color value forms into a valid #RRGGBB string for color input.
     * - Accepts '#abc', '#aabbcc', 'abc', 'aabbcc', named colors like 'Black'
     * - Falls back to generating a color from the string when unknown
     */
    private normalizeColorForInput(val: string): string {
        if (!val) return '#000000';
        let s = String(val).trim();
        // If already starts with #
        if (s.startsWith('#')) {
            const hex = s.substring(1);
            if (/^[0-9A-Fa-f]{6}$/.test(hex)) return '#' + hex.toLowerCase();
            if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
                // expand shorthand #abc -> #aabbcc
                return '#' + hex.split('').map(c => c + c).join('').toLowerCase();
            }
        }
        // If plain 6-digit hex without #
        if (/^[0-9A-Fa-f]{6}$/.test(s)) return '#' + s.toLowerCase();
        // If plain 3-digit hex without #
        if (/^[0-9A-Fa-f]{3}$/.test(s)) return '#' + s.split('').map(c => c + c).join('').toLowerCase();

        // Lookup in palette (case-insensitive)
        const found = Object.keys(this.COLOR_PALETTE).find(k => k.toLowerCase() === s.toLowerCase());
        if (found) return this.COLOR_PALETTE[found];

        // As a last resort, generate a color from the string
        return this.stringToColor(s);
    }

    saveAttribute() {
        if (this.attributeForm.invalid) return;
        const name = this.attributeForm.get('name')?.value;
        const valuesText = this.attributeForm.get('valuesText')?.value || '';
        const isColor = (name || '').toLowerCase() === 'color';
        const values = isColor ? this.newColorValues.map(v => v).filter(Boolean) : valuesText.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
        this.creating = true;

        if (this.editingId) {
            // Build update payload per backend: Id, Name, AddValues (strings), RemoveValueIds (guids)
            // Detect changed existing values: we'll remove the old id and add the new value
            const isColor = (name || '').toLowerCase() === 'color';
            const changed = this.existingValues.filter(v => {
                if (v.remove) return false;
                if (v.originalValue === undefined) return false;
                if (isColor) {
                    return this.normalizeColorForInput(v.originalValue) !== this.normalizeColorForInput(v.value);
                }
                return v.originalValue !== v.value;
            });
            const changedRemoveIds = changed.map(v => v.id);
            const changedAddValues = changed.map(v => v.value);

            const removeIds = this.existingValues.filter(v => v.remove).map(v => v.id).concat(changedRemoveIds);

            // Merge new values and changedAddValues, dedupe (case-insensitive for colors)
            let addValuesArr: string[] = [];
            if (isColor) {
                const set = new Set<string>();
                (values || []).forEach(v => set.add(String(v).toLowerCase()));
                changedAddValues.forEach(v => set.add(String(v).toLowerCase()));
                addValuesArr = Array.from(set).map(s => s);
            } else {
                const set = new Set<string>();
                (values || []).forEach(v => { if (v) set.add(String(v)); });
                changedAddValues.forEach(v => { if (v) set.add(String(v)); });
                addValuesArr = Array.from(set);
            }

            const payload = { Id: this.editingId, Name: name, AddValues: addValuesArr.length > 0 ? addValuesArr : null, RemoveValueIds: removeIds.length > 0 ? removeIds : null };
            this.http.PUT(ProductAttributesController.Update, payload).subscribe({
                next: (res: any) => {
                    this.creating = false;
                    this.modalRef?.close();
                    // clear new color inputs after successful save
                    this.newColorValues = [];
                    this.loadAttributes();
                },
                error: (err) => { this.creating = false; this.error = err?.message || 'Failed to update'; }
            });
        } else {
            const payload = { Name: name, Values: values };
            this.http.POST(ProductAttributesController.Create, payload).subscribe({
                next: (res: any) => {
                    this.creating = false;
                    this.modalRef?.close();
                    this.newColorValues = [];
                    this.loadAttributes();
                },
                error: (err) => { this.creating = false; this.error = err?.message || 'Failed to create'; }
            });
        }
    }

    confirmDelete(attr: any) {
        if (!confirm(`Delete attribute "${attr.attributeName || attr.name}"? This cannot be undone.`)) return;
        const id = attr.attributeId || attr.id;
        if (!id) return;
        this.http.DELETE(ProductAttributesController.Delete(id)).subscribe({
            next: () => this.loadAttributes(),
            error: (err) => this.error = err?.message || 'Failed to delete'
        });
    }
}
