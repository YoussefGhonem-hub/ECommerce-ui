import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize, map, tap } from 'rxjs/operators';
import { NgxSpinnerService } from "ngx-spinner";
import { Observable } from "rxjs";
import { environment } from 'src/environments/environment';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(private http: HttpClient, private spinner: LoadingService, private loadingService: LoadingService) {
  }
  // GET request
  GET(url: string, queryParameters?: object, showLoader: boolean = false): Observable<any> {
    if (showLoader) {
      this.loadingService.show();
    }

    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);

    return this.http.get<any>(this.getFullUrl(url), {
      observe: 'response',
      params: httpParams
    }).pipe(
      map(res => res.body),
      finalize(() => {
        if (showLoader) {
        }
      })
    );
  }


  // POST request
  POST(url: string, body: any = {}, queryParameters?: object): Observable<any> {
    this.spinner.show();
    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);
    return this.http.post(this.getFullUrl(url), body, { observe: 'response', params: httpParams })
      .pipe(
        map(res => res.body),
        tap(res => this.spinner.hide())
      );
  }
  POSTURL(url: string, body: any = {}, queryParameters?: object): Observable<any> {
    this.spinner.show();
    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);
    return this.http.post(url, body, { observe: 'response', params: httpParams })
      .pipe(
        map(res => res.body),
        tap(res => this.spinner.hide())
      );
  }

  // PUT request
  PUT(url: string, body: any = {}, queryParameters?: object): Observable<any> {
    this.spinner.show();
    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);
    return this.http.put(this.getFullUrl(url), body, { observe: 'response', params: httpParams })
      .pipe(
        map(res => res.body),
        tap(res => this.spinner.hide())
      );
  }

  // PATCH request
  PATCH(url: string, body: any = {}, queryParameters?: object): Observable<any> {

    this.spinner.show();

    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);

    return this.http.patch(this.getFullUrl(url), body, { observe: 'response', params: httpParams })
      .pipe(
        map(res => res.body),
        tap(res => this.spinner.hide())
      );

  }

  // DELETE request
  DELETE(url: string, queryParameters?: object): Observable<any> {

    this.spinner.show();

    const httpParams: HttpParams = this.parameterizedUrl(queryParameters);

    return this.http.delete(this.getFullUrl(url), { observe: 'response', params: httpParams, body: {} })
      .pipe(
        map(res => res.body),
        tap(res => this.spinner.hide())
      );

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
