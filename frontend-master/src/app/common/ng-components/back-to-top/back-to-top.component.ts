import { Component, AfterViewInit, HostListener, Input, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-back-top',
  styleUrls: ['./back-to-top.component.scss'],
  template: `
    <i #backTop class="fa fa-angle-up back-to-top" title="Back to Top"></i>
  `
})
export class BackToTopComponent implements AfterViewInit {

  @Input() position = 400;
  @Input() showSpeed = 500;
  @Input() moveSpeed = 1000;

  @ViewChild('backTop') private _selector!: ElementRef;

  ngAfterViewInit(): void {
    this._onWindowScroll();
  }

  @HostListener('click')
  _onClick(): boolean {
    jQuery('html, body').animate({ scrollTop: 0 }, { duration: this.moveSpeed });
    return false;
  }

  @HostListener('window:scroll')
  _onWindowScroll(): void {
    const el = this._selector.nativeElement;
    window.scrollY > this.position ? jQuery(el).fadeIn(this.showSpeed) : jQuery(el).fadeOut(this.showSpeed);
  }
}
