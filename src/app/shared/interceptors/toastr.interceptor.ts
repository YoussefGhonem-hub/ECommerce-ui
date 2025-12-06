import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class ToastrInterceptor implements HttpInterceptor {
    constructor(private toastr: ToastrService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            tap(
                event => {
                    if (event instanceof HttpResponse) {
                        const method = request.method.toUpperCase();
                        if (event.body && typeof event.body === 'object' && 'succeeded' in event.body) {
                            // Only show success toast for PUT, POST, DELETE
                            if ((method === 'POST' || method === 'PUT' || method === 'DELETE') && event.body.succeeded) {
                                this.toastr.success('Operation successful');
                            }
                            // Always show error toast for errors/validationErrors
                            if (event.body.errors && event.body.errors.length) {
                                this.toastr.error(event.body.errors.join(', '), 'Error');
                            } else if (event.body.validationErrors) {
                                this.toastr.error('Validation error', 'Error');
                            }
                        }
                    }
                },
                error => {
                    // Always show error toast for any method
                    if (error instanceof HttpErrorResponse) {
                        if (error.error && error.error.errors && error.error.errors.length) {
                            this.toastr.error(error.error.errors.join(', '), 'Error');
                        } else if (error.error && error.error.validationErrors) {
                            this.toastr.error('Validation error', 'Error');
                        } else {
                            // this.toastr.error(error.message || 'Unknown error', 'Error');
                        }
                    }
                }
            )
        );
    }
}
