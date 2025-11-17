import { Directive, HostListener, Input, ElementRef } from '@angular/core';

@Directive({
    selector: 'img[appDefaultImage]'
})
export class DefaultImageDirective {
    @Input('appDefaultImage') defaultImage: string;
    private readonly fallback = 'assets/images/avatars/defualt.jpg';

    constructor(private el: ElementRef<HTMLImageElement>) { }

    @HostListener('error')
    onError() {
        const element = this.el.nativeElement;
        const fallbackSrc = this.defaultImage || this.fallback;
        if (element.src !== fallbackSrc) {
            element.src = fallbackSrc;
        }
    }
}
