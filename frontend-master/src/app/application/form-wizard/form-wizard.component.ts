import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

import { Subscription } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { saveAs } from 'file-saver';

import { ApplicationFormDeletionComponent } from '../../common/ng-components/modal-application-form-deletion/application-form-deletion.component';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { FormService } from '../../common/ng-services/form.service';
import { UserService } from '../../common/ng-services/user.service';
import { AuthService } from '../../common/ng-services/auth.service';
import { FileUploadService } from '../../common/ng-services/file-upload.service';
import { AlertService } from '../../common/ng-services/alert';
import { WindowService } from '../../common/ng-services/window.service';

import { FormElementType, WizardStep } from '../../common/ng-models/community';
import { User } from '../../common/ng-models/user';
import { Domain } from '../../common/ng-models/app-config';
import { AppConfig } from '../../app.config';

@Component({
  templateUrl: './form-wizard.component.html',
  /** View ./scss/_oema-form-wizard.scss **/
  providers: [FormValidationService]
})
export class FormWizardComponent implements OnInit, OnDestroy {
  loadingErrorMsg = '';
  userSubscription: Subscription;
  connectedUser!: User;
  isUser!: boolean;
  user!: User;
  userPhotoSrc: any = 'assets/img/avatars/profile.png';
  // Is the recruitment campaign open?
  canSubmitForms?: boolean;
  thisYear: number = 1 + new Date().getFullYear();
  // The application can be submitted?
  // Only applications created in the same year can be submitted.
  canBeSubmitted = false;

  /** For editing already submitted forms **/
  editedFormId!: string;
  editedCommunityId!: string;

  expertCommunity!: string;
  newFormTemplate?: WizardStep[];
  renewalFormTemplate?: WizardStep[];

  formCardHeader!: string;
  formType!: string;
  formId!: string;
  communityId!: string;
  steps!: WizardStep[];
  aboutYouForm!: FormGroup;
  anyStepForms: FormGroup[] = [];
  userFormData: any = {};
  localFormBackUpName = 'formWizard';
  localUserFormDataBackUpName = 'userFormData';

  modalWindow!: NgbModalRef;
  modalWindowSubscription: any;

  saveFormButtonLabel = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>&nbsp; Save form';
  submitFormButtonLabel = 'Apply &nbsp;<i class="fa fa-check arrow" aria-hidden="true"></i>';
  pdfExportButtonLabel = '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>&nbsp; Export as PDF';

  isFormWizardNavCollapsed: boolean;

  urlPrefix: string;
  appDomain: Domain;
  isLoggingOut = 0;

  retrievingUserForm = false;

  FormElementType = FormElementType;

  constructor(
    public appConfig: AppConfig,
    private titleService: Title,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formValidationService: FormValidationService,
    private modalService: NgbModal,
    private windowService: WindowService,
    private router: Router,
    private sanitizer : DomSanitizer,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private communityService: CommunityService,
    private userService: UserService,
    private formService: FormService,
    private fileUploadService: FileUploadService,
    public alertService: AlertService
  ) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    this.titleService.setTitle('Application Form Wizard');

    if (this.urlPrefix === this.appConfig.settings!.domains[0] || this.urlPrefix === this.appConfig.settings!.domains[3]) {
      (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].formWizard.closedMsg =
        (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].formWizard.closedMsg.replace('{{ thisYear }}', this.thisYear);
    }

    this.isFormWizardNavCollapsed = (window.innerWidth < 600) ? true : false;
    this.windowService.onresize(() => {
      this.isFormWizardNavCollapsed = (window.innerWidth < 600) ? true : false;
    });

