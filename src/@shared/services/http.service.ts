import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { finalize, map, tap } from 'rxjs/operators';
import { Observable } from "rxjs";
import { LoadingService } from './loading.service';
import { CoreLoadingScreenService } from '@core/services/loading-screen.service';
import { environment } from 'environments/environment';
import { GuestUserService } from './guest-user.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(
    private http: HttpClient,
    private coreLoadingScreenService: CoreLoadingScreenService
    , private guestUserService: GuestUserService
  ) {
  }
  // GET request
  GET(url: string, queryParameters?: object, showLoader: boolean = true): Observable<any> {
    if (showLoader) {
      this.coreLoadingScreenService.show();
    }

    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);

    const headers = this.buildGuestHeadersIfNeeded();

    return this.http.get<any>(this.getFullUrl(url), {
      observe: 'response',
      params: httpParams,
      headers
    }).pipe(
      map(res => res.body),
      finalize(() => {
        if (showLoader) {
          this.coreLoadingScreenService.hide();
        }
      })
    );
  }


  // POST request
  POST(url: string, body: any = {}, queryParameters?: object): Observable<any> {
    this.coreLoadingScreenService.show();
    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);
    const headers = this.buildGuestHeadersIfNeeded();
    return this.http.post(this.getFullUrl(url), body, { observe: 'response', params: httpParams, headers })
      .pipe(
        map(res => res.body),
        finalize(() => this.coreLoadingScreenService.hide())
      );
  }
  POSTURL(url: string, body: any = {}, queryParameters?: object): Observable<any> {
    this.coreLoadingScreenService.show();
    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);
    const headers = this.buildGuestHeadersIfNeeded();
    return this.http.post(url, body, { observe: 'response', params: httpParams, headers })
      .pipe(
        map(res => res.body),
        finalize(() => this.coreLoadingScreenService.hide())
      );
  }

  // PUT request
  PUT(url: string, body: any = {}, queryParameters?: object): Observable<any> {
    this.coreLoadingScreenService.show();
    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);
    const headers = this.buildGuestHeadersIfNeeded();
    return this.http.put(this.getFullUrl(url), body, { observe: 'response', params: httpParams, headers })
      .pipe(
        map(res => res.body),
        finalize(() => this.coreLoadingScreenService.hide())
      );
  }

  // PATCH request
  PATCH(url: string, body: any = {}, queryParameters?: object): Observable<any> {
    this.coreLoadingScreenService.show();
    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);
    const headers = this.buildGuestHeadersIfNeeded();
    return this.http.patch(this.getFullUrl(url), body, { observe: 'response', params: httpParams, headers })
      .pipe(
        map(res => res.body),
        finalize(() => this.coreLoadingScreenService.hide())
      );
  }

  // DELETE request
  DELETE(url: string, queryParameters?: object): Observable<any> {
    this.coreLoadingScreenService.show();
    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);
    const headers = this.buildGuestHeadersIfNeeded();
    return this.http.delete(this.getFullUrl(url), { observe: 'response', params: httpParams, body: {}, headers })
      .pipe(
        map(res => res.body),
        finalize(() => this.coreLoadingScreenService.hide())
      );
  }

  /**
   * If there is no logged in user, include guest id header.
   */
  private buildGuestHeadersIfNeeded(): HttpHeaders | undefined {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) return undefined;

      const guestId = this.guestUserService.getGuestId();
      return new HttpHeaders({ 'X-Guest-UserId': guestId });
    } catch (e) {
      return undefined;
    }
  }


  //#region Helper Methods

  private getFullUrl(uri: string): string {
    return `${environment.baseURL}/${uri}`;
  }


  private jsonToFormData(data: any) {
    const formData = new FormData();

    this.buildFormData(formData, data);

    return formData;
  }

  private parameterizedUrl(queryParameters?: any): HttpParams {
    if (!queryParameters) return new HttpParams();

    let httpParams: HttpParams = new HttpParams();

    const keyValues: any[] = Object.keys(queryParameters)
      .map(key => {
        return {
          key: key,
          value: queryParameters[key]
        }
      })
      .filter(x => x.value != null);

    keyValues.forEach(keyValue => {

      if (Array.isArray(keyValue.value)) { // In-case you pass array

        // ...?Frequencies=1&Frequencies=2&Frequencies=3
        keyValue.value.forEach((x: any) => httpParams = httpParams.append(keyValue.key, x));

      } else if (Object.prototype.toString.call(keyValue.value) === '[object Date]') {

        httpParams = httpParams.append(keyValue.key, new Date(keyValue.value).toISOString());

      } else if (typeof keyValue.value === 'object') {

        Object.keys(keyValue.value).forEach(x => httpParams = httpParams.append(x, keyValue.value[x]));

      } else {

        httpParams = httpParams.append(keyValue.key, keyValue.value);

      }

    });

    return httpParams;
  }

  private buildFormData(formData: any, data: any, parentKey?: any) {
    if (data && typeof data === 'object' && !(data instanceof Date) && !(data instanceof File)) {
      Object.keys(data).forEach(key => {
        this.buildFormData(formData, data[key], parentKey ? `${parentKey}[${key}]` : key);
      });
    } else {
      const value = data == null ? '' : data;

      formData.append(parentKey, value);
    }
  }


  //#endregion
}
