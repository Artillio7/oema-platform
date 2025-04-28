import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CapitalizeNameModule } from './capitalize-name.module';

import { ApplicationFormViewerComponent } from '../ng-components/application-form-viewer/application-form-viewer.component';

@NgModule({
  declarations: [
    ApplicationFormViewerComponent,
  ],
  imports: [
    CommonModule,
    CapitalizeNameModule
  ],
  exports: [
    ApplicationFormViewerComponent,
  ]

})
export class ApplicationFormViewerModule { }