    this.userSubscription = this.userProfileService.user$.subscribe(
      user => {
        this.user = user;
        this.connectedUser = this.user;
        if (!this.formId && !this.communityId) {
          if (!this.editedFormId && !this.editedCommunityId) {
            if (this.userProfileService.pendingCommunity) {
              this.expertCommunity = this.user.history[this.userProfileService.pendingHistoryIndex].community;
              this.formId = this.user.history[this.userProfileService.pendingHistoryIndex].formId;
              this.communityId = this.user.history[this.userProfileService.pendingHistoryIndex].communityId;
              this.communityService.getCommunity(this.communityId).subscribe({
                next: community => {
                  if (this.urlPrefix.startsWith('senior')) {
                    this.newFormTemplate = community.newSeniorForm;
                    this.renewalFormTemplate = community.renewalSeniorForm;
                  } else {
                    this.newFormTemplate = community.newForm;
                    this.renewalFormTemplate = community.renewalForm;
                  }
                  this.buildWizardSteps();
                },
                error: error => {
                  this.loadingErrorMsg = error;
                }
              });
            }
          } else {
            this.retrieveUserSubmittedFormForEditing();
          }
        }
      }
    );
  }

  getAboutYouStep(user: User) {
    // Get user profile form
    this.aboutYouForm = this.formBuilder.group({
      'photo': [user.photo || ''],
      'directoryUrl': [user.directoryUrl || '', Validators.compose([Validators.required, this.formValidationService.urlValidator])],
      'firstname': [user.firstname || '', Validators.required],
      'lastname': [user.lastname || '', Validators.required],
      'gender': [user.gender || ''],
      'birthday': [user.birthday || '', this.formValidationService.birthdayValidator],
      'cuid': [user.cuid || '', Validators.compose([Validators.required, this.formValidationService.cuidValidator])],
      'email': [user.email || ''],
      'phone': [user.phone || '', Validators.compose([Validators.required, this.formValidationService.phoneValidator])],
      'classification': [user.classification || '', Validators.required],
      'entity': [user.entity || '', Validators.required],
      'country': [user.country || '', Validators.required],
      'location': [user.location || '', Validators.required],
      'managerFirstname': [user.managerFirstname || '', Validators.required],
      'managerLastname': [user.managerLastname || '', Validators.required],
      'managerEmail': [user.managerEmail || '', Validators.compose([Validators.required, this.formValidationService.emailValidator])],
      'hrFirstname': [user.hrFirstname || '', Validators.required],
      'hrLastname': [user.hrLastname || '', Validators.required],
      'hrEmail': [user.hrEmail || '', Validators.compose([Validators.required, this.formValidationService.emailValidator])]
    });

    if (user.photo) {
      this.fileUploadService.getFile(user._id, `${this.user._id}-profile-photo`)
        .subscribe({
          next: (resp: Blob) => {
            this.userPhotoSrc = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(new Blob([resp])));
          },
          error: error => {
            console.error(error);
          }
      });
    }
  }

  get profileFormUserPhoto() {
    return this.aboutYouForm.get('photo') as FormControl;
  }

  buildWizardSteps(): void {
    // Use local storage to save form edition,
    // prefix with formId in case the user modifies several forms at the same time
    if (this.urlPrefix.startsWith('senior')) {
      this.localFormBackUpName = `${this.formId}SeniorFormWizard`;
      this.localUserFormDataBackUpName = `${this.formId}SeniorUserFormData`;
    } else {
      this.localFormBackUpName = `${this.formId}FormWizard`;
      this.localUserFormDataBackUpName = `${this.formId}UserFormData`;
    }

    // Get and display userAnsweredForm from this.user.history[this.user.history.length - 1].formId
    this.formService.getForm(this.formId, this.communityId, this.user['_id'], this.urlPrefix.startsWith('senior')).subscribe({
      next: appForm => {
        if (appForm.email !== this.user.email) {
          this.isUser = false;
          this.userService.listUsers({ id: 'email', operator: 'includes', value: appForm.email }).subscribe({
            next: resp => {
              this.user = resp.users[0];
              this.getAboutYouStep(resp.users[0]);
            },
            error: error => {
              this.loadingErrorMsg = error;
            }
          });
        } else {
          this.isUser = true;
          this.getAboutYouStep(this.user);
        }

        this.formType = appForm.formType;

        if (this.formType === 'new') {
          this.formCardHeader =
            (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].formWizard.newFormCardHeader.replace('{{ expertCommunity }}', this.expertCommunity);
        } else {
          this.formCardHeader =
            (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].formWizard.renewFormCardHeader.replace('{{ expertCommunity }}', this.expertCommunity);
        }

        if (appForm.year === this.thisYear) {
          this.canBeSubmitted = true;
        } else {
          this.canBeSubmitted = false;
        }

        let _steps = appForm.formTemplate;
        if (localStorage.getItem(this.localFormBackUpName) && appForm.lastUpdatedAt) {
          const savedData = JSON.parse(localStorage.getItem(this.localFormBackUpName)!);
          if (Date.parse(appForm.lastUpdatedAt) < savedData.time) {
            _steps = savedData.form;
            for (let i = 0; i < _steps.length; i++) {
              if (_steps[i].active && i > 0) {
                _steps[i].active = false;
                _steps[i - 1].active = true;
              }
            }
          }
          localStorage.removeItem(this.localFormBackUpName);
        }

        // update the template from back-end!
        if (this.newFormTemplate && this.renewalFormTemplate) {
          const template = this.formType === 'new' ? this.newFormTemplate : this.renewalFormTemplate;
          for (let i = 0; i < _steps.length; i++) {
            _steps[i].form = template[i].form;
          }
        }

        this.steps = _steps;


        // Build FormGroup for each step from #2 to #uploads (before last step submission)
        for (const step of this.steps.slice(1, (this.steps.length - 1))) {
          const formElements: { [key: string]: any } = {};
          for (const group of step.form) {
            for (const question of group.questions) {
              // add question.name into formElements
              if (question.type === 'mix-array') {
                const nestedArray: { [key: string]: any } = {};
                const keys: string[] = [];
                for (const row of question.options.rows) {
                  for (const column of question.options.columns) {
                    for (const q of row[column.prop]) {
                      if (q.type !== 'none') {
                        nestedArray[q.name] = '';
                        keys.push(q.name);
                      }
                    }
                  }
                }
                if (question.options?.mandatory) {
                  formElements[question.name] = this.formBuilder.group(nestedArray, {validators: this.formValidationService.atLeastOneValidator(keys)});
                } else {
                  formElements[question.name] = this.formBuilder.group(nestedArray);
                }
              } else {
                formElements[question.name] = question.options?.mandatory ? ['', Validators.required] : '';
              }
            }
          }
          this.anyStepForms.push(this.formBuilder.group(formElements));
        }
        this.steps[0].hasError = false;

        this.userFormData = appForm.userAnsweredForm || {};
        if (localStorage.getItem(this.localUserFormDataBackUpName) && appForm.lastUpdatedAt) {
          const savedData = JSON.parse(localStorage.getItem(this.localUserFormDataBackUpName)!);
          if (Date.parse(appForm.lastUpdatedAt) < savedData.time) {
            this.userFormData = savedData.form;
          }
          localStorage.removeItem(this.localUserFormDataBackUpName);
        }

        const otherSteps = this.steps.slice(1, (this.steps.length - 1)).entries();
        let step;
        while (!(step = otherSteps.next()).done) {
          const formElements: { [key: string]: any } = {};
          for (const group of step.value[1].form) {
            for (const question of group.questions) {
              // add question.name into formElements
              if (question.type === 'mix-array') {
                const nestedArray: { [key: string]: any } = {};
                for (const row of question.options.rows) {
                  for (const column of question.options.columns) {
                    for (const q of row[column.prop]) {
                      if (q.type !== 'none') {
                        if (this.userFormData[question.name]) {
                          nestedArray[q.name] = this.userFormData[question.name][q.name] || '';
                        } else {
                          nestedArray[q.name] = '';
                        }
                      }
                    }
                  }
                }
                formElements[question.name] = nestedArray;
              } else {
                formElements[question.name] = this.userFormData[question.name] || '';
              }
            }
          }
          this.anyStepForms[step.value[0]].setValue(formElements);
        }
      },
      error: error => {
        this.loadingErrorMsg = error;
      }
    });


  }

  retrieveUserSubmittedFormForEditing() {
    if (!this.retrievingUserForm) {
      this.retrievingUserForm = true;

      // find community from this.editedCommunityId
      let newForm = { id: 'newForm', includes: 1 };
      let renewalForm = { id: 'renewalForm', includes: 1 };

      if (this.formType.endsWith('senior')) {
        newForm = { id: 'newSeniorForm', includes: 1 };
        renewalForm = { id: 'renewalSeniorForm', includes: 1 };
      }

      this.communityService.listCommunities(
        { id: '_id', includes: 1 }, { id: 'name', includes: 1 }, newForm, renewalForm)
      .subscribe({
        next: communities => {
          for (const community of communities) {
            if (community['_id'] === this.editedCommunityId) {
              this.expertCommunity = community.name;
              if (this.formType.endsWith('senior')) {
                this.newFormTemplate = community.newSeniorForm;
                this.renewalFormTemplate = community.renewalSeniorForm;
              } else {
                this.newFormTemplate = community.newForm;
                this.renewalFormTemplate = community.renewalForm;
              }
              break;
            }
          }
          this.formId = this.editedFormId;
          this.communityId = this.editedCommunityId;
          this.buildWizardSteps();
        },
        error: error => {
          this.loadingErrorMsg = error;
        }
      });
    }
  }

  ngOnInit() {
    // Check whether application submission is closed
    this.authService.canSubmitForms(this.urlPrefix, '1').subscribe({
      next: answer => {
        this.canSubmitForms = answer.message === 'OK' ? true : false;
      },
      error: error => {
        this.loadingErrorMsg = error;
        this.canSubmitForms = false;
      }
    });

    this.route.params.subscribe((params: Params) => {
      this.editedFormId = params['formId'];
      this.editedCommunityId = params['communityId'];
      this.formType = params['formType'] || '';
    });

    this.route.data
      .subscribe((data) => {
        if (data['userProfile']) {
          this.user = data['userProfile'].user;
          this.connectedUser = this.user;
          if (!this.formId && !this.communityId) {
            if (!this.editedFormId && !this.editedCommunityId) {
              if (this.userProfileService.pendingCommunity) {
                this.expertCommunity = this.user.history[this.userProfileService.pendingHistoryIndex].community;
                this.formId = this.user.history[this.userProfileService.pendingHistoryIndex].formId;
                this.communityId = this.user.history[this.userProfileService.pendingHistoryIndex].communityId;
                this.communityService.getCommunity(this.communityId).subscribe({
                  next: community => {
                    if (this.urlPrefix.startsWith('senior')) {
                      this.newFormTemplate = community.newSeniorForm;
                      this.renewalFormTemplate = community.renewalSeniorForm;
                    } else {
                      this.newFormTemplate = community.newForm;
                      this.renewalFormTemplate = community.renewalForm;
                    }
                    this.buildWizardSteps();
                  },
                  error: error => {
                    this.loadingErrorMsg = error;
                  }
                });
              }
            } else {
              this.retrieveUserSubmittedFormForEditing();
            }
          }
        }
      });
  }

  ngOnDestroy() {
    // Prevent memory leak when component destroyed
    this.userSubscription.unsubscribe();

    this.windowService.onresize();
  }

  // Only if the step is valid, the user can go to the next one,
  // and the form data is saved in the backend database.
  // Validation is only checked when switching to the next step.
  next() {
    const aboutYouForm = this.aboutYouForm;
    const anyStepForms = this.anyStepForms;
    const userFormData = this.userFormData;
    let saveUserData = 0;

    if (this.steps[this.steps.length - 1].active) {
      return;
    }

    this.steps.some(function (step, index, steps) {
      if (index < steps.length - 1) {
        if (step.active) {
          if (index === 0) {
            if (aboutYouForm.valid) {
              saveUserData = 1;
              step.active = false;
              step.valid = true;
              step.hasError = false;
              steps[index + 1].active = true;
              jQuery('html, body').animate({ scrollTop: 0 }, { duration: 400 });
              jQuery('.scrolling').animate({ scrollTop: 0 }, { duration: 400 });
              jQuery('.btn-form-next').trigger('blur');
              return true;
            } else {
              step.valid = false;
              step.hasError = true;
            }
          } else {
            /*** update this.userFormData ***/
            for (const group of step.form) {
              for (const question of group.questions) {
                // add value of form element named 'question.name' into userFormData
                if (question.type === 'mix-array') {
                  if (!userFormData[question.name]) { userFormData[question.name] = {}; }
                  for (const row of question.options.rows) {
                    for (const column of question.options.columns) {
                      for (const q of row[column.prop]) {
                        if (q.type !== 'none') {
                          userFormData[question.name][q.name] = anyStepForms[index - 1].value[question.name][q.name];
                        }
                      }
                    }
                  }
                } else {
                  userFormData[question.name] = anyStepForms[index - 1].value[question.name];
                }
              }
            }

            if (anyStepForms[index - 1].valid) {
              saveUserData = 2;
              step.active = false;
              step.valid = true;
              step.hasError = false;
              steps[index + 1].active = true;
              jQuery('html, body').animate({ scrollTop: 0 }, { duration: 400 });
              jQuery('.scrolling').animate({ scrollTop: 0 }, { duration: 400 });
              jQuery('.btn-form-next').trigger('blur');
              return true;
            } else {
              step.valid = false;
              step.hasError = true;
            }
          }
        }
      }

      return false;
    });

    this.userFormData = userFormData;

    // save user-entered form
    if (saveUserData) {
      if (saveUserData === 1) {
        this.saveUserProfile();
      }
      this.saveForm();
    } else {
      // ALert missing answers to mandatory questions.
      this.alertService.warning(this.steps[0].active ?
        'Please answer all the mandatory fields before going to next step.'
        : 'Please answer all the mandatory questions before going to next step.');
    }
  }

  // If the step is valid, silently save the form in the backend database
  // (but we still save user-entered data in the form)
  prev() {
    const anyStepForms = this.anyStepForms;
    let needToSaveForm = false;
    const userFormData = this.userFormData;

    if (this.steps[0].active) {
      return;
    }
    this.steps.some(function (step, index, steps) {
      if (index !== 0) {
        if (step.active) {
          if (index < steps.length - 1) {
            /*** update this.userFormData ***/
            for (const group of step.form) {
              for (const question of group.questions) {
                // add value of form element named 'question.name' into userFormData
                if (question.type === 'mix-array') {
                  if (!userFormData[question.name]) { userFormData[question.name] = {}; }
                  for (const row of question.options.rows) {
                    for (const column of question.options.columns) {
                      for (const q of row[column.prop]) {
                        if (q.type !== 'none') {
                          userFormData[question.name][q.name] = anyStepForms[index - 1].value[question.name][q.name];
                        }
                      }
                    }
                  }
                } else {
                  userFormData[question.name] = anyStepForms[index - 1].value[question.name];
                }
              }
            }

            //if (anyStepForms[index - 1].valid) {
            needToSaveForm = true;
            //}
          }

          step.active = false;
          steps[index - 1].active = true;
          jQuery('html, body').animate({ scrollTop: 0 }, { duration: 400 });
          jQuery('.scrolling').animate({ scrollTop: 0 }, { duration: 400 });
          jQuery('.btn-form-prev').trigger('blur');
          return true;
        }
      }

      return false;
    });

    this.userFormData = userFormData;

    // save user-entered form
    if (needToSaveForm) {
      this.saveForm();
    }
  }

  // If the step is valid, silently save the form in the backend database
  // (but we still save user-entered data in the form)
  goToStep(stepIndex: number) {
    const aboutYouForm = this.aboutYouForm;
    const anyStepForms = this.anyStepForms;
    const userFormData = this.userFormData;
    let saveUserData = 0;

    this.steps.some(function (step, index, steps) {
      if (step.active) {
        if (!index) {
          if (aboutYouForm.valid) {
            saveUserData = 1;
          }
        } else if (index !== 0 && index < steps.length - 1) {
          /*** update this.userFormData ***/
          for (const group of step.form) {
            for (const question of group.questions) {
              // add value of form element named 'question.name' into userFormData
              if (question.type === 'mix-array') {
                if (!userFormData[question.name]) { userFormData[question.name] = {}; }
                for (const row of question.options.rows) {
                  for (const column of question.options.columns) {
                    for (const q of row[column.prop]) {
                      if (q.type !== 'none') {
                        userFormData[question.name][q.name] = anyStepForms[index - 1].value[question.name][q.name];
                      }
                    }
                  }
                }
              } else {
                userFormData[question.name] = anyStepForms[index - 1].value[question.name];
              }
            }
          }

          //if (anyStepForms[index - 1].valid) {
          saveUserData = 2;
          //}
        } else if (index === steps.length - 1) {
          saveUserData = 2;
        }
        step.active = false;
        steps[stepIndex].active = true;
        return true;
      }

      return false;
    });

    this.userFormData = userFormData;

    // save user-entered form
    if (saveUserData) {
      if (saveUserData === 1) {
        this.saveUserProfile();
      }
      this.saveForm();
    }
  }

  canDeactivate(): Promise<boolean> | boolean {
    // save the form before leaving the url/page

    // do not forget to log out from the back end if the user has requested a log out.
    if (this.authService.isAuthenticated() === 0) {
      if (this.steps) {
        this.isLoggingOut += 1;
        if (this.aboutYouForm.valid) {
          this.isLoggingOut += 1;
          this.saveUserProfile();
        }
        this.retrieveCurrentStepDataAndSave();
      } else {
        this.logOutNow();
      }

    } else {
      if (this.steps) {
        if (this.aboutYouForm.valid) {
          this.saveUserProfile();
        }
        this.retrieveCurrentStepDataAndSave();
      }
    }

    return true;
  }

  logOutNow() {
    this.authService.logout().subscribe({
      next: result => {
        localStorage.clear();
        this.authService.getCsrfToken();
      },
      error: error => {
        localStorage.clear();
        this.authService.getCsrfToken();
      }
    });
  }

  saveUserProfile() {
    this.userService.updateUser(this.user['_id'],
      undefined, undefined,
      this.aboutYouForm.value.directoryUrl?.trim() || undefined,
      this.aboutYouForm.value.firstname || undefined,
      this.aboutYouForm.value.lastname?.toUpperCase() || undefined,
      this.aboutYouForm.value.gender || undefined, this.aboutYouForm.value.birthday || undefined,
      this.aboutYouForm.value.cuid?.toLowerCase() || undefined, this.aboutYouForm.value.email?.toLowerCase() || undefined,
      this.aboutYouForm.value.phone || undefined, this.aboutYouForm.value.classification || undefined,
      this.aboutYouForm.value.entity || undefined, this.aboutYouForm.value.country || undefined,
      this.aboutYouForm.value.location || undefined,
      this.aboutYouForm.value.managerFirstname || undefined, this.aboutYouForm.value.managerLastname || undefined,
      this.aboutYouForm.value.managerEmail?.trim()?.toLowerCase() || undefined,
      this.aboutYouForm.value.hrFirstname || undefined, this.aboutYouForm.value.hrLastname || undefined,
      this.aboutYouForm.value.hrEmail?.trim()?.toLowerCase() || undefined
    ).subscribe({
      next: user => {
        this.userFormData['profile'] = {
          firstname: this.aboutYouForm.value.firstname,
          lastname: this.aboutYouForm.value.lastname.toUpperCase(),
          gender: this.aboutYouForm.value.gender,
          birthday: this.aboutYouForm.value.birthday,
          cuid: this.aboutYouForm.value.cuid.toLowerCase(),
          email: this.aboutYouForm.value.email.toLowerCase(),
          phone: this.aboutYouForm.value.phone,
          classification: this.aboutYouForm.value.classification,
          entity: this.aboutYouForm.value.entity,
          location: this.aboutYouForm.value.location,
          country: this.aboutYouForm.value.country,
          managerFirstname: this.aboutYouForm.value.managerFirstname,
          managerLastname: this.aboutYouForm.value.managerLastname,
          managerEmail: this.aboutYouForm.value.managerEmail.trim().toLowerCase(),
          hrFirstname: this.aboutYouForm.value.hrFirstname,
          hrLastname: this.aboutYouForm.value.hrLastname,
          hrEmail: this.aboutYouForm.value.hrEmail.trim().toLowerCase(),
          directoryUrl: this.aboutYouForm.value.directoryUrl,
          photo: this.aboutYouForm.value.photo
        };

        if (this.isUser) {
          /* keep the following 6 values (as they are not returned by userService.updateUser... */
          user['referent'] = this.user.referent;
          user['reviewer'] = this.user.reviewer;
          user['photo'] = this.user.photo;
          user.role = this.user.role;
          user.community = this.user.community;
          user['communityId'] = this.user.communityId;
          // Keep this.user.history (which has been filtered by communities group)
          // example: when in Orange Experts, we shouldn't see DTSI applications in profile
          user.history = this.user.history;
          /* ...before updating profile !!! */
          this.userProfileService.updateUser(user);
        }

        if (this.isLoggingOut > 0) {
          this.isLoggingOut -= 1;
          if (this.isLoggingOut == 0) {
            this.logOutNow();
          }
        }
      },
      error: error => {
        if (error === 'Bad request...') {
          this.alertService.danger('Your profile is not saved. Please check if all the fields of your profile are filled out correctly.');
        } else {
          this.alertService.danger('Something is wrong. Your profile is not saved. Check first your network connection. If it works, contact us for support.');
        }

        if (this.isLoggingOut > 0) {
          this.isLoggingOut -= 1;
          if (this.isLoggingOut == 0) {
            this.logOutNow();
          }
        }
      }
    });
  }

  retrieveCurrentStepDataAndSave(event?: Event) {
    if (event) {
      (event.target as HTMLButtonElement).disabled = true;
    }
    this.saveFormButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Save form';
    const anyStepForms = this.anyStepForms;
    const userFormData = this.userFormData;
    let needToSaveForm = false;

    this.steps.some(function (step, index, steps) {
      if (step.active) {
        if (index !== 0 && index < steps.length - 1) {
          /*** update this.userFormData ***/
          for (const group of step.form) {
            for (const question of group.questions) {
              // add value of form element named 'question.name' into userFormData
              if (question.type === 'mix-array') {
                if (!userFormData[question.name]) { userFormData[question.name] = {}; }
                for (const row of question.options.rows) {
                  for (const column of question.options.columns) {
                    for (const q of row[column.prop]) {
                      if (q.type !== 'none') {
                        userFormData[question.name][q.name] = anyStepForms[index - 1].value[question.name][q.name];
                      }
                    }
                  }
                }
              } else {
                userFormData[question.name] = anyStepForms[index - 1].value[question.name];
              }
            }
          }

          //if (anyStepForms[index - 1].valid) {
          needToSaveForm = true;
          //}
        }

        return true;
      }

      return false;
    });

    this.userFormData = userFormData;

    if (needToSaveForm) {
      this.saveForm(event);
    } else {
      this.saveFormButtonLabel = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>&nbsp; Save form';
      if (event) {
        (event.target as HTMLButtonElement).disabled = false;
      }
    }
  }

  saveForm(event?: Event) {
    const date = new Date();
    localStorage.setItem(this.localFormBackUpName, JSON.stringify({time: date.getTime(), form: this.steps}));
    localStorage.setItem(this.localUserFormDataBackUpName, JSON.stringify({time: date.getTime(), form: this.userFormData}));

    this.formService.updateForm(
      this.formId, this.communityId, this.isUser ? this.user['_id'] : undefined, this.urlPrefix, this.urlPrefix.startsWith('senior'),
      false, this.formType, this.steps, this.userFormData, undefined).subscribe({
        next: updatedForm => {
          this.saveFormButtonLabel = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>&nbsp; Save form';
          if (event) {
            (event.target as HTMLButtonElement).disabled = false;
          }
          localStorage.removeItem(this.localFormBackUpName);
          localStorage.removeItem(this.localUserFormDataBackUpName);

          if (this.isLoggingOut > 0) {
            this.isLoggingOut -= 1;
            if (this.isLoggingOut == 0) {
              this.logOutNow();
            }
          }
        },
        error: error => {
          this.saveFormButtonLabel = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>&nbsp; Save form';
          if (event) {
            (event.target as HTMLButtonElement).disabled = false;
          }
          if (error.startsWith('Sorry')) {
            // NB: When app form submission is close, got error message === 'Sorry, application submission is closed.'
            this.canSubmitForms = false;
          } else {
            this.alertService.danger('Something is wrong. Your form is not saved. Check first your network connection. If it works, contact us for support.');
          }

          if (this.isLoggingOut > 0) {
            this.isLoggingOut -= 1;
            if (this.isLoggingOut == 0) {
              this.logOutNow();
            }
          }
        }
    });
  }

  exportPDF(event: Event) {
    /*** using phantomjs on the server ***/
    (event.target as HTMLButtonElement).disabled = true;
    this.pdfExportButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Please wait...'
    this.formService.exportFormToPdf(this.urlPrefix, this.formId, this.communityId, `${this.formType}${this.urlPrefix.startsWith('senior') ? '-senior' : ''}`).subscribe({
      next: (resp: Blob) => {
        saveAs(new Blob([resp], { type: 'application/pdf' }),
          `${this.formType === 'new' ? (this.urlPrefix.startsWith('senior') ? 'senior-new' : 'new') : (this.urlPrefix.startsWith('senior') ? 'senior-renewal' : 'renewal')}-application-${this.user.cuid || ''}-${this.expertCommunity.replace(/ /g, '-')}.pdf`);
        this.pdfExportButtonLabel = '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>&nbsp; Export as PDF';
        (event.target as HTMLButtonElement).disabled = false;
      },
      error: error => {
        this.alertService.warning(error);
        this.pdfExportButtonLabel = '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>&nbsp; Export as PDF';
        (event.target as HTMLButtonElement).disabled = false;
      }
    });
  }

  applyApplication(event: Event) {
    (event.target as HTMLButtonElement).disabled = true;
    this.submitFormButtonLabel = 'Apply &nbsp;<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>';

    this.steps.forEach(step => { step.valid = true; step.hasError = false; });

    const date = new Date();
    localStorage.setItem(this.localFormBackUpName, JSON.stringify({time: date.getTime(), form: this.steps}));
    localStorage.setItem(this.localUserFormDataBackUpName, JSON.stringify({time: date.getTime(), form: this.userFormData}));

    this.formService.updateForm(
      this.formId, this.communityId, this.isUser ? this.user['_id'] : undefined, this.urlPrefix, this.urlPrefix.startsWith('senior'),
      true, this.formType, this.steps, this.userFormData, undefined).subscribe({
        next: submittedForm => {
          if (!this.editedFormId) {
            this.alertService.success(`Your application has been submitted successfully. We will keep in touch with you${this.urlPrefix === this.appConfig.settings!.domains[0] ? ` (expected answer in January ${this.thisYear})` : ''}. You will be redirected in a few seconds to the home page.`);
          } else {
            this.alertService.success('Your application has been updated and submitted again successfully. You will be redirected in a few seconds...');
          }
          if (this.isUser) {
            this.userProfileService.getProfile(() => { });
          }
          this.submitFormButtonLabel = 'Apply &nbsp;<i class="fa fa-check arrow" aria-hidden="true"></i>';
          localStorage.removeItem(this.localFormBackUpName);
          localStorage.removeItem(this.localUserFormDataBackUpName);
          setTimeout(() => {
            this.alertService.clear();
            this.steps = [];
            if (!this.editedFormId) {
              this.router.navigate(['/' + this.urlPrefix + '/application']);
            } else {
              this.router.navigate(['/' + this.urlPrefix +
                '/application/appform/' + this.editedFormId + '/' + this.editedCommunityId + '/' + this.formType + (this.urlPrefix.startsWith('senior') ? '-senior' : '')]);
            }
          }, 8000);

        },
        error: error => {
          if (error.indexOf('impossible to send an email') !== -1 && !error.startsWith('Sorry')) {
            // NB: When app form submission is close, got error message === 'Sorry, application submission is closed.'
            if (this.isUser) {
              this.userProfileService.getProfile(() => { });
            }

            localStorage.removeItem(this.localFormBackUpName);
            localStorage.removeItem(this.localUserFormDataBackUpName);

            this.alertService.warning(error);

            setTimeout(() => {
              this.alertService.clear();
              this.steps = [];
              if (!this.editedFormId) {
                this.router.navigate(['/' + this.urlPrefix + '/application']);
              } else {
                this.router.navigate(['/' + this.urlPrefix +
                  '/application/appform/' + this.editedFormId + '/' + this.editedCommunityId + '/' + this.formType + (this.urlPrefix.startsWith('senior') ? '-senior' : '')]);
              }
            }, 5000);

          } else {
            this.alertService.danger(error);
            (event.target as HTMLButtonElement).disabled = false;
          }

          this.submitFormButtonLabel = 'Apply &nbsp;<i class="fa fa-check arrow" aria-hidden="true"></i>';
        }
      });
  }

  onDeletingAppForm() {
    this.modalWindowSubscription.unsubscribe();

    localStorage.removeItem(this.localFormBackUpName);
    localStorage.removeItem(this.localUserFormDataBackUpName);

    this.formService.deleteForm(this.urlPrefix, this.formId, this.communityId, this.isUser ? this.user['_id'] : undefined, this.urlPrefix.startsWith('senior')).subscribe({
      next: deletedForm => {
        this.modalWindow.close('App form deleted!');
        this.alertService.success('Your application form has been successfully deleted. You will be redirected in a few seconds to the home page.');
        // redirect to home page
        setTimeout(() => {
          this.alertService.clear();
          this.steps = [];
          this.router.navigate(['/' + this.urlPrefix + '/application']);
        }, 4000);
      },
      error: error => {
        this.modalWindow.close('Error when deleting app form :(');

        if (error.indexOf('impossible to send an email') != -1) {
          this.alertService.success('Your application form has been successfully deleted. You will be redirected in a few seconds to the home page.');
          // redirect to home page
          setTimeout(() => {
            this.alertService.clear();
            this.steps = [];
            this.router.navigate(['/' + this.urlPrefix + '/application']);
          }, 4000);

        } else {
          this.alertService.danger(error);
        }
      }
    });
  }

  getNestedFormGroup(fg: FormGroup, name: string) {
    return fg.get(name) as FormGroup;
  }

  openFormDeletionModal() {
    this.modalWindow = this.modalService.open(ApplicationFormDeletionComponent, { windowClass: 'modal-danger' });
    this.modalWindow.componentInstance.userEmail = this.user.email;
    this.modalWindow.componentInstance.isUser = this.isUser;
    this.modalWindowSubscription = this.modalWindow.componentInstance.deleteForm.subscribe(() => {
      this.onDeletingAppForm();
    });
  }

  setEventNotification(event: any): void {
    this.alertService.unknown(event.type, event.message);
  }
}
