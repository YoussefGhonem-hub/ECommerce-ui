import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil, first } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthenticationService } from 'app/auth/service';
import { ToastrService } from 'ngx-toastr';
import { CoreConfigService } from '@core/services/config.service';

@Component({
  selector: 'app-auth-login-v2',
  templateUrl: './auth-login-v2.component.html',
  styleUrls: ['./auth-login-v2.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthLoginV2Component implements OnInit {
  //  Public
  public coreConfig: any;
  public loginForm: FormGroup;
  public loading = false;
  public submitted = false;
  public returnUrl: string;
  public error = '';
  public registerMode = false;
  public registerForm: FormGroup;
  public registerSubmitted = false;
  public registerLoading = false;
  public passwordTextType: boolean;

  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {CoreConfigService} _coreConfigService
   */
  constructor(
    private _coreConfigService: CoreConfigService,
    private _formBuilder: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _authenticationService: AuthenticationService,
    private _toastr: ToastrService
  ) {
    // redirect to home if already logged in
    if (this._authenticationService.currentUserValue) {
      this._router.navigate(['/']);
    }

    this._unsubscribeAll = new Subject();

    // Configure the layout
    this._coreConfigService.config = {
      layout: {
        navbar: {
          hidden: true
        },
        menu: {
          hidden: true
        },
        footer: {
          hidden: true
        },
        customizer: false,
        enableLocalStorage: false
      }
    };
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Toggle password
   */
  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  /**
   * Switch to register mode
   */
  switchToRegister() {
    this.registerMode = true;
    this.error = '';
  }

  /**
   * Switch to login mode
   */
  switchToLogin() {
    this.registerMode = false;
    this.error = '';
  }

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    this.loading = true;
    this._authenticationService
      .login(this.f.email.value, this.f.password.value)
      .pipe(first())
      .subscribe(
        res => {
          if (res && res.succeeded) {
            this._router.navigate([this.returnUrl]);
          } else {
            this.error = (res && res.errors && res.errors.length) ? res.errors[0] : 'Login failed';
            this.loading = false;
          }
        },
        error => {
          this.error = error;
          this.loading = false;
        }
      );
  }

  onRegisterSubmit() {
    this.registerSubmitted = true;
    if (this.registerForm.invalid) {
      return;
    }
    this.registerLoading = true;
    this._authenticationService
      .register(
        this.registerForm.controls.fullName.value,
        this.registerForm.controls.email.value,
        this.registerForm.controls.phoneNumber.value,
        this.registerForm.controls.password.value
      )
      .pipe(first())
      .subscribe(
        res => {
          if (res && res.succeeded) {
            this._toastr.success('Registration successful! Please login.');
            this.switchToLogin();
          } else {
            this.error = (res && res.errors && res.errors.length) ? res.errors[0] : 'Registration failed';
          }
          this.registerLoading = false;
        },
        error => {
          this.error = error;
          this.registerLoading = false;
        }
      );
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    this.loginForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.registerForm = this._formBuilder.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/';
    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      this.coreConfig = config;
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
