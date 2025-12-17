import { Injectable } from '@angular/core';
import { HttpService } from '@shared/services/http.service';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthController } from '@shared/Controllers/AuthController';
import { User, Role } from 'app/auth/models';
import { ToastrService } from 'ngx-toastr';
import { NgxPermissionsService } from 'ngx-permissions';
import { GuestUserService } from '@shared/services/guest-user.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  //public
  public currentUser: Observable<User>;

  //private
  private currentUserSubject: BehaviorSubject<User>;

  /**
   *
   * @param {HttpClient} _http
   * @param {ToastrService} _toastrService
   */
  constructor(
    private http: HttpService,
    private _toastrService: ToastrService,
    private permissionsService: NgxPermissionsService,
    private guestUserService: GuestUserService
  ) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
    this.setPermissionsFromToken();
  }

  /**
   * Decode JWT and set permissions
   */
  private setPermissionsFromToken() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = this.decodeJwt(token);
      if (payload && payload.roles) {
        // Check if the roles field is a string that needs to be parsed into an array
        let roles = payload.roles;
        if (typeof roles === 'string') {
          try {
            roles = JSON.parse(roles); // Parse the string to an array
          } catch (e) {
            console.error('Error parsing roles:', e);
            roles = []; // Fallback to empty array if parsing fails
          }
        }
        // Now, roles should always be an array
        this.permissionsService.loadPermissions(roles);
      } else {
        this.permissionsService.flushPermissions();
      }
    } else {
      this.permissionsService.flushPermissions();
    }
  }


  /**
   * Decode JWT payload
   */
  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // getter: currentUserValue
  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  /**
   *  Confirms if user is admin
   */
  get isAdmin() {
    return this.currentUser && this.currentUserSubject.value.role === Role.Admin;
  }

  /**
   *  Confirms if user is client
   */
  get isClient() {
    return this.currentUser && this.currentUserSubject.value.role === Role.Client;
  }


  /**
   * User login (backend expects LoginRequest)
   * @param userNameOrEmail
   * @param password
   * @param rememberMe
   */
  login(userNameOrEmail: string, password: string, rememberMe: boolean = false) {
    return this.http
      .POST(AuthController.Login, {
        userNameOrEmail,
        password,
        rememberMe
      })
      .pipe(
        map(response => {
          if (response && response.succeeded && response.data && response.data.accessToken) {
            // Decode JWT to extract role
            let role = null;
            try {
              const base64Url = response.data.accessToken.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              const payload = JSON.parse(jsonPayload);
              if (payload && payload.roles) {
                let extractedRole = null;
                if (Array.isArray(payload.roles)) {
                  extractedRole = payload.roles[0];
                } else if (typeof payload.roles === 'string') {
                  try {
                    const rolesArr = JSON.parse(payload.roles);
                    if (Array.isArray(rolesArr)) {
                      extractedRole = rolesArr[0];
                    } else {
                      extractedRole = payload.roles;
                    }
                  } catch {
                    extractedRole = payload.roles;
                  }
                }
                // Normalize to Role enum
                if (extractedRole && typeof extractedRole === 'string') {
                  if (extractedRole.toLowerCase() === 'admin') {
                    role = Role.Admin;
                  } else if (extractedRole.toLowerCase() === 'client') {
                    role = Role.Client;
                  } else if (extractedRole.toLowerCase() === 'user') {
                    role = Role.User;
                  } else {
                    role = extractedRole;
                  }
                }
              }
            } catch (e) {
              role = null;
            }
            // Store tokens and expiry
            const user = {
              id: response.data.userId, // userId from API
              email: response.data.email,
              password: '', // Not returned by API
              firstName: '', // Not returned by API
              lastName: '', // Not returned by API
              avatar: '', // Not returned by API
              role: role, // Extracted from JWT
              token: response.data.accessToken
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('accessTokenExpiresAtUtc', response.data.accessTokenExpiresAtUtc);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            localStorage.setItem('refreshTokenExpiresAtUtc', response.data.refreshTokenExpiresAtUtc);
            this.currentUserSubject.next(user);
            this.setPermissionsFromToken();
          }
          return response;
        })
      );
  }
  refreshToken() {

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return throwError('No refresh token');
    return this.http.POST(AuthController.Refresh, { refreshToken }).pipe(
      map((response: any) => {

        if (response && response.succeeded && response.data && response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('accessTokenExpiresAtUtc', response.data.accessTokenExpiresAtUtc);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('refreshTokenExpiresAtUtc', response.data.refreshTokenExpiresAtUtc);
          // Optionally update user token
          const user = JSON.parse(localStorage.getItem('currentUser'));
          if (user) {
            user.token = response.data.accessToken;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
            this.setPermissionsFromToken();
          }
        }
        return response;
      }),
      catchError(err => {
        this.logout();
        return throwError(err);
      })
    );
  }
  /**
   * User registration (backend expects RegisterRequest)
   * @param fullName
   * @param email
   * @param phoneNumber
   * @param password
   */
  register(fullName: string, email: string, phoneNumber: string, password: string) {
    return this.http
      .POST(AuthController.Register, {
        fullName,
        email,
        phoneNumber,
        password
      });
  }

  /**
   * User logout
   *
   */
  logout(reason?: string) {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    // if (accessToken && refreshToken) {
    //   // Send revoke request (fire and forget)
    //   this.http.POST(AuthController.Revoke, { refreshToken, reason }, {
    //     headers: { Authorization: `Bearer ${accessToken}` }
    //   }).subscribe(() => { });
    // }
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('accessTokenExpiresAtUtc');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refreshTokenExpiresAtUtc');

    // Remove guest ID from localStorage on logout
    this.guestUserService.clearGuestId();

    // notify
    this.currentUserSubject.next(null);
    this.permissionsService.flushPermissions();
  }
}
