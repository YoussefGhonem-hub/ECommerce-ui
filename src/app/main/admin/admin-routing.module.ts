import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CouponsComponent } from '../pages/coupons/coupons.component';
import { CreateCouponComponent } from '../pages/coupons/create-coupon/create-coupon.component';
import { ShippingManagementComponent } from './shipping/shipping-management.component';

const routes: Routes = [
    {
        path: 'coupons',
        component: CouponsComponent
    },
    {
        path: 'coupons/create',
        component: CreateCouponComponent
    },
    {
        path: 'coupons/edit/:id',
        component: CreateCouponComponent
    },
    {
        path: 'shipping',
        component: ShippingManagementComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
