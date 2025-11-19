import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FAQService } from 'app/main/pages/faq/faq.service';
// Removed HttpClient import, using HttpService only
import { FaqsController } from '@shared/Controllers/FaqsController';
import { HttpService } from '@shared/services/http.service';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FaqComponent implements OnInit {
  // public
  public contentHeader: object;
  public data: any;
  public searchText: string;

  // private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {FAQService} _faqService
   */
  constructor(private _faqService: FAQService, private http: HttpService) {
    this._unsubscribeAll = new Subject();
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On Changes
   */
  ngOnInit(): void {
    // Fetch FAQ data from API using FaqsController
    this.http.GET(FaqsController.GetFaqs).subscribe((response: any) => {
      // Handle API response with 'data' property
      const faqs = ((response && response.data) || [])
        .filter(faq => faq.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(faq => ({
          id: faq.id,
          question: faq.questionEn,
          answer: faq.answerEn
        }));
      this.data = faqs;
    });

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
  }

}
