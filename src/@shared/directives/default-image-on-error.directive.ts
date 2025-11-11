import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[default-image]',
})
export class DefaultImageOnErrorDirective {
  @HostListener('error', ['$event'])
  public onError(event: any): void {
    event.srcElement.style.display = 'none';
  }
}
