import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable()
export class BaseUrlInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Only prepend base URL if the request URL doesn't already include a protocol (http:// or https://)
        if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
            const apiReq = request.clone({
                url: `${environment.baseURL}/${request.url}`
            });
            return next.handle(apiReq);
        }

        return next.handle(request);
    }
}
