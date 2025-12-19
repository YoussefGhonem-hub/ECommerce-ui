import { Component, OnInit } from '@angular/core';
import { HttpService } from '@shared/services/http.service';
import { ShippingController } from '@shared/Controllers/ShippingController';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-shipping-management',
    templateUrl: './shipping-management.component.html',
    styleUrls: ['./shipping-management.component.scss']
})
export class ShippingManagementComponent implements OnInit {
    public shippingMethods: any[] = [];
    public isLoading: boolean = false;
    public showModal: boolean = false;
    public isEditMode: boolean = false;
    public currentMethod: any = {
        id: null,
        cost: 0
    };

    constructor(private httpService: HttpService) { }

    ngOnInit(): void {
        this.loadShippingMethods();
    }

    /**
     * Load all shipping methods
     */
    loadShippingMethods(): void {
        this.isLoading = true;
        this.httpService.GET(ShippingController.GetShippingMethods).subscribe(
            (res: any) => {
                if (res && res.succeeded) {
                    this.shippingMethods = res.data || [];
                } else {
                    Swal.fire('Error!', res.message || 'Failed to load shipping methods', 'error');
                }
                this.isLoading = false;
            },
            (error) => {
                console.error('Error loading shipping methods:', error);
                Swal.fire('Error!', 'An error occurred while loading shipping methods', 'error');
                this.isLoading = false;
            }
        );
    }

    /**
     * Open modal for creating new shipping method
     */
    openCreateModal(): void {
        this.isEditMode = false;
        this.currentMethod = {
            id: null,
            cost: 0
        };
        this.showModal = true;
    }

    /**
     * Open modal for editing shipping method
     */
    openEditModal(method: any): void {
        this.isEditMode = true;
        this.currentMethod = {
            id: method.id,
            cost: method.cost
        };
        this.showModal = true;
    }

    /**
     * Close modal
     */
    closeModal(): void {
        this.showModal = false;
        this.currentMethod = {
            id: null,
            cost: 0
        };
    }

    /**
     * Create new shipping method
     */
    createShippingMethod(): void {
        if (!this.validateForm()) return;

        const payload = {
            cost: this.currentMethod.cost
        };

        this.httpService.POST(ShippingController.CreateShippingMethod, payload).subscribe(
            (res: any) => {
                if (res && res.succeeded) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Shipping method created successfully',
                        confirmButtonColor: '#7367F0'
                    });
                    this.loadShippingMethods();
                    this.closeModal();
                } else {
                    Swal.fire('Error!', res.message || 'Failed to create shipping method', 'error');
                }
            },
            (error) => {
                console.error('Error creating shipping method:', error);
                Swal.fire('Error!', 'An error occurred while creating shipping method', 'error');
            }
        );
    }

    /**
     * Update existing shipping method
     */
    updateShippingMethod(): void {
        if (!this.validateForm()) return;

        const payload = {
            id: this.currentMethod.id,
            cost: this.currentMethod.cost
        };

        this.httpService.PUT(ShippingController.UpdateShippingMethod(this.currentMethod.id), payload).subscribe(
            (res: any) => {
                if (res && res.succeeded) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Shipping method updated successfully',
                        confirmButtonColor: '#7367F0'
                    });
                    this.loadShippingMethods();
                    this.closeModal();
                } else {
                    Swal.fire('Error!', res.message || 'Failed to update shipping method', 'error');
                }
            },
            (error) => {
                console.error('Error updating shipping method:', error);
                Swal.fire('Error!', 'An error occurred while updating shipping method', 'error');
            }
        );
    }

    /**
     * Submit form (create or update)
     */
    submitForm(): void {
        if (this.isEditMode) {
            this.updateShippingMethod();
        } else {
            this.createShippingMethod();
        }
    }

    /**
     * Validate form
     */
    validateForm(): boolean {
        if (this.currentMethod.cost === null || this.currentMethod.cost === undefined || this.currentMethod.cost < 0) {
            Swal.fire('Validation Error', 'Please enter a valid cost (0 or greater)', 'warning');
            return false;
        }
        return true;
    }
}
