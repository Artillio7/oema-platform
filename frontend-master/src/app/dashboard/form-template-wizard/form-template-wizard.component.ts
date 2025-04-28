import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CDK_DRAG_CONFIG, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { UserService } from '../../common/ng-services/user.service';
import { AuthService } from '../../common/ng-services/auth.service';
import { FileUploadService } from '../../common/ng-services/file-upload.service';
import { AlertService } from '../../common/ng-services/alert';
import { WindowService } from '../../common/ng-services/window.service';

import { FormElementType, FormType, WizardStep } from '../../common/ng-models/community';
import { User, FAKE_SENIOR_ORANGE_EXPERTS_FLAG } from '../../common/ng-models/user';

import { AppConfig } from '../../app.config';

interface AppFormElement {
  alignment?: string;
  type: FormType;
  stepIndex?: number;
  groupIndex?: number;
  questionIndex?: number;
  cell?: {alignment?: string, row?: number, col?: number, index?: number};
}

const DragConfig = {
  zIndex: 10000
};

@Component({
  templateUrl: './form-template-wizard.component.html',
  styleUrls: ['./form-template-wizard.component.scss'],
  providers: [FormValidationService, { provide: CDK_DRAG_CONFIG, useValue: DragConfig }]
})
export class FormTemplateWizardComponent implements OnInit, OnDestroy {
  urlPrefix: string;
  formType!: string;
  communityId!: string;
  expertCommunity!: string;
  isLoggingOut = 0;

  user!: User;

  steps!: WizardStep[];
  aboutYouForm!: FormGroup;
  anyStepForms: FormGroup[] = [];
  userFormData: any = {};

  loadingErrorMsg = '';
  isFormWizardNavCollapsed: boolean;
  saveFormButtonLabel = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>&nbsp; Save Draft';
  submitFormButtonLabel = '<i class="fa fa-check" aria-hidden="true"></i>&nbsp; Publish draft template';

  modalWindow!: NgbModalRef;
  @ViewChild('deleteFormTemplateModal', { read: TemplateRef })
  deleteFormTemplateModal!: TemplateRef<any>;
  @ViewChild('stepTitleFormTemplateModal', { read: TemplateRef })
  stepTitleFormTemplateModal!: TemplateRef<any>;
  @ViewChild('newGroupTemplateModal', { read: TemplateRef })
  newGroupTemplateModal!:  TemplateRef<any>;
  @ViewChild('optionsTemplateModal', { read: TemplateRef })
  optionsTemplateModal!:  TemplateRef<any>;

  deletionModalTitle = 'Delete your draft template?';
  deletionModalBody = 'Your draft application form template will be deleted.';

  currentStepIndex = 0;
  tmpAppFormItem?: AppFormElement;
  visibleQuestionMenuIndex = -1;

  newStepForm!: FormGroup;
  stepTitleFormIcon!: FormControl;
  stepTitleFormName!: FormControl;
  stepTitleFormHasError = false;
  stepTitleFormHeader = '';
  newStepIndex = 0;

  newQuestionGroupCtrl!: FormControl;

  FormElementType = FormElementType;
  FormType = FormType;

  /* Question options */
  mandatoryQuestion = false;
  mandatoryHint = '';
  previewQuestion = false;
  previewTitle = '';
  questionType: FormElementType = FormElementType.Unknown;
  // textarea
  textareaHeight = '';
  // select, input-radio
  widthClass = '';
  // input-checkbox
  checkboxDisplayMode = '';
  checkboxLeftLabels: any[] = [];
  checkboxRightLabels: any[] = [];
  checkboxLeftLabelFormCtrls!: FormArray;
  checkboxRightLabelFormCtrls!: FormArray;
  // select, input-checkbox, input-radio, battery-levels
  optionLabels: any[] = [];
  optionLabelFormCtrls!: FormArray;
  editingOptionLabelIndex = -1;
  newOptionLabel = '';
  newLeftOptionLabel = '';
  newRightOptionLabel = '';
  // mix-array
  showOptionsForMixArray = false;
  useOwnIdentifier = 0;
  ownIdentifier = '';
  // file input
  fileInputAccept = '';
  // manager approval
  managerApprovalFilename: string;
  uploadManagerApprovalButton = '<i class="fa fa-upload"></i>';
  managerApprovalUploadError!: string;
  public managerApprovalFile: string = '';
  /********************/

  notifyUsersFormTemplateChanges = 0;
  formTemplateChangelog = '';

