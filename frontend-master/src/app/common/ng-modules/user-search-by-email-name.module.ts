import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // directive ngFor...
import { FormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { UserSearchByEmailNameComponent } from '../ng-components/user-search-by-email-name/user-search-by-email-name.component';

@NgModule({
  declarations: [
    UserSearchByEmailNameComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule
  ],
  exports: [
    UserSearchByEmailNameComponent,
  ]

})
export class UserSearchByEmailNameModule { }
