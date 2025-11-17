/**
 * Reset Avatar Image
 */

import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FlatpickrOptions } from 'ng2-flatpickr';
import { AccountSettingsService } from 'app/main/pages/account-settings/account-settings.service';
@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
  // public
  public contentHeader: object;
  public data: any;
  public generalForm: FormGroup;
  public avatarFile: File | null = null;
  public passwordForm: FormGroup;
  public socialForm: FormGroup;
  public birthDateOptions: FlatpickrOptions = {
    altInput: true
  };
  public passwordTextTypeOld = false;
  public passwordTextTypeNew = false;
  public passwordTextTypeRetype = false;
  public avatarImage: string;

  // private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {AccountSettingsService} _accountSettingsService
   */
  constructor(private _accountSettingsService: AccountSettingsService, private fb: FormBuilder) {
    this._unsubscribeAll = new Subject();
    this.generalForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      avatar: [null]
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

    this.socialForm = this.fb.group({
      facebookUrl: [''],
      googleUrl: [''],
      xUrl: [''],
      instagramUrl: [''],
      linkedInUrl: [''],
      gitHubUrl: [''],
      youTubeUrl: [''],
      tikTokUrl: [''],
      websiteUrl: [''],
      telegramUrl: [''],
      whatsAppUrl: ['']
    });

  }
  onPasswordSubmit() {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    this._accountSettingsService.changePassword({
      currentPassword,
      newPassword,
      confirmPassword
    }).then(() => {
      this.passwordForm.reset();
    });
  }
  // Public Methods
  // -----------------------------------------------------------------------------------------------------
  resetAvatarImage() {
    this.avatarImage = '';
    this.avatarFile = null;
  }
  /**
   * Toggle Password Text Type Old
   */
  togglePasswordTextTypeOld() {
    this.passwordTextTypeOld = !this.passwordTextTypeOld;
  }

  /**
   * Toggle Password Text Type New
   */
  togglePasswordTextTypeNew() {
    this.passwordTextTypeNew = !this.passwordTextTypeNew;
  }

  /**
   * Toggle Password Text Type Retype
   */
  togglePasswordTextTypeRetype() {
    this.passwordTextTypeRetype = !this.passwordTextTypeRetype;
  }

  /**
   * Upload Image
   *
   * @param event
   */
  uploadImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.avatarFile = file;
      let reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onGeneralSubmit() {
    if (this.generalForm.invalid) return;
    const { fullName, email } = this.generalForm.value;
    this._accountSettingsService.updateAccountSettings({
      fullName,
      email,
      avatar: this.avatarFile
    }).then((response) => {
      // Update avatar in localStorage and Navbar
      if (response && response.succeeded && response.data && response.data.avatarUrl) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
          user.avatar = response.data.avatarUrl;
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      }
      this._accountSettingsService.getDataTableRows();
    });
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit() {
    this._accountSettingsService.onSettingsChanged.pipe(takeUntil(this._unsubscribeAll)).subscribe(response => {
      this.data = response;
      if (this.data && this.data.accountSetting && this.data.accountSetting.general) {
        this.generalForm.patchValue({
          fullName: this.data.accountSetting.general.fullName || '',
          email: this.data.accountSetting.general.email || ''
        });
        this.avatarImage = this.data.accountSetting.general.avatar;
      }
    });
    // Load social profiles
    this._accountSettingsService.getSocialProfiles().then((profile) => {
      if (profile && profile.data) {
        this.socialForm.patchValue({
          facebookUrl: profile.data.facebookUrl || '',
          googleUrl: profile.data.googleUrl || '',
          xUrl: profile.data.xUrl || '',
          instagramUrl: profile.data.instagramUrl || '',
          linkedInUrl: profile.data.linkedInUrl || '',
          gitHubUrl: profile.data.gitHubUrl || '',
          youTubeUrl: profile.data.youTubeUrl || '',
          tikTokUrl: profile.data.tikTokUrl || '',
          websiteUrl: profile.data.websiteUrl || '',
          telegramUrl: profile.data.telegramUrl || '',
          whatsAppUrl: profile.data.whatsAppUrl || ''
        });
      }
    });
    // content header
    this.contentHeader = {
      headerTitle: 'Account Settings',
      actionButton: true,
      breadcrumb: {
        type: '',
        links: [
          {
            name: 'Home',
            isLink: true,
            link: '/'
          },
          {
            name: 'Pages',
            isLink: true,
            link: '/'
          },
          {
            name: 'Account Settings',
            isLink: false
          }
        ]
      }
    };
  }
  onSocialSubmit() {
    if (this.socialForm.invalid) return;
    this._accountSettingsService.updateSocialProfiles(this.socialForm.value).then(() => {
      // Optionally show a success message or refresh data
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
