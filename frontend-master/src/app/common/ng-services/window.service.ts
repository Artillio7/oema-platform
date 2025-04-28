import { Injectable, NgZone } from '@angular/core';

@Injectable()
export class WindowService {
  constructor(private ngZone: NgZone) { }

  onresize(callback?: () => void) {
    window.onresize = (_e: any) => {
      this.ngZone.run(() => {
        if (window.innerWidth < 980) {
          if (document.querySelector('body')!.classList.contains('sidebar-mobile-show')) {
            $('.c-hamburger').removeClass('is-vertical');
          } else {
            $('.c-hamburger').addClass('is-vertical');
          }
        } else {
          if (document.querySelector('body')!.classList.contains('sidebar-hidden')) {
            $('.c-hamburger').addClass('is-vertical');
          } else {
            $('.c-hamburger').removeClass('is-vertical');
          }
        }

        if (callback) {
          callback();
        }
      });
    };
  }
}
