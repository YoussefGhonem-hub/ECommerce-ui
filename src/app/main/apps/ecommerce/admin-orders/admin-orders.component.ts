import { Component, OnInit } from '@angular/core';
import { HttpService } from '@shared/services/http.service';
import { OrderController } from '@shared/Controllers/OrderController';

@Component({
    selector: 'app-admin-orders',
    templateUrl: './admin-orders.component.html',
    styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
    orders: any[] = [];
    loading = false;
    totalCount = 0;
    pageNumber = 1;
    pageSize = 6;
    // filter model matches backend GetMyOrdersQuery / BaseFilterDto
    filters: any = {
        pageIndex: 1,
        pageSize: this.pageSize,
        sort: '',
        descending: true,
        orderNumber: '',
        status: null as number | null,
        paymentStatus: null as number | null,
        from: null as string | null,
        to: null as string | null,
        minTotal: null as number | null,
        maxTotal: null as number | null,
        productId: null as string | null,
        categoryId: null as string | null,
        search: ''
    };
    // keep pageNumber for UI
    statusFilter: string = 'All';
    expandedOrderId: string | null = null;

    // status options mapped to backend OrderStatus enum
    statusOptions: Array<{ label: string, value: number | null }> = [
        { label: 'Pending', value: 1 },
        { label: 'Processing', value: 4 },
        { label: 'Delivered', value: 7 },
        { label: 'Cancelled', value: 8 },
        { label: 'Returned', value: 9 }
    ];
    statusOptionsAction: Array<{ label: string, value: number | null }> = [
        { label: 'Processing', value: 4 },
        { label: 'Delivered', value: 7 },
        { label: 'Cancelled', value: 8 },
        { label: 'Returned', value: 9 }
    ];



    constructor(private httpService: HttpService) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(page: number = 1): void {
        this.loading = true;
        // set page index and page size on filters
        this.filters.pageIndex = page;
        this.filters.pageSize = this.pageSize;

        const query = this.buildQueryParams();
        const url = `${OrderController.GetOrders}?${query}`;

        this.httpService.GET(url).subscribe((res: any) => {
            if (res && res.succeeded && res.data) {
                this.orders = res.data.items || [];
                this.totalCount = res.data.totalCount || 0;
                // backend may return PageIndex or pageNumber depending on implementation
                this.pageNumber = res.data.pageIndex ?? res.data.pageNumber ?? page;
                this.pageSize = res.data.pageSize ?? this.pageSize;
                // keep filters in sync
                this.filters.pageIndex = this.pageNumber;
                this.filters.pageSize = this.pageSize;
            } else {
                this.orders = [];
                this.totalCount = 0;
            }
            this.loading = false;
        }, () => this.loading = false);
    }

    changeTab(option: any): void {
        // option may be an object {label,value} from statusOptions
        const val = option && option.value !== undefined ? option.value : null;
        const label = option && option.label ? option.label : String(option);
        if (this.filters.status === val) { return; }
        this.filters.status = val;
        this.statusFilter = label;
        this.pageNumber = 1;
        this.loadOrders(1);
    }

    applyFilters(): void {
        this.pageNumber = 1;
        this.pageSize = this.filters.pageSize || this.pageSize;
        this.loadOrders(1);
    }

    resetFilters(): void {
        this.filters = {
            pageIndex: 1,
            pageSize: this.pageSize,
            sort: '',
            descending: true,
            orderNumber: '',
            status: null,
            paymentStatus: null,
            from: null,
            to: null,
            minTotal: null,
            maxTotal: null,
            productId: null,
            categoryId: null,
            search: ''
        };
        this.statusFilter = 'All';
        this.pageNumber = 1;
        this.loadOrders(1);
    }

    private buildQueryParams(): string {
        const p: string[] = [];
        // required paging
        p.push(`pageIndex=${this.filters.pageIndex}`);
        p.push(`pageSize=${this.filters.pageSize}`);

        if (this.filters.sort) { p.push(`sort=${encodeURIComponent(this.filters.sort)}`); }
        if (this.filters.descending !== undefined && this.filters.descending !== null) { p.push(`descending=${this.filters.descending}`); }
        if (this.filters.orderNumber) { p.push(`orderNumber=${encodeURIComponent(this.filters.orderNumber)}`); }
        if (this.filters.status !== null && this.filters.status !== undefined) { p.push(`status=${this.filters.status}`); }
        if (this.filters.paymentStatus !== null && this.filters.paymentStatus !== undefined) { p.push(`paymentStatus=${this.filters.paymentStatus}`); }
        if (this.filters.from) { p.push(`from=${encodeURIComponent(new Date(this.filters.from).toISOString())}`); }
        if (this.filters.to) { p.push(`to=${encodeURIComponent(new Date(this.filters.to).toISOString())}`); }
        if (this.filters.minTotal !== null && this.filters.minTotal !== undefined) { p.push(`minTotal=${this.filters.minTotal}`); }
        if (this.filters.maxTotal !== null && this.filters.maxTotal !== undefined) { p.push(`maxTotal=${this.filters.maxTotal}`); }
        if (this.filters.productId) { p.push(`productId=${encodeURIComponent(this.filters.productId)}`); }
        if (this.filters.categoryId) { p.push(`categoryId=${encodeURIComponent(this.filters.categoryId)}`); }
        if (this.filters.search) { p.push(`search=${encodeURIComponent(this.filters.search)}`); }

        return p.join('&');
    }

    gotoPage(page: number): void {
        if (page < 1) { return; }
        const totalPages = this.totalPages;
        if (totalPages && page > totalPages) { return; }
        this.loadOrders(page);
    }

    toggleDetails(orderId: string): void {
        this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
    }

    get totalPages(): number {
        return this.pageSize ? Math.ceil(this.totalCount / this.pageSize) : 0;
    }

    formatAttributes(attrs: any[] | undefined | null): string {
        if (!attrs || !Array.isArray(attrs) || attrs.length === 0) { return ''; }
        // Filter out color attributes as they will be displayed separately
        const nonColorAttrs = attrs.filter(a => a.attributeName?.toLowerCase() !== 'color');
        return nonColorAttrs.map(a => a.attributeName + (a.value ? (': ' + a.value) : '')).join(', ');
    }

    /**
     * Get color attributes from item attributes
     */
    getColorAttributes(attrs: any[] | undefined | null): any[] {
        if (!attrs || !Array.isArray(attrs) || attrs.length === 0) { return []; }
        return attrs.filter(a => a.attributeName?.toLowerCase() === 'color');
    }

    updateOrderStatus(orderId: string, newStatus: any): void {
        if (!orderId || newStatus === null || newStatus === undefined) { return; }
        const statusNum = (typeof newStatus === 'number') ? newStatus : Number(newStatus);
        if (Number.isNaN(statusNum)) { return; }
        const payload = { orderId, status: statusNum };
        this.httpService.PUT(OrderController.UpdateOrderStatus, payload).subscribe((res: any) => {
            if (res && res.succeeded) {
                // refresh orders to reflect change
                this.loadOrders(this.pageNumber);
            }
        });
    }

    getStatusLabel(statusValue: any): string {
        if (statusValue === null || statusValue === undefined) { return '' };
        // try numeric match first
        const asNum = (typeof statusValue === 'number') ? statusValue : (Number(statusValue));
        if (!Number.isNaN(asNum)) {
            const found = this.statusOptions.find(s => s.value === asNum);
            if (found) { return found.label; }
        }
        // fallback: try matching by label (case-insensitive)
        const asStr = String(statusValue).toLowerCase();
        const foundByLabel = this.statusOptions.find(s => (s.label || '').toLowerCase() === asStr);
        if (foundByLabel) { return foundByLabel.label; }
        return String(statusValue);
    }

    getStatusBadgeClass(statusValue: any): string {
        // normalize to number when possible
        if (statusValue === null || statusValue === undefined) { return 'badge badge-pill badge-secondary'; }
        const asNum = (typeof statusValue === 'number') ? statusValue : Number(statusValue);
        const v = Number.isNaN(asNum) ? null : asNum;
        switch (v) {
            case 1: // Pending
                return 'badge badge-pill badge-warning';
            case 2: // PaymentPending
                return 'badge badge-pill badge-warning';
            case 3: // Paid
                return 'badge badge-pill badge-success';
            case 4: // Processing
                return 'badge badge-pill badge-primary';
            case 5: // Packed
                return 'badge badge-pill badge-info';
            case 6: // Shipped
                return 'badge badge-pill badge-primary';
            case 7: // Delivered
                return 'badge badge-pill badge-success';
            case 8: // Cancelled
                return 'badge badge-pill badge-danger';
            case 9: // Returned
                return 'badge badge-pill badge-dark';
            default:
                // try label-based mapping (e.g., backend returned 'Pending')
                const s = String(statusValue).toLowerCase();
                if (s.includes('pending')) { return 'badge badge-pill badge-warning'; }
                if (s.includes('paid') || s.includes('delivered')) { return 'badge badge-pill badge-success'; }
                if (s.includes('processing') || s.includes('shipped')) { return 'badge badge-pill badge-primary'; }
                if (s.includes('packed')) { return 'badge badge-pill badge-info'; }
                if (s.includes('cancel')) { return 'badge badge-pill badge-danger'; }
                if (s.includes('return')) { return 'badge badge-pill badge-dark'; }
                return 'badge badge-pill badge-secondary';
        }
    }

    /**
     * Return a feather icon name for a given status value.
     */
    getStatusIcon(statusValue: any): string {
        if (statusValue === null || statusValue === undefined) { return 'info'; }
        const asNum = (typeof statusValue === 'number') ? statusValue : Number(statusValue);
        const v = Number.isNaN(asNum) ? null : asNum;
        switch (v) {
            case 4: // Processing
                return 'clock';
            case 7: // Delivered
                return 'check-circle';
            case 8: // Cancelled
                return 'x-circle';
            case 9: // Returned
                return 'corner-up-left';
            default:
                const s = String(statusValue).toLowerCase();
                if (s.includes('pending')) { return 'clock'; }
                if (s.includes('paid') || s.includes('delivered')) { return 'check-circle'; }
                if (s.includes('processing') || s.includes('shipped')) { return 'truck'; }
                if (s.includes('cancel')) { return 'x-circle'; }
                if (s.includes('return')) { return 'corner-up-left'; }
                return 'info';
        }
    }
}
