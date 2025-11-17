import { HttpService } from '@shared/services/http.service';
import { AccountController } from '@shared/Controllers/AccountController';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class AccountSettingsService implements Resolve<any> {
  rows: any;
  onSettingsChanged: BehaviorSubject<any>;

  /**
   * Constructor
   *
   * @param {HttpClient} _httpClient
   */
  constructor(private httpService: HttpService) {
    // Set the defaults
    this.onSettingsChanged = new BehaviorSubject({});
  }

  /**
   * Resolver
   *
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.getDataTableRows()]).then(() => {
        resolve();
      }, reject);
    });
  }

  /**
   * Get rows
   */
  getDataTableRows(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpService.GET(AccountController.GetProfile).subscribe((response: any) => {
        // Map API response to expected structure for the general tab
        if (response && response.succeeded && response.data) {
          this.rows = {
            accountSetting: {
              general: {
                id: response.data.id,
                fullName: response.data.fullName,
                email: response.data.email,
                avatar: response.data.avatarUrl
              }
            }
          };
        } else {
          this.rows = {};
        }
        this.onSettingsChanged.next(this.rows);
        resolve(this.rows);
      }, reject);
    });
  }

  updateAccountSettings(data: { fullName: string; email: string; avatar?: File | null }): Promise<any> {
    // Use FormData for avatar upload
    const formData = new FormData();
    formData.append('FullName', data.fullName);
    formData.append('Email', data.email);
    if (data.avatar) {
      formData.append('Avatar', data.avatar);
    }
    return new Promise((resolve, reject) => {
      this.httpService.POST(AccountController.UpdateAccountSettings, formData).subscribe((response: any) => {
        resolve(response);
      }, reject);
    });
  }
}
