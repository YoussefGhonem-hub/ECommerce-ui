import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private loadingService: LoadingService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const shouldSkipLoader = req.url.includes('noloader');
    ;
    // If "noloader" exists in the URL, strip it from the URL
    const modifiedUrl = req.url.replace('/noloader', '');
    const modifiedReq = shouldSkipLoader
      ? req.clone({ url: modifiedUrl })
      : req;

    if (!shouldSkipLoader) {
      this.activeRequests++;
      if (this.activeRequests === 1) {
        this.loadingService.show();
      }
    }

    return next.handle(modifiedReq).pipe(
      finalize(() => {
        if (!shouldSkipLoader) {
          this.activeRequests--;
          if (this.activeRequests === 0) {
            this.loadingService.hide();
          }
        }
      })
    );
  }
}
