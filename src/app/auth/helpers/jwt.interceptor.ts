
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { AuthenticationService } from 'app/auth/service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  /**
   *
   * @param {AuthenticationService} _authenticationService
   */
  constructor(private _authenticationService: AuthenticationService) { }

  /**
   * Add auth header with jwt if user is logged in and request is to api url
   * @param request
   * @param next
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const currentUser = this._authenticationService.currentUserValue;
    const isLoggedIn = currentUser && currentUser.token;
    const isbaseURL = request.url.startsWith(environment.baseURL);
    const isRefreshRequest = request.url.includes('/auth/refresh') || request.url.includes('/Auth/Refresh');
    if (isLoggedIn && isbaseURL && !isRefreshRequest) {
      // Check token expiry
      const expiresAtUtc = localStorage.getItem('accessTokenExpiresAtUtc');
      if (expiresAtUtc && Date.parse(expiresAtUtc) < Date.now()) {
        // Token expired, refresh synchronously
        return from(this._authenticationService.refreshToken().toPromise()).pipe(
          switchMap((res: any) => {
            const refreshedUser = this._authenticationService.currentUserValue;
            const refreshedToken = refreshedUser && refreshedUser.token;
            if (refreshedToken) {
              request = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${refreshedToken}`
                }
              });
            }
            return next.handle(request);
          })
        );
      } else {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
      }
    }
    return next.handle(request);
  }
}
