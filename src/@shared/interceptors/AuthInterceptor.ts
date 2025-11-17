
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { AuthenticationService } from 'app/auth/service/authentication.service';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthenticationService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const accessToken = localStorage.getItem('accessToken');
    const expiresAt = localStorage.getItem('accessTokenExpiresAtUtc');
    const now = new Date().toISOString();

    // Helper to attach token and forward request
    const handleWithToken = (token: string | null) => {
      if (token) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return next.handle(request);
    };

    // If no expiry or not expired, use current token
    if (accessToken && expiresAt && now < expiresAt) {
      return handleWithToken(accessToken);
    }

    // If expired, try to refresh
    if (accessToken && expiresAt && now >= expiresAt) {
      return from(this.authService.refreshToken().toPromise()).pipe(
        switchMap((res: any) => {
          const newToken = res && res.data && res.data.accessToken ? res.data.accessToken : null;
          return handleWithToken(newToken);
        })
      );
    }

    // If no token, just forward
    return next.handle(request);
  }
}
