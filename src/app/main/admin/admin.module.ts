import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CoreCommonModule } from '@core/common.module';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';
import { CoreDirectivesModule } from '@core/directives/directives';

import { AdminRoutingModule } from './admin-routing.module';
import { CouponsComponent } from '../pages/coupons/coupons.component';
import { CreateCouponComponent } from '../pages/coupons/create-coupon/create-coupon.component';

@NgModule({
    declarations: [
        CouponsComponent,
        CreateCouponComponent
    ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        CoreCommonModule,
        ContentHeaderModule,
        NgbModule,
        ReactiveFormsModule,
        FormsModule,
        CoreDirectivesModule
    ]
})
export class AdminModule { }
