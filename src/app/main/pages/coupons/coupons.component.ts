import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import { HttpService } from '@shared/services/http.service';
import { CouponController } from '@shared/Controllers/CouponController';

@Component({
    selector: 'app-coupons',
    templateUrl: './coupons.component.html',
    styleUrls: ['./coupons.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CouponsComponent implements OnInit {
    public contentHeader: object;
    public coupons: any = [];
    public isLoading: boolean = false;

    // Basic Filters
    public searchText: string = '';
    public filterStatus: string = 'all'; // all, active, inactive

    // Advanced Filters
    public showAdvancedFilters: boolean = false;
    public filterFreeShipping: string = 'all'; // all, yes, no
    public filterStartDateFrom: string = '';
    public filterStartDateTo: string = '';
    public filterEndDateFrom: string = '';
    public filterEndDateTo: string = '';
    public filterFixedAmount: string = '';
    public filterPercentage: string = '';

    // Pagination
    public currentPage: number = 1;
    public itemsPerPage: number = 10;
    public totalItems: number = 0;

    constructor(
        private httpService: HttpService,
        private router: Router,
        private modalService: NgbModal
    ) { }

    ngOnInit(): void {
        this.contentHeader = {
            headerTitle: 'Coupons',
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
                        name: 'Admin',
                        isLink: true,
                        link: '/admin'
                    },
                    {
                        name: 'Coupons',
                        isLink: false
                    }
                ]
            }
        };

        this.loadCoupons();
    }

    /**
     * Load all coupons with backend filters
     */
    loadCoupons(): void {
        this.isLoading = true;

        // Build query parameters
        const queryParams = this.buildQueryParams();
        const url = CouponController.GetCoupons + (queryParams ? `?${queryParams}` : '');

        this.httpService.GET(url).subscribe(
            (res: any) => {
                if (res.data && res.succeeded) {
                    this.coupons = res.data;
                    this.totalItems = res.data.length;
                }
                this.isLoading = false;
            },
            (error) => {
                console.error('Error loading coupons:', error);
                this.isLoading = false;
            }
        );
    }

    /**
     * Build query parameters for backend filtering
     */
    buildQueryParams(): string {
        const params: string[] = [];

        // Filter by status
        if (this.filterStatus !== 'all') {
            params.push(`IsActive=${this.filterStatus === 'active'}`);
        }

        // Search by code
        if (this.searchText && this.searchText.trim() !== '') {
            params.push(`Code=${encodeURIComponent(this.searchText.trim())}`);
        }

        // Filter by free shipping
        if (this.filterFreeShipping !== 'all') {
            params.push(`FreeShipping=${this.filterFreeShipping === 'yes'}`);
        }

        // Filter by start date range
        if (this.filterStartDateFrom) {
            params.push(`StartDateFrom=${encodeURIComponent(this.filterStartDateFrom)}`);
        }
        if (this.filterStartDateTo) {
            params.push(`StartDateTo=${encodeURIComponent(this.filterStartDateTo)}`);
        }

        // Filter by end date range
        if (this.filterEndDateFrom) {
            params.push(`EndDateFrom=${encodeURIComponent(this.filterEndDateFrom)}`);
        }
        if (this.filterEndDateTo) {
            params.push(`EndDateTo=${encodeURIComponent(this.filterEndDateTo)}`);
        }

        // Filter by fixed amount
        if (this.filterFixedAmount && this.filterFixedAmount.trim() !== '') {
            params.push(`FixedAmount=${encodeURIComponent(this.filterFixedAmount.trim())}`);
        }

        // Filter by percentage
        if (this.filterPercentage && this.filterPercentage.trim() !== '') {
            params.push(`Percentage=${encodeURIComponent(this.filterPercentage.trim())}`);
        }

        return params.join('&');
    }

    /**
     * On search change
     */
    onSearchChange(): void {
        this.currentPage = 1;
        this.loadCoupons();
    }

    /**
     * On filter change
     */
    onFilterChange(): void {
        this.currentPage = 1;
        this.loadCoupons();
    }

    /**
     * Toggle advanced filters
     */
    toggleAdvancedFilters(): void {
        this.showAdvancedFilters = !this.showAdvancedFilters;
    }

    /**
     * Clear all filters
     */
    clearFilters(): void {
        this.searchText = '';
        this.filterStatus = 'all';
        this.filterFreeShipping = 'all';
        this.filterStartDateFrom = '';
        this.filterStartDateTo = '';
        this.filterEndDateFrom = '';
        this.filterEndDateTo = '';
        this.filterFixedAmount = '';
        this.filterPercentage = '';
        this.currentPage = 1;
        this.loadCoupons();
    }

    /**
     * Get paginated coupons
     */
    getPaginatedCoupons(): any[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.coupons.slice(startIndex, endIndex);
    }

    /**
     * Navigate to create coupon page
     */
    createCoupon(): void {
        this.router.navigate(['/admin/coupons/create']);
    }

    /**
     * Navigate to edit coupon page
     */
    editCoupon(coupon: any): void {
        this.router.navigate(['/admin/coupons/edit', coupon.id]);
    }

    /**
     * Toggle coupon status
     */
    toggleStatus(coupon: any): void {
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to ${coupon.isActive ? 'deactivate' : 'activate'} this coupon?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#7367F0',
            cancelButtonColor: '#E42728',
            confirmButtonText: 'Yes, proceed!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.httpService.PUT(CouponController.ToggleCouponStatus(coupon.id), {}).subscribe(
                    (res: any) => {
                        if (res && res.succeeded) {
                            Swal.fire('Success!', `Coupon ${coupon.isActive ? 'deactivated' : 'activated'} successfully.`, 'success');
                            this.loadCoupons();
                        } else {
                            Swal.fire('Error!', res.message || 'Failed to update coupon status.', 'error');
                        }
                    },
                    (error) => {
                        Swal.fire('Error!', 'An error occurred while updating coupon status.', 'error');
                    }
                );
            }
        });
    }

    /**
     * Delete coupon
     */
    deleteCoupon(coupon: any): void {
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete the coupon "${coupon.code}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#7367F0',
            cancelButtonColor: '#E42728',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.httpService.DELETE(CouponController.DeleteCoupon(coupon.id)).subscribe(
                    (res: any) => {
                        if (res && res.succeeded) {
                            Swal.fire('Deleted!', 'Coupon has been deleted.', 'success');
                            this.loadCoupons();
                        } else {
                            Swal.fire('Error!', res.message || 'Failed to delete coupon.', 'error');
                        }
                    },
                    (error) => {
                        Swal.fire('Error!', 'An error occurred while deleting coupon.', 'error');
                    }
                );
            }
        });
    }

    /**
     * Get coupon type badge
     */
    getCouponTypeBadge(coupon: any): string {
        if (coupon.percentage) {
            return 'badge-light-warning';
        } else if (coupon.fixedAmount) {
            return 'badge-light-success';
        } else if (coupon.freeShipping) {
            return 'badge-light-info';
        }
        return 'badge-light-secondary';
    }

    /**
     * Get coupon type text
     */
    getCouponTypeText(coupon: any): string {
        if (coupon.percentage) {
            return `${coupon.percentage}% Off`;
        } else if (coupon.fixedAmount) {
            return `${coupon.fixedAmount} EGP Off`;
        } else if (coupon.freeShipping) {
            return 'Free Shipping';
        }
        return 'N/A';
    }

    /**
     * Check if coupon is expired
     */
    isCouponExpired(coupon: any): boolean {
        return new Date(coupon.endDate) < new Date();
    }

    /**
     * Check if coupon is valid (active and not expired)
     */
    isCouponValid(coupon: any): boolean {
        return coupon.isActive && !this.isCouponExpired(coupon);
    }
}
