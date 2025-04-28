import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // directive ngFor...
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CKEditorModule } from 'ng2-ckeditor';

import { WidgetModule } from '../common/ng-modules/widget.module';
import { UserProfileModule } from '../common/ng-modules/user-profile.module';
import { ApplicationFormViewerModule } from '../common/ng-modules/application-form-viewer.module';
import { UserSearchByEmailNameModule } from '../common/ng-modules/user-search-by-email-name.module';

import { WelcomeComponent } from './welcome/welcome.component';
import { BeforeStartingComponent } from './before-starting/before-starting.component';
import { FormWizardComponent } from './form-wizard/form-wizard.component';
import { AppFormHistoryComponent } from './app-form-history/app-form-history.component';

import { ApplicationFormDeletionComponent } from '../common/ng-components/modal-application-form-deletion/application-form-deletion.component';

import { InputTextComponent } from './form-elements/input-text/input-text.component';
import { InputFileComponent } from './form-elements/input-file/input-file.component';
import { DropzoneComponent } from './form-elements/dropzone/dropzone.component';
import { TextareaComponent } from './form-elements/textarea/textarea.component';
import { BatteryLevelsComponent } from './form-elements/battery-levels/battery-levels.component';
import { InputCheckboxesComponent } from './form-elements/input-checkboxes/input-checkboxes.component';
import { InputRadioComponent } from './form-elements/input-radio/input-radio.component';
import { SelectComponent } from './form-elements/select/select.component';
import { MixArrayComponent } from './form-elements/mix-array/mix-array.component';
import { UnknownFormElementComponent } from './form-elements/unknown/unknown-form-element.component';

import { ApplicationRoutingModule } from './application-routing.module';

@NgModule({
  declarations: [
    WelcomeComponent,
    BeforeStartingComponent,
    FormWizardComponent,
    AppFormHistoryComponent,
    ApplicationFormDeletionComponent,
    InputTextComponent,
    InputFileComponent,
    DropzoneComponent,
    TextareaComponent,
    BatteryLevelsComponent,
    InputCheckboxesComponent,
    InputRadioComponent,
    SelectComponent,
    MixArrayComponent,
    UnknownFormElementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    CKEditorModule,
    WidgetModule,
    UserProfileModule,
    ApplicationFormViewerModule,
    UserSearchByEmailNameModule,
    ApplicationRoutingModule
  ]
})
export class ApplicationModule { }
