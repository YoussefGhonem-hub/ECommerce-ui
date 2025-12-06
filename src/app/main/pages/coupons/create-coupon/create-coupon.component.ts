import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { HttpService } from '@shared/services/http.service';
import { CouponController } from '@shared/Controllers/CouponController';

@Component({
    selector: 'app-create-coupon',
    templateUrl: './create-coupon.component.html',
    styleUrls: ['./create-coupon.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CreateCouponComponent implements OnInit {
    public contentHeader: object;
    public couponForm: FormGroup;
    public isEditMode: boolean = false;
    public couponId: string | null = null;
    public isLoading: boolean = false;
    public isSaving: boolean = false;
    public discountType: string = 'percentage'; // percentage, fixedAmount, freeShipping

    constructor(
        private formBuilder: FormBuilder,
        private httpService: HttpService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.initializeForm();
    }

    ngOnInit(): void {
        // Check if we're in edit mode
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.couponId = params['id'];
                this.loadCoupon(this.couponId);
            }
        });

        this.contentHeader = {
            headerTitle: this.isEditMode ? 'Edit Coupon' : 'Create Coupon',
            actionButton: true,
            breadcrumb: {
                type: '',
                links: [
                    {
                        name: 'Home',
                        isLink: true,
                        link: '/'
                    },
                    {
                        name: 'Coupons',
                        isLink: true,
                        link: '/admin/coupons'
                    },
                    {
                        name: this.isEditMode ? 'Edit' : 'Create',
                        isLink: false
                    }
                ]
            }
        };

        // Watch discount type changes
        this.onDiscountTypeChange();
    }

    /**
     * Initialize form
     */
    private initializeForm(): void {
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        this.couponForm = this.formBuilder.group({
            code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            discountType: ['percentage'],
            percentage: [0, [Validators.min(0), Validators.max(100)]],
            fixedAmount: [0, [Validators.min(0)]],
            freeShipping: [false],
            startDate: [today.toISOString().substring(0, 10), Validators.required],
            endDate: [nextMonth.toISOString().substring(0, 10), Validators.required],
            usageLimit: [null, [Validators.min(1)]],
            perUserLimit: [null, [Validators.min(1)]],
            isActive: [true]
        });
    }

    /**
     * Watch discount type changes and update validators
     */
    private onDiscountTypeChange(): void {
        this.couponForm.get('discountType')?.valueChanges.subscribe(type => {
            this.discountType = type;
            this.updateValidators(type);
        });
    }

    /**
     * Update validators based on discount type
     */
    private updateValidators(type: string): void {
        const percentageControl = this.couponForm.get('percentage');
        const fixedAmountControl = this.couponForm.get('fixedAmount');
        const freeShippingControl = this.couponForm.get('freeShipping');

        // Clear all validators first
        percentageControl?.clearValidators();
        fixedAmountControl?.clearValidators();

        // Set validators based on type
        if (type === 'percentage') {
            percentageControl?.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
            fixedAmountControl?.setValue(null);
            freeShippingControl?.setValue(false);
        } else if (type === 'fixedAmount') {
            fixedAmountControl?.setValidators([Validators.required, Validators.min(0.01)]);
            percentageControl?.setValue(null);
            freeShippingControl?.setValue(false);
        } else if (type === 'freeShipping') {
            percentageControl?.setValue(null);
            fixedAmountControl?.setValue(null);
            freeShippingControl?.setValue(true);
        }

        percentageControl?.updateValueAndValidity();
        fixedAmountControl?.updateValueAndValidity();
    }

    /**
     * Load coupon data for editing
     */
    private loadCoupon(id: string): void {
        this.isLoading = true;
        this.httpService.GET(CouponController.GetCouponById(id)).subscribe(
            (res: any) => {
                if (res && res.succeeded && res.data) {
                    const coupon = res.data;

                    // Determine discount type
                    let discountType = 'percentage';
                    if (coupon.fixedAmount && coupon.fixedAmount > 0) {
                        discountType = 'fixedAmount';
                    } else if (coupon.freeShipping) {
                        discountType = 'freeShipping';
                    }

                    this.couponForm.patchValue({
                        code: coupon.code,
                        discountType: discountType,
                        percentage: coupon.percentage || 0,
                        fixedAmount: coupon.fixedAmount || 0,
                        freeShipping: coupon.freeShipping || false,
                        startDate: new Date(coupon.startDate).toISOString().substring(0, 10),
                        endDate: new Date(coupon.endDate).toISOString().substring(0, 10),
                        usageLimit: coupon.usageLimit,
                        perUserLimit: coupon.perUserLimit,
                        isActive: coupon.isActive
                    });

                    this.discountType = discountType;
                }
                this.isLoading = false;
            },
            (error) => {
                console.error('Error loading coupon:', error);
                Swal.fire('Error!', 'Failed to load coupon data.', 'error');
                this.isLoading = false;
                this.router.navigate(['/admin/coupons']);
            }
        );
    }

    /**
     * Submit form
     */
    onSubmit(): void {
        if (this.couponForm.invalid) {
            this.couponForm.markAllAsTouched();
            return;
        }

        // Validate dates
        const startDate = new Date(this.couponForm.value.startDate);
        const endDate = new Date(this.couponForm.value.endDate);

        if (endDate <= startDate) {
            Swal.fire('Invalid Dates!', 'End date must be after start date.', 'error');
            return;
        }

        this.isSaving = true;

        const formValue = this.couponForm.value;
        const couponData = {
            code: formValue.code.toUpperCase(),
            percentage: formValue.discountType === 'percentage' ? formValue.percentage : null,
            fixedAmount: formValue.discountType === 'fixedAmount' ? formValue.fixedAmount : null,
            freeShipping: formValue.discountType === 'freeShipping',
            startDate: new Date(formValue.startDate).toISOString(),
            endDate: new Date(formValue.endDate).toISOString(),
            usageLimit: formValue.usageLimit,
            perUserLimit: formValue.perUserLimit,
            isActive: formValue.isActive
        };

        const request = this.isEditMode
            ? this.httpService.PUT(CouponController.UpdateCoupon(this.couponId!), couponData)
            : this.httpService.POST(CouponController.CreateCoupon, couponData);

        request.subscribe(
            (res: any) => {
                if (res && res.succeeded) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: `Coupon ${this.isEditMode ? 'updated' : 'created'} successfully.`,
                        confirmButtonColor: '#7367F0'
                    }).then(() => {
                        this.router.navigate(['/admin/coupons']);
                    });
                } else {
                    Swal.fire('Error!', res.message || `Failed to ${this.isEditMode ? 'update' : 'create'} coupon.`, 'error');
                }
                this.isSaving = false;
            },
            (error) => {
                console.error('Error saving coupon:', error);
                Swal.fire('Error!', `An error occurred while ${this.isEditMode ? 'updating' : 'creating'} the coupon.`, 'error');
                this.isSaving = false;
            }
        );
    }

    /**
     * Cancel and go back
     */
    onCancel(): void {
        this.router.navigate(['/admin/coupons']);
    }

    /**
     * Get form control
     */
    getFormControl(controlName: string) {
        return this.couponForm.get(controlName);
    }
}
