import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // directive ngFor...
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DataTablesModule } from 'angular-datatables';
import { EditableModule } from '@ngneat/edit-in-place';
import { CKEditorModule } from 'ng2-ckeditor';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { WidgetModule } from '../common/ng-modules/widget.module';
import { UserProfileModule } from '../common/ng-modules/user-profile.module';
import { ApplicationFormViewerModule } from '../common/ng-modules/application-form-viewer.module';
import { UserSearchByEmailNameModule } from '../common/ng-modules/user-search-by-email-name.module';
import { CapitalizeNameModule } from '../common/ng-modules/capitalize-name.module';

import { SpotlightComponent } from './spotlight/spotlight.component';
import { CommunitiesComponent } from './communities/communities.component';
import { ExpertsComponent } from './experts/experts.component';
import { UsersComponent } from './users/users.component';
import { CreateUserAccountComponent } from './create-user-account/create-user-account.component';
import { FormsComponent } from './forms/forms.component';
import { SubmissionsComponent } from './submissions/submissions.component';
import { NewApplicantsComponent } from './new-applicants/new-applicants.component';
import { JuryComponent } from './jury/jury.component';
import { ReviewArchiveComponent } from './review-archive/review-archive.component';
import { SettingsComponent } from './settings/settings.component';
import { AppFormReviewComponent } from './app-form-review/app-form-review.component';
import { FormTemplateWizardComponent } from './form-template-wizard/form-template-wizard.component';

import { OngoingFormsTableComponent } from '../common/ng-components/ongoing-forms-table/ongoing-forms-table.component';
import { SelectedUsersTableComponent } from '../common/ng-components/selected-users-table/selected-users-table.component';
import { MailComposeComponent } from '../common/ng-components/modal-mail-compose/mail-compose.component';
import { XlsxExportDirective } from '../common/ng-directives/xlsx-export.directive';

import { InputTextTemplateComponent } from './form-template-elements/input-text/input-text-template.component';
import { InputFileTemplateComponent } from './form-template-elements/input-file/input-file-template.component';
import { DropzoneTemplateComponent } from './form-template-elements/dropzone/dropzone-template.component';
import { TextareaTemplateComponent } from './form-template-elements/textarea/textarea-template.component';
import { BatteryLevelsTemplateComponent } from './form-template-elements/battery-levels/battery-levels-template.component';
import { InputCheckboxesTemplateComponent } from './form-template-elements/input-checkboxes/input-checkboxes-template.component';
import { InputRadioTemplateComponent } from './form-template-elements/input-radio/input-radio-template.component';
import { SelectTemplateComponent } from './form-template-elements/select/select-template.component';
import { MixArrayTemplateComponent } from './form-template-elements/mix-array/mix-array-template.component';
import { TextTemplateComponent } from './form-template-elements/text/text-template.component';
import { UnknownFormElementTemplateComponent } from './form-template-elements/unknown/unknown-form-element-template.component';

import { DashboardRoutingModule } from './dashboard-routing.module';

@NgModule({
  declarations: [
    SpotlightComponent,
    CommunitiesComponent,
    ExpertsComponent,
    UsersComponent,
    CreateUserAccountComponent,
    FormsComponent,
    SubmissionsComponent,
    NewApplicantsComponent,
    JuryComponent,
    ReviewArchiveComponent,
    SettingsComponent,
    AppFormReviewComponent,
    FormTemplateWizardComponent,
    OngoingFormsTableComponent,
    SelectedUsersTableComponent,
    MailComposeComponent,
    XlsxExportDirective,
    InputTextTemplateComponent,
    InputFileTemplateComponent,
    DropzoneTemplateComponent,
    TextareaTemplateComponent,
    BatteryLevelsTemplateComponent,
    InputCheckboxesTemplateComponent,
    InputRadioTemplateComponent,
    SelectTemplateComponent,
    MixArrayTemplateComponent,
    TextTemplateComponent,
    UnknownFormElementTemplateComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    DataTablesModule,
    EditableModule,
    CKEditorModule,
    DragDropModule,
    NgxChartsModule,
    WidgetModule,
    UserProfileModule,
    ApplicationFormViewerModule,
    UserSearchByEmailNameModule,
    CapitalizeNameModule,
    DashboardRoutingModule
  ]
})

export class DashboardModule { }
