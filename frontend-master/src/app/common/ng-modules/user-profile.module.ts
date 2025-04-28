import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // directive ngFor...
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InputMaskModule } from '@ngneat/input-mask';

import { UserProfileComponent } from '../../application/user-profile/user-profile.component';
import { UserProfileFormComponent } from '../../common/ng-components/user-profile-form/user-profile-form.component';
import { UserPhotoInputFileComponent } from '../../application/form-elements/user-photo-input-file/user-photo-input-file.component';
import { CapitalizeNameModule } from './capitalize-name.module';

@NgModule({
  declarations: [
    UserProfileComponent,
    UserProfileFormComponent,
    UserPhotoInputFileComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    InputMaskModule,
    CapitalizeNameModule
  ],
  exports: [UserProfileComponent, UserProfileFormComponent, UserPhotoInputFileComponent]
})
export class UserProfileModule { }
