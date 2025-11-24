import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import { CoreConfigService } from '@core/services/config.service';
import { CoreTranslationService } from '@core/services/translation.service';

import { User } from 'app/auth/models';
import { colors } from 'app/colors.const';
import { AuthenticationService } from 'app/auth/service';
import { HttpService } from '@shared/services/http.service';

import { locale as english } from 'app/main/dashboard/i18n/en';
import { locale as french } from 'app/main/dashboard/i18n/fr';
import { locale as german } from 'app/main/dashboard/i18n/de';
import { locale as portuguese } from 'app/main/dashboard/i18n/pt';
import { DashboardController } from '@shared/Controllers/DashboardController';

@Component({
  selector: 'app-ecommerce',
  templateUrl: './ecommerce.component.html',
  styleUrls: ['./ecommerce.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EcommerceComponent implements OnInit {
  // Decorator
  @ViewChild('statisticsBarChartRef') statisticsBarChartRef: any;
  @ViewChild('statisticsLineChartRef') statisticsLineChartRef: any;
  @ViewChild('earningChartRef') earningChartRef: any;
  @ViewChild('revenueReportChartRef') revenueReportChartRef: any;
  @ViewChild('budgetChartRef') budgetChartRef: any;
  @ViewChild('statePrimaryChartRef') statePrimaryChartRef: any;
  @ViewChild('stateWarningChartRef') stateWarningChartRef: any;
  @ViewChild('stateSecondaryChartRef') stateSecondaryChartRef: any;
  @ViewChild('stateInfoChartRef') stateInfoChartRef: any;
  @ViewChild('stateDangerChartRef') stateDangerChartRef: any;
  @ViewChild('goalChartRef') goalChartRef: any;

  // Public
  public data: any;
  public currentUser: User;
  public isAdmin: boolean;
  public isClient: boolean;
  public statisticsBar;
  public statisticsLine;
  public revenueReportChartoptions;
  public budgetChartoptions;
  public goalChartoptions;
  public statePrimaryChartoptions;
  public stateWarningChartoptions;
  public stateSecondaryChartoptions;
  public stateInfoChartoptions;
  public stateDangerChartoptions;
  public earningChartoptions;
  public isMenuToggled = false;

  // Private
  private $barColor = '#f3f3f3';
  private $trackBgColor = '#EBEBEB';
  private $textMutedColor = '#b9b9c3';
  private $budgetStrokeColor2 = '#dcdae3';
  private $goalStrokeColor2 = '#51e5a8';
  private $textHeadingColor = '#5e5873';
  private $strokeColor = '#ebe9f1';
  private $earningsStrokeColor2 = '#28c76f66';
  private $earningsStrokeColor3 = '#28c76f33';

  /**
   * Constructor
   * @param {AuthenticationService} _authenticationService
   * @param {DashboardService} _dashboardService
   * @param {CoreConfigService} _coreConfigService
   * @param {CoreTranslationService} _coreTranslationService
   */
  constructor(
    private _authenticationService: AuthenticationService,
    private httpService: HttpService,
    private _coreConfigService: CoreConfigService,
    private _coreTranslationService: CoreTranslationService
  ) {
    this._authenticationService.currentUser.subscribe(x => (this.currentUser = x));
    this.isAdmin = this._authenticationService.isAdmin;
    this.isClient = this._authenticationService.isClient;

    this._coreTranslationService.translate(english, french, german, portuguese);

    // Initialize minimal data model so template bindings never read undefined
    this.data = this.data || {
      revenueReport: {
        // ensure we provide series objects so apex doesn't read series[0].data when empty
        earningExpenseChart: { series: [{ name: 'Earning', data: [] }, { name: 'Expense', data: [] }] },
        budgetChart: { series: [] },
        analyticsData: { currentBudget: 0, totalBudget: 0 },
        totals: { earningTotal: 0, expenseTotal: 0 },
        currency: null,
        year: null,
        month: null
      },
      ordersChart: { series: [{ name: 'Orders', data: [] }], analyticsData: { orders: 0 } },
      profitChart: { series: [{ name: 'Profit', data: [] }], analyticsData: { profit: 0 } },
      earning: { thisMonthTotal: 0, lastMonthTotal: 0, percentChange: 0 }
    };

    // Earnings Chart
    this.earningChartoptions = {
      chart: {
        type: 'donut',
        height: 120,
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      series: [53, 16, 31],
      legend: { show: false },
      comparedResult: [2, -3, 8],
      labels: ['App', 'Service', 'Product'],
      stroke: { width: 0 },
      colors: [this.$earningsStrokeColor2, this.$earningsStrokeColor3, colors.solid.success],
      grid: {
        padding: {
          right: -20,
          bottom: -8,
          left: -20
        }
      },
      plotOptions: {
        pie: {
          startAngle: -10,
          donut: {
            labels: {
              show: true,
              name: {
                offsetY: 15
              },
              value: {
                offsetY: -15,
                formatter: function (val) {
                  return parseInt(val) + '%';
                }
              },
              total: {
                show: true,
                offsetY: 15,
                label: 'App',
                formatter: function (w) {
                  return '53%';
                }
              }
            }
          }
        }
      },
      responsive: [
        {
          breakpoint: 1325,
          options: {
            chart: {
              height: 100
            }
          }
        },
        {
          breakpoint: 1200,
          options: {
            chart: {
              height: 120
            }
          }
        },
        {
          breakpoint: 1065,
          options: {
            chart: {
              height: 100
            }
          }
        },
        {
          breakpoint: 992,
          options: {
            chart: {
              height: 120
            }
          }
        }
      ]
    };

    // Default statistics chart options to avoid template binding errors
    this.statisticsBar = {
      chart: { height: 70, width: undefined, type: 'bar', stacked: true, toolbar: { show: false } },
      tooltip: {},
      colors: [this.$barColor],
      dataLabels: { enabled: false },
      grid: {},
      plotOptions: { bar: { columnWidth: '45%' } },
      xaxis: {},
      yaxis: {},
      stroke: {},
      markers: {}
    };

    this.statisticsLine = {
      chart: { height: 70, width: undefined, type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
      tooltip: {},
      colors: [colors.solid.primary],
      dataLabels: { enabled: false },
      grid: {},
      plotOptions: {},
      xaxis: {},
      yaxis: {},
      stroke: { curve: 'smooth' },
      markers: { size: 0 }
    };

    // Default revenue / budget / goal chart options to avoid undefined access
    this.revenueReportChartoptions = {
      chart: {
        type: 'line',
        height: 350,
        toolbar: { show: false },
        zoom: { enabled: false },
        width: undefined
      },
      // provide default series objects so apex internals find arrays to read
      series: [{ name: 'Earning', data: [] }, { name: 'Expense', data: [] }],
      stroke: { curve: 'smooth' },
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (val: any) => val } },
      colors: [colors.solid.info, colors.solid.warning],
      legend: { position: 'top' },
      grid: { borderColor: this.$strokeColor },
      tooltip: { shared: true },
      plotOptions: {},
      dataLabels: { enabled: false }
    };

    this.budgetChartoptions = this.budgetChartoptions || {
      chart: { type: 'bar', height: 120, toolbar: { show: false }, width: undefined },
      series: [],
      xaxis: { categories: [] },
      plotOptions: {},
      dataLabels: { enabled: false },
      colors: [colors.solid.success]
    };

    this.goalChartoptions = this.goalChartoptions || {
      chart: { type: 'radialBar', height: 120, toolbar: { show: false }, width: undefined },
      series: [],
      plotOptions: {},
      dataLabels: { enabled: false },
      colors: [this.$goalStrokeColor2]
    };
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // get the currentUser details from localStorage
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Load dashboard stats directly
    this.loadDashboardStats();

    // Load revenue report with current filter defaults
    this.loadRevenueReport(this.revenueFilter.start, this.revenueFilter.end, this.revenueFilter.granularity, this.revenueFilter.currency);
  }

  /**
   * Load dashboard stats directly using HttpService
   */
  loadDashboardStats(): void {
    this.httpService.GET(DashboardController.GetStats).subscribe({
      next: (response: any) => {
        const stats = (response && response.data) ? response.data : (response || {});
        this.data = {
          statistics: {
            analyticsData: {
              sales: stats.totalOrders ?? stats.TotalOrders ?? 0,
              customers: stats.totalUsers ?? stats.TotalUsers ?? 0,
              products: stats.totalProducts ?? stats.TotalProducts ?? 0,
              revenue: stats.totalRevenue ?? stats.TotalRevenue ?? 0
            }
          },
          topProducts: (stats.topProducts || stats.TopProducts || []).map((p: any) => ({
            id: p.productId || p.ProductId,
            nameEn: p.nameEn || p.NameEn || p.name || '',
            nameAr: p.nameAr || p.NameAr || '',
            ordersCount: p.ordersCount || p.OrdersCount || 0
          })),
          lowStockProducts: (stats.lowStockProducts || stats.LowStockProducts || []).map((p: any) => ({
            id: p.productId || p.ProductId,
            nameEn: p.nameEn || p.NameEn || p.name || '',
            nameAr: p.nameAr || p.NameAr || '',
            stockQuantity: p.stockQuantity || p.StockQuantity || 0
          })),
          ordersChart: { analyticsData: { orders: stats.totalOrders ?? stats.TotalOrders ?? 0 }, series: [] },
          profitChart: { analyticsData: { profit: 0 }, series: [] },
          revenueReport: { analyticsData: { currentBudget: 0, totalBudget: 0 }, earningExpenseChart: { series: [] }, budgetChart: { series: [] } },
          goalOverview: { analyticsData: { completed: 0, inProgress: 0 }, series: [] }
        };
      },
      error: (err: any) => {
        console.error('[Ecommerce] Failed to load dashboard stats', err);
      }
    });

    // Load earnings donut data and populate the earnings chart
    this.httpService.GET(DashboardController.GetEarningsDonut).subscribe({
      next: (resp: any) => {
        const dto = (resp && resp.data) ? resp.data : (resp || {});
        // series and labels expected by ApexCharts
        this.earningChartoptions.series = Array.isArray(dto.series) ? dto.series : (dto.Series || []);
        this.earningChartoptions.labels = Array.isArray(dto.labels) ? dto.labels : (dto.Labels || []);

        // expose summary numbers for template usage
        if (!this.data) this.data = {};
        this.data.earning = {
          thisMonthTotal: dto.thisMonthTotal ?? dto.ThisMonthTotal ?? 0,
          lastMonthTotal: dto.lastMonthTotal ?? dto.LastMonthTotal ?? 0,
          percentChange: dto.percentChange ?? dto.PercentChange ?? 0
        };
      },
      error: (err: any) => {
        console.error('[Ecommerce] Failed to load earnings donut', err);
      }
    });
  }

  // revenue filter state bound to template
  revenueFilter: { start?: string | null; end?: string | null; granularity: string; currency?: string | null } = {
    start: null,
    end: null,
    granularity: 'month',
    currency: null
  };

  applyRevenueFilters(): void {
    this.loadRevenueReport(this.revenueFilter.start, this.revenueFilter.end, this.revenueFilter.granularity, this.revenueFilter.currency);
  }

  loadRevenueReport(start?: string | null, end?: string | null, granularity = 'month', currency?: string | null): void {
    const params: any = {};
    if (start) params.start = start;
    if (end) params.end = end;
    if (granularity) params.granularity = granularity;
    if (currency) params.currency = currency;

    this.httpService.GET(DashboardController.GetRevenueReport, params).subscribe({
      next: (resp: any) => {
        const dto = (resp && resp.data) ? resp.data : (resp || {});
        this.data = this.data || {};
        this.data.revenueReport = this.data.revenueReport || {};
        this.data.revenueReport.earningExpenseChart = this.data.revenueReport.earningExpenseChart || {};
        this.data.revenueReport.earningExpenseChart.series = Array.isArray(dto.series)
          ? dto.series.map((s: any) => ({ name: s.name, data: s.data }))
          : (dto.Series || []);

        // Build mapped series from API
        const mappedSeries = Array.isArray(dto.series) ? dto.series.map((s: any) => ({ name: s.name, data: s.data })) : (dto.Series || []);

        // set series on the data model used by template
        this.data.revenueReport.earningExpenseChart.series = mappedSeries;

        // Replace the chart options object with a new reference so ApexCharts picks up changes (categories/series)
        const current = this.revenueReportChartoptions || {};
        const currentXaxis = (current.xaxis || {});
        this.revenueReportChartoptions = {
          ...current,
          // ensure series is present as a fresh array reference
          series: mappedSeries,
          xaxis: {
            ...currentXaxis,
            type: 'category',
            categories: dto.labels || dto.Labels || []
          }
        };

        // If the API returned budget/goal series, propagate them to options too
        const budgetSeries = dto.budgetChart?.series || dto.BudgetChart?.series || (dto.budgetSeries || dto.BudgetSeries) || (this.data.revenueReport.budgetChart?.series || []);
        this.data.revenueReport.budgetChart = this.data.revenueReport.budgetChart || {};
        this.data.revenueReport.budgetChart.series = Array.isArray(budgetSeries) ? budgetSeries : this.data.revenueReport.budgetChart.series || [];
        this.budgetChartoptions = this.budgetChartoptions || {};
        this.budgetChartoptions.series = this.budgetChartoptions.series || this.data.revenueReport.budgetChart.series;

        // Goal chart (if provided)
        const goalSeries = dto.goalSeries || dto.GoalSeries || this.data.goalOverview?.series || [];
        this.goalChartoptions = this.goalChartoptions || {};
        this.goalChartoptions.series = this.goalChartoptions.series || goalSeries;

        // Record year/month if present
        this.data.revenueReport.year = dto.year || dto.Year || this.data.revenueReport.year;
        this.data.revenueReport.month = dto.month || dto.Month || this.data.revenueReport.month;

        this.data.revenueReport.analyticsData = dto.analyticsData || dto.AnalyticsData || this.data.revenueReport.analyticsData || { currentBudget: 0, totalBudget: 0 };
        this.data.revenueReport.totals = dto.totals || dto.Totals || this.data.revenueReport.totals || { earningTotal: 0, expenseTotal: 0 };
        this.data.revenueReport.currency = dto.currency || dto.Currency || this.data.revenueReport.currency || null;
      },
      error: (err: any) => {
        console.error('[Ecommerce] Failed to load revenue report', err);
      }
    });
  }

  /**
   * After View Init
   */
  ngAfterViewInit() {
    // Subscribe to core config changes
    this._coreConfigService.getConfig().subscribe(config => {
      // If Menu Collapsed Changes
      if (
        (config.layout.menu.collapsed === true || config.layout.menu.collapsed === false) &&
        localStorage.getItem('currentUser')
      ) {
        setTimeout(() => {
          if (this.currentUser.role == 'Admin') {
            // Get Dynamic Width for Charts
            this.isMenuToggled = true;
            this.statisticsBar.chart.width = this.statisticsBarChartRef?.nativeElement.offsetWidth;
            this.statisticsLine.chart.width = this.statisticsLineChartRef?.nativeElement.offsetWidth;
            this.earningChartoptions.chart.width = this.earningChartRef?.nativeElement.offsetWidth;
            this.revenueReportChartoptions.chart.width = this.revenueReportChartRef?.nativeElement.offsetWidth;
            this.budgetChartoptions.chart.width = this.budgetChartRef?.nativeElement.offsetWidth;
            this.goalChartoptions.chart.width = this.goalChartRef?.nativeElement.offsetWidth;
          }
        }, 500);
      }
    });
  }
}
