import { Directive, Input, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[clickTooltip]'
})
export class TooltipClickDirective {
  @Input('clickTooltip') tooltipText = '';
  @Input() placement: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tooltip: HTMLElement | null = null;
  private delay = 300; // ms

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.tooltip && this.tooltipText !== '') { this.show(); }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltip) { this.hide(); }
  }

  private show() {
    this.create();
    this.setPosition();
    this.renderer.addClass(this.tooltip, 'tooltip-visible');
  }

  private hide() {
    if (this.tooltip) {
      this.renderer.removeClass(this.tooltip, 'tooltip-visible');
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = null;
    }
  }

  private create() {
    this.tooltip = this.renderer.createElement('div');
    this.renderer.appendChild(
      this.tooltip,
      this.renderer.createText(this.tooltipText)
    );

    this.renderer.addClass(this.tooltip, 'tooltip');
    this.renderer.addClass(this.tooltip, `tooltip-${this.placement}`);
    this.renderer.appendChild(document.body, this.tooltip);
  }

  private setPosition() {
    if (!this.tooltip) return;

    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltip.getBoundingClientRect();
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    let top, left;

    switch (this.placement) {
      case 'top':
        top = hostPos.top - tooltipPos.height - 10;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'bottom':
        top = hostPos.bottom + 10;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'left':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.left - tooltipPos.width - 10;
        break;
      case 'right':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.right + 10;
        break;
    }

    this.renderer.setStyle(this.tooltip, 'top', `${top + scrollPos}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  }
}
