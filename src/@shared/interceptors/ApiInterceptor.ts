import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private ongoingRequests = new Map<string, Subject<HttpEvent<any>>>();
  constructor(private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Allow only GET requests for deduplication; modify if needed
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    const requestKey = req.urlWithParams;

    // Check if there's an ongoing request for this URL
    if (this.ongoingRequests.has(requestKey)) {
      // If a duplicate request is detected, return the existing Subject as an Observable
      return this.ongoingRequests.get(requestKey)!.asObservable();
    }

    // Create a new Subject to manage the API response
    const requestSubject = new Subject<HttpEvent<any>>();
    this.ongoingRequests.set(requestKey, requestSubject);

    // Handle the request
    next.handle(req)
      .pipe(
        catchError((error) => {
          // Handle 403 Forbidden error
          if (error instanceof HttpErrorResponse && error.status === 403) {
            console.warn('403 Forbidden error detected. Clearing local storage...');
            localStorage.clear();
            location.reload()

          }
          return throwError(() => error);
        }),
        finalize(() => {
          // When the request completes, remove it from the map and complete the Subject
          this.ongoingRequests.get(requestKey)?.complete();
          this.ongoingRequests.delete(requestKey);
        })
      )
      .subscribe(
        (event) => {
          // Emit the response event to all subscribers
          requestSubject.next(event);
        },
        (error) => {
          // Emit the error and complete the Subject
          requestSubject.error(error);
        }
      );

    // Return the Subject as an Observable
    return requestSubject.asObservable();
  }
}
