import { NgModule } from '@angular/core';

import { CapitalizeNamePipe } from '../ng-pipes/capitalize-name.pipe';

@NgModule({
  declarations: [
    CapitalizeNamePipe
  ],
  exports: [
    CapitalizeNamePipe
  ]
})
export class CapitalizeNameModule { }
