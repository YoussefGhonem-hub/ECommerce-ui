import { Injectable } from '@angular/core';
import { HttpService } from '@shared/services/http.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
          if (response && response.succeeded && response.data && response.data.token) {
            // Map API response to User model
            const user = {
              id: response.data.userId, // userId from API
              email: response.data.email,
              password: '', // Not returned by API
              firstName: '', // Not returned by API
              lastName: '', // Not returned by API
              avatar: '', // Not returned by API
              role: null, // Not returned by API
              token: response.data.token
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            // Toastr handled globally by interceptor
            this.currentUserSubject.next(user);
          }
          return response;
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
  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    // notify
    this.currentUserSubject.next(null);
  }
}
