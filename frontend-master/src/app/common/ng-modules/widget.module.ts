import { NgModule } from '@angular/core';

import { CardWidgetDirective } from '../ng-directives/card-widget.directive';

@NgModule({
  declarations: [
    CardWidgetDirective
  ],
  exports: [CardWidgetDirective]
})
export class WidgetModule { }
