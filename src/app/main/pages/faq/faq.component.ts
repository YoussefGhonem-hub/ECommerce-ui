import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HttpService } from '@shared/services/http.service';
import { FaqsController } from '@shared/Controllers/FaqsController';


@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FaqComponent implements OnInit, OnDestroy {
  // public
  public contentHeader: object;
  public data: any;
  public searchText: string;

  // private
  private _unsubscribeAll: Subject<any>;
  constructor(private httpService: HttpService) {
    this._unsubscribeAll = new Subject();
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On Changes
   */
  ngOnInit(): void {

    // content header
    this.contentHeader = {
      headerTitle: 'FAQ',
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
            name: 'FAQ',
            isLink: false
          }
        ]
      }
    };

    this.httpService.GET(FaqsController.GetFaqs)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((res: any) => {
        // Transform API response to match the template's data structure
        this.data = this.transformFaqs(res.data);
      });
  }

  private transformFaqs(categories: any[]): any {
    // Map each category to a property using its English name (lowercased, no spaces)
    const iconMap: { [key: string]: string } = {
      delivery: 'shopping-bag',
      'cancellation & return my orders': 'x-circle',
      'product & services': 'package',
      payment: 'credit-card',
      // Add more mappings as needed
    };
    const result: any = {};
    categories.forEach(cat => {
      // Create a key from the category name (camelCase, or you can use another convention)
      const key = cat.categoryNameEn
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .replace(/ +/g, ' ')
        .replace(/ (.)/g, (m, c) => c.toUpperCase())
        .replace(/^./, m => m.toLowerCase());
      result[key] = {
        icon: iconMap[cat.categoryNameEn.toLowerCase()] || 'help-circle',
        title: cat.categoryNameEn,
        subtitle: '',
        qandA: (cat.faqs || []).map(faq => ({
          question: faq.questionEn,
          ans: faq.answerEn
        }))
      };
    });
    return result;
  }
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
