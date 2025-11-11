import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RankYearService {
  private lastYearSubject = new BehaviorSubject<string>(''); // BehaviorSubject to store the last year
  lastYear$ = this.lastYearSubject.asObservable(); // Expose as Observable for subscribers

  constructor() { }

  // Get last year from a list of years
  getLastYear(categories: string[]): string {
    const years = categories
      .map((year) => parseInt(year, 10))
      .filter((year) => !isNaN(year))
      .sort((a, b) => b - a); // Sort in descending order

    const lastYear = years.length > 0 ? years[0].toString() : 'N/A';
    this.lastYearSubject.next(lastYear); // Update the last year
    return lastYear;
  }
}

// this.sharedService.lastYear$.subscribe((year) => {
//   this.lastYear = year;
//    //console.log('Last Year Received:', this.lastYear);
// });
