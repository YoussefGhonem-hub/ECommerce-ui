import { Injectable } from '@angular/core';
import { HttpService } from '@shared/services/http.service';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthController } from '@shared/Controllers/AuthController';
import { User, Role } from 'app/auth/models';
import { ToastrService } from 'ngx-toastr';

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
  constructor(private http: HttpService, private _toastrService: ToastrService) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
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
            // Store tokens and expiry
            const user = {
              id: response.data.userId, // userId from API
              email: response.data.email,
              password: '', // Not returned by API
              firstName: '', // Not returned by API
              lastName: '', // Not returned by API
              avatar: '', // Not returned by API
              role: null, // Not returned by API
              token: response.data.accessToken
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('accessTokenExpiresAtUtc', response.data.accessTokenExpiresAtUtc);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            localStorage.setItem('refreshTokenExpiresAtUtc', response.data.refreshTokenExpiresAtUtc);
            this.currentUserSubject.next(user);
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
    if (accessToken && refreshToken) {
      // Send revoke request (fire and forget)
      this.http.POST(AuthController.Revoke, { refreshToken, reason }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).subscribe(() => { });
    }
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('accessTokenExpiresAtUtc');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refreshTokenExpiresAtUtc');
    // notify
    this.currentUserSubject.next(null);
  }
}
