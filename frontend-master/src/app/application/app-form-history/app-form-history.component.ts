import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { saveAs } from 'file-saver';

import { ApplicationFormDeletionComponent } from '../../common/ng-components/modal-application-form-deletion/application-form-deletion.component';

import { FormService } from '../../common/ng-services/form.service';
import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { AuthService } from '../../common/ng-services/auth.service';
import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { AlertService } from '../../common/ng-services/alert';

import { WizardStep } from '../../common/ng-models/community';
import { User } from '../../common/ng-models/user';

@Component({
  templateUrl: './app-form-history.component.html',
  styleUrls: ['./app-form-history.component.scss'],
  providers: [FormValidationService]
})
export class AppFormHistoryComponent implements OnInit {
  user!: User;
  token!: string;
  formId!: string;
  communityId!: string;

  expertCommunity!: string;
  isSeniorAppPart = '';
  formType!: string;
  formTypeText!: string;
  formYear!: number;
  thisYear = 1 + new Date().getFullYear();
  submittedAt: any;
  appFilledBy!: string;

  steps: WizardStep[] = [];
  userAnsweredForm: any = {};
  userProfile!: User;

  messageType!: string;
  messageBody!: string;
  canBeDisplayed!: boolean;

  pdfExportButtonLabel = '<i class="fa fa-file-pdf-o" aria-hidden="true"></i> &nbsp;Export as PDF';
  canBeEdited = false;

