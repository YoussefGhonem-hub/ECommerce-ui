import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GuestUserService } from '@shared/services/guest-user.service';

@Injectable()
export class GuestUserInterceptor implements HttpInterceptor {
    constructor(private guestUserService: GuestUserService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        try {

            const guestId = this.guestUserService.getGuestId();

            // Do not overwrite if header already present
            if (req.headers.has('X-Guest-UserId')) {
                return next.handle(req);
            }

            const modified = req.clone({ setHeaders: { 'X-Guest-UserId': guestId } });
            return next.handle(modified);
        } catch (e) {
            return next.handle(req);
        }
    }
}
