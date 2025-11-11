import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private _isLoading = new Subject<boolean>();

  isLoading$ = this._isLoading.asObservable();

  show() {
    this._isLoading.next(true);
  }



  hide() {
    this._isLoading.next(false);
  }
}