  constructor(
    private appConfig: AppConfig,
    private titleService: Title,
    private windowService: WindowService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private formValidationService: FormValidationService,
    private userProfileService: UserProfileService,
    private communityService: CommunityService,
    private userService: UserService,
    private authService: AuthService,
    private fileUploadService: FileUploadService,
    public alertService: AlertService
  ) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.titleService.setTitle('Editing Form Template');
    this.isFormWizardNavCollapsed = (window.innerWidth < 600) ? true : false;
    this.windowService.onresize(() => {
      this.isFormWizardNavCollapsed = (window.innerWidth < 600) ? true : false;
    });
    if (this.urlPrefix === 'orange-experts') {
      this.managerApprovalFilename = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].name.replace(' ', '_') + '_manager_TM_approval.doc';
    } else {
      this.managerApprovalFilename = this.urlPrefix + '_manager_approval.doc';
    }
  }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.formType = params['formType'];
      this.communityId = params['communityId'];
      this.userProfileService.getProfile(this.retrieveAppForm);
    });

    this.newStepForm = this.formBuilder.group({
      name: ['', Validators.required],
      icon: ['', Validators.required],
    });

    this.newQuestionGroupCtrl = new FormControl('');
  }

  ngOnDestroy() {
    this.windowService.onresize();
  }

  retrieveAppForm = (error: any): void => {
    if (error) {
      this.loadingErrorMsg = error;
    } else {
      this.user = this.userProfileService.user!;
      this.getAboutYouStep(this.user);

      this.communityService.getCommunity(this.communityId).subscribe({
        next: community => {
          switch(this.formType) {
            case 'new':
              this.steps = this.communityId === FAKE_SENIOR_ORANGE_EXPERTS_FLAG.toString() ? community.newSeniorFormDraft! : community.newFormDraft!;
              break;
            case 'renew':
              this.steps = this.communityId === FAKE_SENIOR_ORANGE_EXPERTS_FLAG.toString() ? community.renewalSeniorFormDraft! : community.renewalFormDraft!;
              break;
          }
          this.expertCommunity = community.name;
          this.buildWizardSteps();

          if (community.name.includes('Senior')) {
            this.managerApprovalFilename = (this.appConfig.settings as { [key: string]: any })['senior-orange-experts'].name.replace(' ', '_') + '_manager_TM_approval.doc';
          }
          this.fileUploadService.checkFile(this.managerApprovalFilename).subscribe({
            next: result => {
              if (result.success) {
                this.managerApprovalFile = this.managerApprovalFilename;
              }
            },
          });
        },
        error: error => {
          this.loadingErrorMsg = error;
        }
      });
    }
  }

  getAboutYouStep(user: User) {
    // Get user profile form
    this.aboutYouForm = this.formBuilder.group({
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
  }

  buildWizardSteps(): void {
    // Restore local backup if any
    if (localStorage.getItem('formTemplateWizard')) {
      let _steps = this.steps;
      _steps = JSON.parse(localStorage.getItem('formTemplateWizard')!);
      for (let i = 0; i < _steps.length; i++) {
        if (_steps[i].active && i > 0) {
          _steps[i].active = false;
          _steps[i - 1].active = true;
        }
      }
      localStorage.removeItem('formTemplateWizard');
      this.steps = _steps;
    }

    // Build FormGroup for each step from #2 to #uploads (before last step submission)
    for (const [i, step] of this.steps.slice(1, (this.steps.length - 1)).entries()) {
      if (step.active) {
        this.currentStepIndex = i + 1;
      }

      this.buildFormControlsForStep(i + 1);
    }

    if (this.steps[this.steps.length - 1].active) {
      this.currentStepIndex = this.steps.length - 1;
    }

    this.steps[0].hasError = false;
  }

  buildFormControlsForStep(index: number) {
    const formElements: { [key: string]: any } = {};

    formElements['step-title'] = this.formBuilder.group({
      name: [this.steps[index].name, Validators.required],
      icon: [this.steps[index].icon.replace('fa-', ''), Validators.required],
    });

    for (const [j, group] of this.steps[index].form.entries()) {
      formElements[`group-${j}-name`] = group.group;
      for (const [k, question] of group.questions.entries()) {
        // add question.label into formElements for editing it
        formElements[`group-${j}-question-${k}`] = [question.label, Validators.required];
        // add question.name into formElements for user's answer
        if (question.type === 'mix-array') {
          const nestedArray: { [key: string]: any } = {};
          for (const [rIdx ,row] of question.options.rows.entries()) {
            for (const [cIdx, column] of question.options.columns.entries()) {
              for (const [qIdx, q] of row[column.prop].entries()) {
                if (q.type !== 'none') {
                  nestedArray[`row-${rIdx}-col-${cIdx}-id-${qIdx}`] = [q.label, Validators.required];
                  nestedArray[q.name] = '';
                }
              }
            }
          }
          formElements[question.name] = this.formBuilder.group(nestedArray);
        } else {
          formElements[question.name] = '';
        }
      }
    }

    this.anyStepForms[index - 1] = this.formBuilder.group(formElements);
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
    this.saveFormButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Save Draft';
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

          if (anyStepForms[index - 1].valid) {
            needToSaveForm = true;
          }
        }

        return true;
      }

      return false;
    });

    this.userFormData = userFormData;

    if (needToSaveForm) {
      this.saveForm(event);
    } else {
      this.saveFormButtonLabel = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>&nbsp; Save Draft';
      if (event) {
        (event.target as HTMLButtonElement).disabled = false;
        this.alertService.warning('Please correct errors or missing parts (indicated by the symbol ⚠) in the current step.');
      }
    }
  }

  saveForm(event?: Event) {
    localStorage.setItem('formTemplateWizard', JSON.stringify(this.steps));

    this.communityService.updateAppFormDraft(this.communityId, this.formType, this.steps, this.expertCommunity.includes('Senior')).subscribe({
      next: community => {
        this.saveFormButtonLabel = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>&nbsp; Save Draft';
        if (event) {
          (event.target as HTMLButtonElement).disabled = false;
        }
        localStorage.removeItem('formTemplateWizard');

        if (this.isLoggingOut > 0) {
          this.isLoggingOut -= 1;
          if (this.isLoggingOut == 0) {
            this.logOutNow();
          }
        }
      },
      error: error => {
        this.saveFormButtonLabel = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>&nbsp; Save Draft';
        if (event) {
          (event.target as HTMLButtonElement).disabled = false;
        }
        this.alertService.danger(error);

        if (this.isLoggingOut > 0) {
          this.isLoggingOut -= 1;
          if (this.isLoggingOut == 0) {
            this.logOutNow();
          }
        }
      }
    });
  }

  publishAppFormTemplate(event: Event) {
    localStorage.setItem('formTemplateWizard', JSON.stringify(this.steps));

    if (this.anyStepForms.some((stepForm) => !stepForm.valid)) {
      this.modalWindow.close('Form syntax error!');
      this.alertService.danger('Please check your form template through all the steps: missing parts or incorrect syntax (indicated by the symbol ⚠).');

    } else {
      (event.target as HTMLButtonElement).disabled = true;
      this.submitFormButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Publish draft template';

      this.communityService.updateAppFormDraft(this.communityId, this.formType, this.steps, this.expertCommunity.includes('Senior')).subscribe({
        next: community => {
          this.communityService.publishAppFormDraft(this.urlPrefix, this.communityId, this.formType, this.formTemplateChangelog !== '' ? this.formTemplateChangelog : undefined, this.expertCommunity.includes('Senior'))
          .subscribe({
            next: updatedCommunity => {
              this.submitFormButtonLabel = '<i class="fa fa-check" aria-hidden="true"></i>&nbsp; Publish draft template';
              this.modalWindow.close('Successfully published the form template!');
              this.alertService.success(`Your ${this.formType} application form template has been published successfully. You will be redirected in a few seconds...`);
              localStorage.removeItem('formTemplateWizard');

              setTimeout(() => {
                this.alertService.clear();
                this.steps = [];
                this.router.navigate(['/' + this.urlPrefix + '/dashboard/communities']);
              }, 4000);
            },
            error: err => {
              (event.target as HTMLButtonElement).disabled = false;
              this.submitFormButtonLabel = '<i class="fa fa-check" aria-hidden="true"></i>&nbsp; Publish draft template';
              this.alertService.danger(err);
            }
          });
        },
        error: error => {
          (event.target as HTMLButtonElement).disabled = false;
          this.submitFormButtonLabel = '<i class="fa fa-check" aria-hidden="true"></i>&nbsp; Publish draft template';
          this.alertService.danger(error);
        }
      });
    }
  }

  prevStep() {
    const anyStepForms = this.anyStepForms;
    let needToSaveForm = false;
    const userFormData = this.userFormData;

    this.currentStepIndex--;

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

            if (anyStepForms[index - 1].valid) {
              needToSaveForm = true;
            }
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

  nextStep() {
    const aboutYouForm = this.aboutYouForm;
    const anyStepForms = this.anyStepForms;
    const userFormData = this.userFormData;
    let saveUserData = 0;

    if (this.steps[this.steps.length - 1].active) {
      return;
    }

    this.steps.some((step, index, steps) => {
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
              this.currentStepIndex++;
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
              this.currentStepIndex++;
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
      this.alertService.warning('Please correct errors or missing parts (indicated by the symbol ⚠) in the current step.');
    }
  }

  goToStep(stepIndex: number) {
    const aboutYouForm = this.aboutYouForm;
    const anyStepForms = this.anyStepForms;
    const userFormData = this.userFormData;
    let saveUserData = 0;

    this.currentStepIndex = stepIndex;

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

          if (anyStepForms[index - 1].valid) {
            saveUserData = 2;
          }
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

  getNestedFormGroup(fg: FormGroup, name: string) {
    return fg.get(name) as FormGroup;
  }

  getNestedFormControl(fg: FormGroup, name: string) {
    return fg.get(name) as FormControl;
  }

  submitStepTitleForm() {
    if (this.stepTitleFormHeader.startsWith('Modify')) {
      // Modify the title of the current step in the form template
      const stepTitleFormGrp = this.getNestedFormGroup(this.anyStepForms[this.currentStepIndex - 1], 'step-title');
      this.stepTitleFormHasError = !stepTitleFormGrp.valid;

      if (!this.stepTitleFormHasError) {
        this.steps[this.currentStepIndex].icon = 'fa-' + stepTitleFormGrp.value.icon;
        this.steps[this.currentStepIndex].name = stepTitleFormGrp.value.name;

        this.modalWindow.close('Successfully updated the step title!')
      }
    } else {
      // Add new step into the form template
      this.stepTitleFormHasError = !this.newStepForm.valid;

      if (!this.stepTitleFormHasError) {
        // Insert new step and move to this newly created step
        this.steps.splice(this.newStepIndex, 0, {name: this.newStepForm.value.name, icon: 'fa-' + this.newStepForm.value.icon, active: true, valid: false, hasError: false, form: []});
        this.anyStepForms.splice(this.newStepIndex - 1, 0, this.formBuilder.group({
          'step-title': this.formBuilder.group({
            name: [this.newStepForm.value.name, Validators.required],
            icon: [this.newStepForm.value.icon, Validators.required],
          })
        }));

        if (this.newStepIndex === this.currentStepIndex + 1) {
          // After
          this.steps[this.currentStepIndex].active = false;
          this.steps[this.currentStepIndex].valid = true;
          this.steps[this.currentStepIndex].hasError = false;
          this.currentStepIndex++;
          if (this.currentStepIndex === 1) {
            this.saveUserProfile();
          }
        } else {
          this.steps[this.currentStepIndex + 1].active = false;
          this.steps[this.currentStepIndex + 1].valid = true;
          this.steps[this.currentStepIndex + 1].hasError = false;
        }

        this.saveForm();
        this.modalWindow.close('Successfully added a new step!')
      }
    }
  }

  editStep(content: any) {
    if (this.currentStepIndex > 0 && this.currentStepIndex < this.steps.length - 1) {
      const stepTitleFormGrp = this.getNestedFormGroup(this.anyStepForms[this.currentStepIndex - 1], 'step-title');
      this.stepTitleFormHeader = 'Modify the step title';
      this.stepTitleFormIcon = stepTitleFormGrp.get('icon') as FormControl;
      this.stepTitleFormIcon.setValue(this.steps[this.currentStepIndex].icon.replace('fa-', ''))
      this.stepTitleFormName = stepTitleFormGrp.get('name') as FormControl;
      this.stepTitleFormName.setValue(this.steps[this.currentStepIndex].name);
      this.openModal(content);
    }
  }

  addNewFormItemIntoTemplate(item: AppFormElement) {
    switch (item.type) {
      case FormType.Step:
        if (item.alignment === 'after' &&
            ((this.currentStepIndex === 0 && !this.aboutYouForm.valid) || (this.currentStepIndex > 0 && !this.anyStepForms[this.currentStepIndex - 1].valid))) {
            this.alertService.danger('Please correct errors or missing parts in the current step of your form template before moving forward with a new step.');
        } else {
          this.stepTitleFormHeader = `Add new step ${item.alignment} index ${item.stepIndex}`;
          this.stepTitleFormIcon = this.newStepForm.get('icon') as FormControl;
          this.stepTitleFormIcon.setValue('');
          this.stepTitleFormName = this.newStepForm.get('name') as FormControl;
          this.stepTitleFormName.setValue('');
          this.newStepIndex = item.alignment === 'after' ? this.currentStepIndex + 1 : this.currentStepIndex;
          this.openModal(this.stepTitleFormTemplateModal);
        }
        break;

      case FormType.Group:
        this.tmpAppFormItem = item;
        this.openModal(this.newGroupTemplateModal);
        break;

      case FormType.Question:
        // Can be a question in a group, a question nested inside a table cell, a new table row, a new table column.
        if (!item.cell) {
          // New question in a group
          const unknownQuestion = { label: '', type: FormElementType.Unknown, name: `fe-on-init-${Date.now()}` };
          if (item.alignment === 'before') {
            this.steps[item.stepIndex!].form[item.groupIndex!].questions .splice(item.questionIndex!, 0, unknownQuestion);
          } else if (item.alignment === 'after') {
            this.steps[item.stepIndex!].form[item.groupIndex!].questions.splice(item.questionIndex! + 1, 0, unknownQuestion);
          } else {
            // put at the beginning
            this.steps[item.stepIndex!].form[item.groupIndex!].questions.unshift(unknownQuestion);
          }

        } else {
          const tableQuestion = this.steps[item.stepIndex!].form[item.groupIndex!].questions[item.questionIndex!];
          tableQuestion.options = tableQuestion.options || {};
          tableQuestion.options['rows'] = tableQuestion.options.rows || [];
          tableQuestion.options['columns'] = tableQuestion.options.columns || [];

          if (item.cell.alignment?.startsWith('row-')) {
            // New row in a table
            const rowObj = tableQuestion.options.columns.reduce((rowObj: any, column: any) => ({ ...rowObj, [column.prop]: [] }), {});
            if (item.cell.alignment === 'row-before') {
              tableQuestion.options.rows.splice(item.cell.row!, 0, rowObj);
            } else if (item.cell.alignment === 'row-after') {
              tableQuestion.options.rows.splice(item.cell.row! + 1, 0, rowObj);
            } else {
              tableQuestion.options.rows.unshift(rowObj);
            }

          } else if (item.cell.alignment?.startsWith('column-')) {
            // New column in a table
            const index = item.cell.alignment === 'column-leading' ? 0 : (item.cell.alignment === 'column-before' ? item.cell.col! : item.cell.col! + 1);
            const columnProp = `col${index}-${this.getUniqueId(1)}-${Date.now()}`;
            tableQuestion.options.columns.splice(index, 0, { name: 'Edit column title', prop: columnProp });
            // TODO
            for (const row of tableQuestion.options.rows) {
              row[columnProp] = [];
            }

          } else {
            // New question in a table cell
            const unknownQuestion = { label: '', type: FormElementType.Unknown, name: `fe-on-init-${Date.now()}` };
            if (item.cell.alignment === 'before') {
              tableQuestion.options.rows[item.cell.row!][tableQuestion.options.columns[item.cell.col!].prop].splice(item.cell.index!, 0, unknownQuestion);
            } else if (item.cell.alignment === 'after') {
              tableQuestion.options.rows[item.cell.row!][tableQuestion.options.columns[item.cell.col!].prop].splice(item.cell.index! + 1, 0, unknownQuestion);
            } else {
              tableQuestion.options.rows[item.cell.row!][tableQuestion.options.columns[item.cell.col!].prop].unshift(unknownQuestion);
            }
          }
        }

        // Update all formControls `group-${j}-question-${k}` and `row-${rIdx}-col-${cIdx}-id-${qIdx}`
        this.buildFormControlsForStep(this.currentStepIndex);
        // Close the hover menu

        break;
    }
  }

  private checkQuestionTypeAlreadySet(questionType: FormElementType): boolean {
    if ([FormElementType.Dropzone, FormElementType.CV, FormElementType.ManagerApproval, FormElementType.OrangeCharter].includes(questionType)) {
      for (const formStep of this.steps) {
        if (formStep.form) {
          for (const grp of formStep.form) {
            if (grp.questions) {
              for (const quest of grp.questions) {
                if (quest.type === questionType ||
                    questionType === FormElementType.CV && quest.name === 'file-cv' ||
                    questionType === FormElementType.ManagerApproval && quest.name === 'file-manager-recommendation' ||
                    questionType === FormElementType.OrangeCharter && quest.name === 'file-orange-expert-charter') {
                  return true;
                }
              }
            }
          }
        }
      }
    }

    return false;
  }

  // The name property (== uid) for a question must be unique in the form.
  private checkQuestionIdAlreadySet(questionName: string): boolean {
    for (const formStep of this.steps) {
      if (formStep.form) {
        for (const grp of formStep.form) {
          if (grp.questions) {
            for (const quest of grp.questions) {
              if (quest.options?.columns && quest.options?.rows) {
                for (const row of quest.options.rows) {
                  for (const col in row) {
                    for (const cquest of row[col]) {
                      if (quest.name === questionName) {
                        return true;
                      }
                    }
                  }
                }
              } else if (quest.name === questionName) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  createNewFormQuestion(item: AppFormElement, questionType: FormElementType) {
    if (this.checkQuestionTypeAlreadySet(questionType)) {
      // Only one instance for FormElementType.Dropzone, 'CV', 'Manager Approval', 'Orange Charter'!
      this.alertService.warning('Only one instance is authorized for Dropzone, CV, Manager Approval, and Orange Charter!');
      return;
    }

    let question;
    let formGrp;

    if (!item.cell) {
      // New question in a group
      question = this.steps[item.stepIndex!].form[item.groupIndex!].questions[item.questionIndex!];
      formGrp = this.anyStepForms[item.stepIndex! - 1];
    } else {
      // New question in a table cell
      const tableQuestion = this.steps[item.stepIndex!].form[item.groupIndex!].questions[item.questionIndex!];
      question = tableQuestion.options.rows[item.cell.row!][tableQuestion.options.columns[item.cell.col!].prop][item.cell.index!];
      formGrp = this.getNestedFormGroup(this.anyStepForms[item.stepIndex! - 1], tableQuestion.name);
    }

    formGrp.removeControl(question.name);

    question.type = questionType;

    switch (questionType) {
      case FormElementType.Textarea:
        question.name = `ta-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.TextInput:
        question.name = `it-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.Checkbox:
        question.name = `ic-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.Radio:
        question.name = `ir-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.Select:
        question.name = `sl-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.MixArray:
        question.name = `ma-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.BatteryLevels:
        question.name = `bl-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.File:
        question.name = `file-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.S3File:
        // Amazon AWs S3 upload
        question.name = `aws-file-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.Dropzone:
        question.name = `dropzone-${this.getUniqueId(1)}-${Date.now()}`;
        break;
      case FormElementType.CV:
        question.label = 'Upload your CV (only pdf).';
        question.type = FormElementType.File;
        question.name = 'file-cv';
        if (!item.cell) {
          this.getNestedFormControl(formGrp, `group-${item.groupIndex!}-question-${item.questionIndex!}`).setValue(question.label);
          this.getNestedFormControl(formGrp, `group-${item.groupIndex!}-question-${item.questionIndex!}`).clearValidators();
        } else {
          this.getNestedFormControl(formGrp, `row-${item.cell.row!}-col-${item.cell.col!}-id-${item.cell.index!}`).setValue(question.label);
          this.getNestedFormControl(formGrp, `row-${item.cell.row!}-col-${item.cell.col!}-id-${item.cell.index!}`).clearValidators();
        }
        break;
      case FormElementType.ManagerApproval:
        question.label = `Upload your manager approval (only pdf). The manager approval template can be downloaded <a href="api/upload/${this.managerApprovalFilename}" target="_blank" rel="noopener noreferrer"><mark>here</mark></a>. <strong>[⚠ CHECK LINK !!! You can upload the template in the options]</strong>`;
        question.type = FormElementType.File;
        question.name = 'file-manager-recommendation';
        if (!item.cell) {
          this.getNestedFormControl(formGrp, `group-${item.groupIndex!}-question-${item.questionIndex!}`).setValue(question.label);
          this.getNestedFormControl(formGrp, `group-${item.groupIndex!}-question-${item.questionIndex!}`).clearValidators();
        } else {
          this.getNestedFormControl(formGrp, `row-${item.cell.row!}-col-${item.cell.col!}-id-${item.cell.index!}`).setValue(question.label);
          this.getNestedFormControl(formGrp, `row-${item.cell.row!}-col-${item.cell.col!}-id-${item.cell.index!}`).clearValidators();
        }
        break;
      case FormElementType.OrangeCharter:
        question.label = 'Sign the Charter, then scan and upload it as a pdf file. The Charter "Orange Expert Journey" can be downloaded <a href="assets/misc/MR-letters/Charter_OE_Journey.pdf" target="_blank" rel="noopener noreferrer"><mark>here</mark></a>.';
        question.type = FormElementType.File;
        question.name = 'file-orange-expert-charter';
        if (!item.cell) {
          this.getNestedFormControl(formGrp, `group-${item.groupIndex!}-question-${item.questionIndex!}`).setValue(question.label);
          this.getNestedFormControl(formGrp, `group-${item.groupIndex!}-question-${item.questionIndex!}`).clearValidators();
        } else {
          this.getNestedFormControl(formGrp, `row-${item.cell.row!}-col-${item.cell.col!}-id-${item.cell.index!}`).setValue(question.label);
          this.getNestedFormControl(formGrp, `row-${item.cell.row!}-col-${item.cell.col!}-id-${item.cell.index!}`).clearValidators();
        }
        break;
      default:
        break;
    }

    formGrp.addControl(question.name, new FormControl(''));
  }

  cancelNewFormQuestion(item: AppFormElement) {
    // Delete NewFormQuestion
    if (!item.cell) {
      this.steps[item.stepIndex!].form[item.groupIndex!].questions.splice(item.questionIndex!, 1);
    } else {
      const tableQuestion = this.steps[item.stepIndex!].form[item.groupIndex!].questions[item.questionIndex!];
      tableQuestion.options.rows[item.cell.row!][tableQuestion.options.columns[item.cell.col!].prop].splice(item.cell.index!, 1);
    }

    this.buildFormControlsForStep(this.currentStepIndex);
  }

  addNewGroup() {
    if (this.tmpAppFormItem) {
      if (this.tmpAppFormItem.alignment === 'leading') {
        this.steps[this.tmpAppFormItem.stepIndex!].form.unshift({group: this.newQuestionGroupCtrl.value, questions: []});
        /*this.anyStepForms[this.tmpAppFormItem.stepIndex! - 1].addControl(
          `group-${this.steps[this.tmpAppFormItem.stepIndex!].form.length}-name`,
          new FormControl(this.newQuestionGroupCtrl.value));*/
      } else {
        const grpIdx = this.tmpAppFormItem!.alignment === 'after' ? this.tmpAppFormItem.groupIndex! + 1 : this.tmpAppFormItem.groupIndex!;
        this.steps[this.tmpAppFormItem.stepIndex!].form.splice(grpIdx, 0, {group: this.newQuestionGroupCtrl.value, questions: []});
        /*this.anyStepForms[this.tmpAppFormItem.stepIndex! - 1].addControl(
          `group-${grpIdx}-name`,
          new FormControl(this.newQuestionGroupCtrl.value));*/
      }
      // Update all formControls `group-${grpIdx}-name`
      this.buildFormControlsForStep(this.currentStepIndex);
      this.modalWindow.close('Successfully added a new group!')

    } else {
      this.alertService.danger('Unknown error, something is wrong!');
      this.modalWindow.close('Should never happen!');
    }
  }

  deleteFormTemplateItem(item: AppFormElement) {
    if (item.type == FormType.Step) {
      this.deletionModalTitle = 'Delete the step?';
      this.deletionModalBody = 'The step, as well as all the nested groups and questions, will be deleted from the form template.';
    } else if (item.type === FormType.Group) {
      this.deletionModalTitle = 'Delete the group?';
      this.deletionModalBody = 'The group and all the nested questions will be deleted from the form template.';
    } else if (item.type === FormType.Question) {
      if (item.cell && item.cell.row !== undefined && item.cell.col === undefined) {
        this.deletionModalTitle = 'Delete the row?';
        this.deletionModalBody = 'The row and all nested questions will be deleted from the table.';
      } else if (item.cell && item.cell.row === undefined && item.cell.col !== undefined) {
        this.deletionModalTitle = 'Delete the column?';
        this.deletionModalBody = 'The column and all nested questions will be deleted from the table.';
      } else {
        this.deletionModalTitle = 'Delete the question?';
        this.deletionModalBody = 'The question will be deleted from the form template.';
      }
    }
    this.tmpAppFormItem = item;
    this.openModal(this.deleteFormTemplateModal);
  }

  deleteEntireFormTemplate() {
    this.deletionModalTitle = 'Delete your draft template?';
    this.deletionModalBody = 'Your draft application form template will be deleted.';
    this.tmpAppFormItem = {
      type: FormType.Template
    }
    this.openModal(this.deleteFormTemplateModal);
  }

  onDeletingFormTemplateItem() {
    if (this.tmpAppFormItem) {
      switch (this.tmpAppFormItem.type) {
        case FormType.Step:
          this.steps.splice(this.tmpAppFormItem.stepIndex!, 1);
          this.anyStepForms.splice(this.tmpAppFormItem.stepIndex! - 1, 1);
          this.currentStepIndex--;
          this.steps[this.currentStepIndex].active = true;
          break;

        case FormType.Group:
          this.steps[this.tmpAppFormItem.stepIndex!].form.splice(this.tmpAppFormItem.groupIndex!, 1);
          //this.anyStepForms[this.tmpAppFormItem.stepIndex! - 1].removeControl(`group-${this.tmpAppFormItem.groupIndex!}-name`);
          // Update all formControls `group-${grpIdx}-name`
          this.buildFormControlsForStep(this.currentStepIndex);
          break;

        case FormType.Question:
          // Can be a question (in a group or nested inside a table cell), a table row or a table column
          if (!this.tmpAppFormItem.cell) {
            // Delete a question in a group
            /*this.anyStepForms[this.tmpAppFormItem.stepIndex! - 1].removeControl(`group-${this.tmpAppFormItem.groupIndex!}-question-${this.tmpAppFormItem.questionIndex!}`);
            this.anyStepForms[this.tmpAppFormItem.stepIndex! - 1]
              .removeControl(this.steps[this.tmpAppFormItem.stepIndex!].form[this.tmpAppFormItem.groupIndex!].questions[this.tmpAppFormItem.questionIndex!].name);*/
            this.steps[this.tmpAppFormItem.stepIndex!].form[this.tmpAppFormItem.groupIndex!].questions.splice(this.tmpAppFormItem.questionIndex!, 1);
          } else {
            const tableQuestion = this.steps[this.tmpAppFormItem.stepIndex!].form[this.tmpAppFormItem.groupIndex!].questions[this.tmpAppFormItem.questionIndex!];
            //const tableQuestionFormGrp = this.getNestedFormGroup(this.anyStepForms[this.tmpAppFormItem.stepIndex! - 1], tableQuestion.name);

            if (this.tmpAppFormItem.cell.row !== undefined && this.tmpAppFormItem.cell.col === undefined && this.tmpAppFormItem.cell.index === undefined) {
              // Delete a table row
              /*const deletedRow = tableQuestion.options.rows[this.tmpAppFormItem.cell.row];
              for (const colProp in deletedRow) {
                const colIdx = tableQuestion.options.columns.findIndex((col: any) => col.prop === colProp)
                for (const [idx, question] of deletedRow[colProp].entries()) {
                  if (question.type !== 'none') {
                    tableQuestionFormGrp.removeControl(`row-${this.tmpAppFormItem.cell.row}-col-${colIdx}-id-${idx}`);
                    tableQuestionFormGrp.removeControl(question.name);
                  }
                }
              }*/
              tableQuestion.options.rows.splice(this.tmpAppFormItem.cell.row, 1);

            } else if (this.tmpAppFormItem.cell.row === undefined && this.tmpAppFormItem.cell.col !== undefined && this.tmpAppFormItem.cell.index === undefined) {
              // Delete a table column
              const deletedColumn = tableQuestion.options.columns[this.tmpAppFormItem.cell.col];
              for (const row of tableQuestion.options.rows) {
                /*for (const [idx, question] of row[deletedColumn.prop].entries()) {
                  if (question.type !== 'none') {
                    tableQuestionFormGrp.removeControl(`row-${rowIdx}-col-${this.tmpAppFormItem.cell.col}-id-${idx}`);
                    tableQuestionFormGrp.removeControl(question.name);
                  }
                }*/
                delete row[deletedColumn.prop];
              }
              tableQuestion.options.columns.splice(this.tmpAppFormItem.cell.col, 1);

            } else {
              // Delete a question nested in a table cell
              /*tableQuestionFormGrp.removeControl(`row-${this.tmpAppFormItem.cell.row!}-col-${this.tmpAppFormItem.cell.col!}-id-${this.tmpAppFormItem.cell.index!}`);
              tableQuestionFormGrp.removeControl(tableQuestion.options.rows[this.tmpAppFormItem.cell.row!][tableQuestion.options.columns[this.tmpAppFormItem.cell.col!].prop][this.tmpAppFormItem.cell.index!].name);*/
              tableQuestion.options.rows[this.tmpAppFormItem.cell.row!][tableQuestion.options.columns[this.tmpAppFormItem.cell.col!].prop].splice(this.tmpAppFormItem.cell.index!, 1);
            }
          }

          // Update all formControls `group-${j}-question-${k}` and `row-${rIdx}-col-${cIdx}-id-${qIdx}`
          this.buildFormControlsForStep(this.currentStepIndex);
          break;

        case FormType.Template:
          localStorage.removeItem('formTemplateWizard');
          this.communityService.deleteAppFormDraft(this.communityId, this.formType).subscribe({
            next: community => {
              this.modalWindow.close('Successfully deleted the application form template!');
              this.alertService.success(`Your ${this.formType} application form template has been successfully deleted. You will be redirected in a few seconds...`);

              setTimeout(() => {
                this.alertService.clear();
                this.steps = [];
                this.router.navigate(['/' + this.urlPrefix + '/dashboard/communities']);
              }, 4000);
            },
            error: err => {
              this.modalWindow.close('Error when deleting the application form template :(');
              this.alertService.danger(err);
            }
          });
          break;
      }

      if (this.tmpAppFormItem.type !== FormType.Template) {
        this.saveForm();
        this.modalWindow.close(`Successfully deleted the ${this.tmpAppFormItem.type}!`)
      }
    } else {
      this.alertService.danger('Unknown error, something is wrong!');
      this.modalWindow.close('Should never happen!');
    }
  }

  updateLabelFor(item: AppFormElement) {
    switch (item.type) {
      case FormType.Group:
        const groupNameCtrl = this.getNestedFormControl(this.anyStepForms[item.stepIndex! - 1], `group-${item.groupIndex}-name`);
        this.steps[item.stepIndex!].form[item.groupIndex!].group = groupNameCtrl.value;
        break;

      case FormType.Question:
        // Can be a question in a group, a question nested inside a table cell, or a column name
        if (!item.cell) {
          // Modify the label of a question in a group
          const labelCtrl = this.getNestedFormControl(this.anyStepForms[item.stepIndex! - 1], `group-${item.groupIndex}-question-${item.questionIndex}`);
          if (!labelCtrl.hasError('required')) {
            this.steps[item.stepIndex!].form[item.groupIndex!].questions[item.questionIndex!].label = labelCtrl.value;
          } else {
            this.alertService.warning('Your question is empty!');
            //this.steps[item.stepIndex!].form[item.groupIndex!].questions[item.questionIndex!].label = 'Write your question here...';
          }
        } else {
          // Modify the label of a question nested in a table cell
          const tableQuestion = this.steps[item.stepIndex!].form[item.groupIndex!].questions[item.questionIndex!];
          if (item.cell.col !== undefined && item.cell.alignment !== undefined && item.cell.row === undefined && item.cell.index === undefined) {
            tableQuestion.options.columns[item.cell.col].name = item.cell.alignment;
          } else {
            const tableQuestionFormGrp = this.getNestedFormGroup(this.anyStepForms[item.stepIndex! - 1], tableQuestion.name);
            const labelCtrl = this.getNestedFormControl(tableQuestionFormGrp, `row-${item.cell.row}-col-${item.cell.col}-id-${item.cell.index}`);
            if (!labelCtrl.hasError('required')) {
              tableQuestion.options.rows[item.cell.row!][tableQuestion.options.columns[item.cell.col!].prop][item.cell.index!].label = labelCtrl.value;
            } else {
              this.alertService.warning('Your question is empty!');
              //tableQuestion.options.rows[item.cell.row!][tableQuestion.options.columns[item.cell.col!].prop][item.cell.index!].label = 'Write your question here...';
            }
          }
        }
        break;
    }
  }

  configureOptions(item: AppFormElement) {
    this.tmpAppFormItem = item;

    const q = this.steps[item.stepIndex!].form[item.groupIndex!].questions[item.questionIndex!];
    const question = !item.cell ? q
      : q.options.rows[item.cell.row!][q.options.columns[item.cell.col!].prop][item.cell.index!];

    this.mandatoryQuestion = question.options && question.options.mandatory === true;
    if (this.mandatoryQuestion) {
      this.mandatoryHint = question.options.mandatoryHint || '';
    }
    this.previewQuestion = question.options && question.options.review === true;
    if (this.previewQuestion) {
      this.previewTitle = question.options.preview || '';
    }
    this.questionType = question.type;

    this.showOptionsForMixArray = false;
    this.useOwnIdentifier = 0;
    this.ownIdentifier = '';

    switch (question.type) {
      case FormElementType.Textarea:
        this.textareaHeight = question.options?.height?.replace('px', '') ?? '';
        break;

      case FormElementType.Select:
        question.options = question.options || {items: []};
        this.optionLabels = question.options.items;
        this.widthClass = question.options.widthClass || '';
        if (this.widthClass === 'col-12' || this.widthClass === 'w-100') {
          // this can be remove later, just for backward compatibility
          this.widthClass = 'col-md-12';
        }
        this.optionLabelFormCtrls = this.formBuilder.array(this.optionLabels.map((option: any) => new FormControl(option)));
        break;

      case FormElementType.Checkbox:
        question.options = question.options || {items: {}};
        question.options.items.fullscreen = question.options.items.fullscreen || [];
        question.options.items.left = question.options.items.left || [];
        question.options.items.right = question.options.items.right || [];
        this.checkboxDisplayMode = question.options.items.fullscreen.length > 0 ? 'fullwidth' : 'halfwidth';
        this.optionLabels = question.options.items.fullscreen;
        this.checkboxLeftLabels = question.options.items.left;
        this.checkboxRightLabels = question.options.items.right;
        this.optionLabelFormCtrls = this.formBuilder.array(this.optionLabels.map((option: any) => new FormControl(option.label)));
        this.checkboxLeftLabelFormCtrls = this.formBuilder.array(this.checkboxLeftLabels.map((option: any) => new FormControl(option.label)));
        this.checkboxRightLabelFormCtrls = this.formBuilder.array(this.checkboxRightLabels.map((option: any) => new FormControl(option.label)));

        if (item.cell) {
          this.showOptionsForMixArray = true;
          this.useOwnIdentifier = question.id ? 1 : 0;
          this.ownIdentifier = question.id || '';
        }
        break;

      case FormElementType.Radio:
        question.options = question.options || {items: []};
        this.optionLabels = question.options.items;
        this.widthClass = question.options.widthClass || '';
        if (this.widthClass === 'col-12' || this.widthClass === 'w-100') {
          // this can be remove later, just for backward compatibility
          this.widthClass = 'col-md-12';
        }
        this.optionLabelFormCtrls = this.formBuilder.array(this.optionLabels.map((option: any) => new FormControl(option.label)));

        if (item.cell) {
          this.showOptionsForMixArray = true;
          this.useOwnIdentifier = question.id ? 1 : 0;
          this.ownIdentifier = question.id || '';
        }
        break;

      case FormElementType.BatteryLevels:
        question.options = question.options || {items: []};
        this.optionLabels = question.options.items;
        this.optionLabelFormCtrls = this.formBuilder.array(this.optionLabels.map((option: any) => new FormControl(option.label)));
        break;

      case FormElementType.S3File:
        this.fileInputAccept = question.options?.accept ?? 'application/pdf';
        break;

      case FormElementType.File:
        if (question.name === 'file-manager-recommendation') {
          this.questionType = FormElementType.ManagerApproval;
        }
        break;
    }

    this.openModal(this.optionsTemplateModal, { scrollable: true, size: 'xl' });
  }

  previewQuestionInReviews(event: any) {
    this.previewQuestion = event.target.checked;
  }

  setQuestionAsMandatory(event: any) {
    this.mandatoryQuestion = event.target.checked;
  }

  applyOptions() {
    const q = this.steps[this.tmpAppFormItem!.stepIndex!].form[this.tmpAppFormItem!.groupIndex!].questions[this.tmpAppFormItem!.questionIndex!];
    const question = !this.tmpAppFormItem!.cell ? q
      : q.options.rows[this.tmpAppFormItem!.cell.row!][q.options.columns[this.tmpAppFormItem!.cell.col!].prop][this.tmpAppFormItem!.cell.index!];

    if ((question.type === FormElementType.Checkbox || question.type === FormElementType.Radio)
      && this.useOwnIdentifier && this.ownIdentifier && this.checkQuestionIdAlreadySet(this.ownIdentifier)) {
        this.alertService.danger('Identifier already used! Please choose another identifier.');
        return;
    }

    if (this.mandatoryQuestion) {
      question.options = question.options || {};
      question.options['mandatory'] = true;
      question.options['mandatoryHint'] = this.mandatoryHint;
    } else {
      delete question.options?.mandatory;
      delete question.options?.mandatoryHint;
    }

    if (this.previewQuestion) {
      question.options = question.options || {};
      question.options['review'] = true;
      question.options['preview'] = this.previewTitle;
    } else {
      delete question.options?.review;
      delete question.options?.preview;
    }

    switch (question.type) {
      case FormElementType.Textarea:
        this.textareaHeight = this.textareaHeight.trim();
        if (this.textareaHeight && this.isNumeric(this.textareaHeight)) {
          question.options = question.options || {};
          question.options['height'] = this.textareaHeight + 'px';
          // Refresh the current template page to show how it renders...
          jQuery('ckeditor#' + question.name + ' .cke_contents.cke_reset').css('height', question.options.height);
        } else {
          if (question.options && question.options.height !== undefined) {
            delete question.options.height;
          }
          jQuery('ckeditor#' + question.name + ' .cke_contents.cke_reset').css('height', '300px');
        }
        break;

      case FormElementType.Select:
        question.options['widthClass'] = this.widthClass || 'col-md-auto';
        break;

      case FormElementType.Checkbox:
        if (this.checkboxDisplayMode === 'fullwidth') {
          delete question.options.items.left;
          delete question.options.items.right;
        } else {
          delete question.options.items.fullscreen;
        }

        if (this.useOwnIdentifier && this.ownIdentifier) {
          question['id'] = this.ownIdentifier;
          question.name = this.ownIdentifier;
        }
        break;

      case FormElementType.Radio:
        question.options['widthClass'] = this.widthClass;

        if (this.useOwnIdentifier && this.ownIdentifier) {
          question['id'] = this.ownIdentifier;
          question.name = this.ownIdentifier;
        }
        break;

      case FormElementType.S3File:
        question.options['accept'] = this.fileInputAccept;
        break
    }

    this.modalWindow.close(`Successfully set options for the ${this.tmpAppFormItem!.type}!`)
  }

  dropOptionLabel(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.optionLabels, event.previousIndex, event.currentIndex);
    this.optionLabelFormCtrls = this.formBuilder.array(this.optionLabels.map((option: any) => new FormControl(option.label || option)));
  }

  dropHalfwidthLabel(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    this.checkboxLeftLabelFormCtrls = this.formBuilder.array(this.checkboxLeftLabels.map((option: any) => new FormControl(option.label)));
    this.checkboxRightLabelFormCtrls = this.formBuilder.array(this.checkboxRightLabels.map((option: any) => new FormControl(option.label)));
  }

  startEditingOptionLabel(event: string, index: number) {
    this.editingOptionLabelIndex = event === 'edit' ? index : -1;
  }

  modifyOptionLabel(labels: any[], fa: FormArray, idx: number) {
    if (typeof labels[idx] === 'object') {
      labels[idx].label = this.getOptionLabelFormControl(fa, idx).value;
    } else {
      labels[idx] = this.getOptionLabelFormControl(fa, idx).value;
    }
  }

  deleteOptionLabel(labels: any[], fa: FormArray, idx: number) {
    labels.splice(idx, 1);
    fa.removeAt(idx);
  }

  addOptionLabel() {
    const label = this.newOptionLabel.trim();

    if (label !== '') {
      const q = this.steps[this.tmpAppFormItem!.stepIndex!].form[this.tmpAppFormItem!.groupIndex!].questions[this.tmpAppFormItem!.questionIndex!];
      const question = !this.tmpAppFormItem!.cell ? q
        : q.options.rows[this.tmpAppFormItem!.cell.row!][q.options.columns[this.tmpAppFormItem!.cell.col!].prop][this.tmpAppFormItem!.cell.index!];

      switch (question.type) {
        case FormElementType.Select:
          this.optionLabels.push(label);
          break;

        case FormElementType.Checkbox:
          this.optionLabels.push({label, name: `c-${this.getUniqueId(1)}-${Date.now()}`});
          break;

        case FormElementType.Radio:
          this.optionLabels.push({label, name: `r-${this.getUniqueId(1)}-${Date.now()}`});
          break;

        case FormElementType.BatteryLevels:
          this.optionLabels.push({label, name: `b-${this.getUniqueId(1)}-${Date.now()}`});
          break;
      }

      this.optionLabelFormCtrls.push(new FormControl(label));

      this.newOptionLabel = '';
    }
  }

  addLeftOptionLabel(label: string) {
    this.checkboxLeftLabels.push({label, name: `c-${this.getUniqueId(1)}-${Date.now()}`});
    this.checkboxLeftLabelFormCtrls.push(new FormControl(label));
  }

  addRightOptionLabel(label: string) {
    this.checkboxRightLabels.push({label, name: `c-${this.getUniqueId(1)}-${Date.now()}`});
    this.checkboxRightLabelFormCtrls.push(new FormControl(label));
  }

  getOptionLabelFormControl(fa: FormArray, index: number) {
    return fa.at(index) as FormControl;
  }

  openModal(content: any, options?: any) {
    this.modalWindow = this.modalService.open(content, options);
  }

  managerApprovalChange(input: HTMLInputElement) {
    if (input.files?.length) {
      const acceptItems = ['.doc','.docx','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (acceptItems.findIndex((item: string) => input.files![0].type === item) === -1) {
        this.managerApprovalUploadError = 'Error: authorized file types are: ' + acceptItems.join(', ');
        // we will check the file type on the back-end side
        // https://bugs.launchpad.net/ubuntu/+source/firefox/+bug/84880
      } else {
        this.managerApprovalUploadError = '';
        this.uploadManagerApprovalButton = '<i class="fa fa-spinner fa-pulse fa-fw"></i>';

        // Upload the file
        const formData = new FormData();
        formData.append('filefield', input.files[0], this.managerApprovalFilename);

        this.fileUploadService.uploadFile(formData).subscribe({
          next: result => {
            this.uploadManagerApprovalButton = '<i class="fa fa-upload"></i>';
            if (result.success) {
              this.managerApprovalFile = this.managerApprovalFilename;
            }
          },
          error: error => {
            this.uploadManagerApprovalButton = '<i class="fa fa-upload"></i>';
            this.managerApprovalUploadError = error;

            this.managerApprovalFile = '';
          }
        });
      }
    }
  }

  removeManagerApprovalFile(): void {
    this.fileUploadService.deleteFile(this.user['_id'], this.managerApprovalFilename).subscribe();
    this.managerApprovalFile = '';
  }

  private isNumeric(value: string) {
    return /^\d+$/.test(value);
  }

  private getUniqueId(parts: number): string {
    const stringArr = [];
    for(let i = 0; i< parts; i++){
      // tslint:disable-next-line:no-bitwise
      const S4 = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      stringArr.push(S4);
    }
    return stringArr.join('-');
  }

  setEventNotification(event: any): void {
    this.alertService.unknown(event.type, event.message);
  }
}
