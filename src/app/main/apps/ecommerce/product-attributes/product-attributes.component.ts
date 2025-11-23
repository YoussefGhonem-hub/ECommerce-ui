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

    // modal/form
    modalRef: NgbModalRef | null = null;
    attributeForm: FormGroup;
    creating = false;
    editingId: string | null = null;

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

    loadAttributes() {
        this.loading = true;
        this.http.GET(ProductAttributesController.GetAll).subscribe({
            next: (res: any) => {
                this.attributes = Array.isArray(res) ? res : (res && res.data) ? res.data : [];
                this.loading = false;
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.message || 'Failed to load attributes';
            }
        });
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
        this.modalRef = this.modalService.open(content, { centered: true });
    }

    openEditModal(attr: any, content: any) {
        this.editingId = attr.attributeId || attr.id || null;
        const values = (attr.values || []).map((v: any) => v.value).join(',');
        this.attributeForm.setValue({ name: attr.attributeName || attr.name || '', valuesText: values });
        this.modalRef = this.modalService.open(content, { centered: true });
    }

    saveAttribute() {
        if (this.attributeForm.invalid) return;
        const name = this.attributeForm.get('name')?.value;
        const valuesText = this.attributeForm.get('valuesText')?.value || '';
        const values = valuesText.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
        this.creating = true;

        if (this.editingId) {
            const payload = { AttributeId: this.editingId, Name: name, Values: values };
            this.http.PUT(ProductAttributesController.Update, payload).subscribe({
                next: (res: any) => {
                    this.creating = false;
                    this.modalRef?.close();
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
