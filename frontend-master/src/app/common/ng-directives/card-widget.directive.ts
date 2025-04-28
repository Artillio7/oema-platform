import { Directive, ElementRef, OnInit } from '@angular/core';
import 'widgster';

declare let jQuery: any;

@Directive({
  selector: '[appCardWidget]'
})

export class CardWidgetDirective implements OnInit {
  $el: any;

  constructor(el: ElementRef) {
    this.$el = jQuery(el.nativeElement);
    jQuery.fn.widgster.Constructor.DEFAULTS.bodySelector = '.widget-body';

    jQuery(document).on('close.widgster', (e: Event) => {
      const $colWrap = jQuery(e.target).closest(' [class*="col-"]:not(.widget-container)');
      if (!$colWrap.find('.widget').not(e.target).length) {
        $colWrap.remove();
      }
    });

    jQuery(document).on('fullscreened.widgster', (e: Event) => {
      jQuery(e.target).find('div.widget-body').addClass('scrolling');
      jQuery('body').addClass('fullscreen-card');
    }).on('restored.widgster', (e: Event) => {
      jQuery(e.target).find('div.widget-body').removeClass('scrolling');
      jQuery('body').removeClass('fullscreen-card');
    });
  }

  ngOnInit() {
    this.$el.widgster();
  }
}