  modalWindow!: NgbModalRef;
  modalWindowSubscription: any;

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private formValidationService: FormValidationService,
    private formService: FormService,
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private alertService: AlertService
  ) { this.titleService.setTitle('Viewing an application'); }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.token = params['token'];
      this.formId = params['formId'];
      this.communityId = params['communityId'];
      this.isSeniorAppPart = params['formType'] || ''; // !!! should be a string ending by `senior` or not !!!
      this.messageBody = '';
      this.canBeDisplayed = false;
      this.canBeEdited = false;
      if (!this.token) {
        this.userProfileService.getProfile(this.retrieveUserData);
      } else {
        this.retrievedByPhantom();
      }
    });
  }

  retrieveUserData = (error: any): void => {
    if (error) {
      this.alertService.danger(error);

    } else {
      this.user = this.userProfileService.user!;

      // find community from this.user.history
      let idx = 0;

      let appform = this.user.history ? this.user.history[0] : null;

      if (this.isSeniorAppPart.endsWith('senior')) {
        while (appform && (appform.communityId !== this.communityId || appform.formId !== this.formId || !appform.formType.endsWith('senior'))) {
          appform = this.user.history[idx++];
        }
      } else {
        while (appform && (appform.communityId !== this.communityId || appform.formId !== this.formId || appform.formType.endsWith('senior'))) {
          appform = this.user.history[idx++];
        }
      }

      if (!appform) {
        if (this.user.role === 'Applicant') {
          this.messageType = 'warning';
          this.messageBody = 'No application form found!';

        } else {
          // a reviewer or referent is trying to see an user application form
          this.formService.getFormWizard(this.formId, this.communityId, this.isSeniorAppPart.endsWith('senior')).subscribe({
            next: formwizard => {
              this.steps = formwizard.form.formTemplate;
              this.userAnsweredForm = formwizard.form.userAnsweredForm || {};
              this.formType = formwizard.form.formType;
              switch(formwizard.form.formType) {
                case 'new':
                  if (this.isSeniorAppPart.endsWith('senior')) {
                    this.formTypeText = 'Viewing a new Senior';
                  } else {
                    this.formTypeText = 'Viewing a new';
                  }
                  break;
                case 'renew':
                  if (this.isSeniorAppPart.endsWith('senior')) {
                    this.formTypeText = 'Viewing a renewal Senior';
                  } else {
                    this.formTypeText = 'Viewing a renewal';
                  }
                  break;
              }
              this.expertCommunity = formwizard.community;
              this.submittedAt = formwizard.form.submittedAt;
              this.formYear = formwizard.form.year;

              this.appFilledBy = formwizard.user.firstname && formwizard.user.lastname ?
                  'by ' + formwizard.user.firstname.toLowerCase().replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase()) +
                  ' ' + formwizard.user.lastname.toUpperCase() + ','
                : '';
              this.userProfile = formwizard.form.userAnsweredForm?.profile || formwizard.user;
              // We get missing _id
              this.userProfile['_id'] = formwizard.user['_id'];

              this.canBeDisplayed = true;
              if (formwizard.form.year === this.thisYear) {
                this.canBeEdited = true;
              } else {
                this.canBeEdited = false;
              }

            },
            error: err => {
              this.messageType = 'danger';
              this.messageBody = err;
            }
          });
        }

      } else {
        this.expertCommunity = appform.community;
        this.formService.getForm(this.formId, this.communityId, this.user['_id'], this.isSeniorAppPart.endsWith('senior')).subscribe({
          next: form => {
            this.userProfile = form.userAnsweredForm?.profile || this.user;
            // We get missing _id
            this.userProfile['_id'] = this.user['_id'];
            this.steps = form.formTemplate;
            this.userAnsweredForm = form.userAnsweredForm || {};
            this.formType = form.formType;
            switch(form.formType) {
              case 'new':
                if (this.isSeniorAppPart.endsWith('senior')) {
                  this.formTypeText = 'Viewing a Senior';
                } else {
                  this.formTypeText = 'Viewing a new';
                }
                break;
              case 'renew':
                if (this.isSeniorAppPart.endsWith('senior')) {
                  this.formTypeText = 'Viewing a renewal Senior';
                } else {
                  this.formTypeText = 'Viewing a renewal';
                }
                break;
            }
            this.submittedAt = form.submittedAt;
            this.formYear = form.year;
            this.appFilledBy = '';
            this.canBeDisplayed = true;
            this.canBeEdited = false;

            // Check whether application form can be edited (ie. submission is not closed)
            if (form.submittedAt && form.year === this.thisYear) {
              this.authService.canSubmitForms(this.router.url.split('/')[1], '1').subscribe({
                next: answer => {
                  this.canBeEdited = answer.message === 'OK' ? true : false;
                },
                error: err => {
                  this.canBeEdited = false;
                }
              });
            }
          },
          error: err => {
            this.messageType = 'danger';
            this.messageBody = err;
          }
        });
      }
    }
  }

  retrievedByPhantom() {
    this.formService.phantomGetsFormWizard(this.token, this.formId, this.communityId, this.isSeniorAppPart).subscribe({
      next: formwizard => {
        this.steps = formwizard.form.formTemplate;
        this.userAnsweredForm = formwizard.form.userAnsweredForm || {};
        this.formType = formwizard.form.formType;
        switch(formwizard.form.formType) {
          case 'new':
            if (this.isSeniorAppPart.endsWith('senior')) {
              this.formTypeText = 'Viewing a Senior';
            } else {
              this.formTypeText = 'Viewing a new';
            }
            break;
          case 'renew':
            if (this.isSeniorAppPart.endsWith('senior')) {
              this.formTypeText = 'Viewing a renewal Senior';
            } else {
              this.formTypeText = 'Viewing a renewal';
            }
            break;
        }
        this.expertCommunity = formwizard.community;
        this.submittedAt = formwizard.form.submittedAt;
        this.formYear = formwizard.form.year;

        this.appFilledBy = formwizard.user.firstname && formwizard.user.lastname ?
            'by ' + formwizard.user.firstname.toLowerCase().replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase()) +
            ' ' + formwizard.user.lastname.toUpperCase() + ','
          : '';
        this.userProfile = formwizard.form.userAnsweredForm?.profile || formwizard.user;
        // We get missing _id
        this.userProfile['_id'] = formwizard.user['_id'];
        this.user = formwizard.user;
        this.canBeDisplayed = true;

        if ($('html ng-component:has(div.isPhantomatic)')) {
          $('html').css('zoom', '0.68');
        }
      },
      error: error => {
        this.messageType = 'danger';
        this.messageBody = 'An error occurred while exporting to PDF, please try again.';

        if ($('html ng-component:has(div.isPhantomatic)')) {
          $('html').css('zoom', '0.68');
        }
      }
    });
  }

  exportPDF(event: any) {
    /*** using Puppeteer on the server ***/
    event.target.disabled = true;
    this.pdfExportButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i> &nbsp;Please wait...'
    this.formService.exportFormToPdf(this.router.url.split('/')[1], this.formId, this.communityId, this.isSeniorAppPart).subscribe({
      next: (resp: Blob) => {
        saveAs(new Blob([resp], { type: 'application/pdf' }),
          `${this.formType === 'new' ? (this.isSeniorAppPart.endsWith('senior') ? 'senior-new' : 'new') : (this.isSeniorAppPart.endsWith('senior') ? 'senior-renewal' : 'renewal')}-application-${this.userProfile.cuid || ''}-${this.expertCommunity.replace(/ /g, '-')}.pdf`);
        this.pdfExportButtonLabel = '<i class="fa fa-file-pdf-o" aria-hidden="true"></i> &nbsp;Export as PDF';
        event.target.disabled = false;
      },
      error: error => {
        this.alertService.warning(error);
        this.pdfExportButtonLabel = '<i class="fa fa-file-pdf-o" aria-hidden="true"></i> &nbsp;Export as PDF';
        event.target.disabled = false;
      }
    });

  }

  onModifyingAppForm() {
    this.router.navigate([`/${this.router.url.split('/')[1]}/application/form/edit/${this.formId}/${this.communityId}/${this.isSeniorAppPart}`]);
  }

  onDeletingAppForm() {
    this.modalWindowSubscription.unsubscribe();

    this.formService.deleteForm(this.router.url.split('/')[1], this.formId, this.communityId, this.user['_id'], this.isSeniorAppPart.endsWith('senior')).subscribe({
      next: deletedForm => {
        this.modalWindow.close('app form deleted!');
        this.alertService.success('Your application form has been successfully deleted. You will be redirected in a few seconds to the home page.');
        // redirect to home page
        setTimeout(() => {
          this.alertService.clear();
          this.router.navigate(['/' + this.router.url.split('/')[1] + '/application']);
        }, 4000);
      },
      error: error => {
        this.modalWindow.close('error when deleting app form :(');
        this.alertService.danger(error);
      }
    });
  }

  openFormDeletionModal() {
    this.modalWindow = this.modalService.open(ApplicationFormDeletionComponent, { windowClass: 'modal-danger' });
    this.modalWindow.componentInstance.userEmail = this.userProfile.email;
    this.modalWindow.componentInstance.isUser = this.userProfile.email === this.user.email;
    this.modalWindowSubscription = this.modalWindow.componentInstance.deleteForm.subscribe(() => {
      this.onDeletingAppForm();
    });
  }

  downloadArchive(event: any) {
    event.target.disabled = true;

    this.formService.getFormArchive(this.router.url.split('/')[1], this.formId, this.communityId, this.userProfile['_id'], this.isSeniorAppPart.endsWith('senior')).subscribe({
      next: (resp: Blob) => {
        saveAs(new Blob([resp], { type: 'application/zip' }),
          `${this.formType.startsWith('new') ? (this.formType.endsWith('senior') ? 'senior-new' : 'new') : (this.formType.endsWith('senior') ? 'senior-renewal' : 'renewal')}-application-${this.userProfile.cuid || ''}-${this.expertCommunity.replace(/ /g, '-')}.zip`);
        event.target.disabled = false;
      },
      error: error => {
        event.target.disabled = false;
        this.alertService.danger('Failed to download the form archive.');
      }
    });
  }

  setEventNotification(event: any): void {
    this.alertService.unknown(event.type, event.message);
  }
}
