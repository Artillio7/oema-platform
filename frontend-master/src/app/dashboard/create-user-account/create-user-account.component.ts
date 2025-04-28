import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { UserService } from '../../common/ng-services/user.service';
import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { AlertService } from '../../common/ng-services/alert';

import { User } from '../../common/ng-models/user';

@Component({
  templateUrl: './create-user-account.component.html',
  providers: [FormValidationService]
})
export class CreateUserAccountComponent implements OnInit {
  user!: User; /* i.e. connected user */
  createdUser?: User;

  accountForm!: FormGroup;
  profileForm!: FormGroup;

  accountHasError = false;
  profileHasError = false;

  accountButtonLabel = '<i class="fa fa-user-plus" aria-hidden="true"></i>&nbsp; Create';
  profileButtonLabel = '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp; Save';

  constructor(
    private titleService: Title,
    private userProfileService: UserProfileService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private formValidationService: FormValidationService,
    private alertService: AlertService) {
    this.titleService.setTitle('Create new user account');
  }

  ngOnInit() {
    this.accountForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required, this.formValidationService.emailValidator])],
      password: ['', Validators.compose([Validators.required, this.formValidationService.passwordValidator])],
      confirmPassword: ['', Validators.required]
    }, { validators: this.formValidationService.matchingPasswords('password', 'confirmPassword') });

    this.profileForm = this.formBuilder.group({
      'directoryUrl': ['', Validators.compose([Validators.required, this.formValidationService.urlValidator])],
      'firstname': ['', Validators.required],
      'lastname': ['', Validators.required],
      'gender': [''],
      'birthday': ['', this.formValidationService.birthdayValidator],
      'cuid': ['', Validators.compose([Validators.required, this.formValidationService.cuidValidator])],
      'email': [''],
      'phone': ['', Validators.required],
      'classification': ['', Validators.required],
      'entity': ['', Validators.required],
      'country': ['', Validators.required],
      'location': ['', Validators.required],
      'managerFirstname': ['', Validators.required],
      'managerLastname': ['', Validators.required],
      'managerEmail': ['', Validators.compose([Validators.required, this.formValidationService.emailValidator])],
      'hrFirstname': ['', Validators.required],
      'hrLastname': ['', Validators.required],
      'hrEmail': ['', Validators.compose([Validators.required, this.formValidationService.emailValidator])]
    });

    this.userProfileService.getProfile(this.getUserData);
  }

  getUserData = (error: any): void => {
    if (error) {
      this.alertService.danger(error);
    } else {
      this.user = this.userProfileService.user!;
    }
  }

  get accountEmail() {
    return this.accountForm.get('email') as FormControl;
  }

  get accountPassword() {
    return this.accountForm.get('password') as FormControl;
  }

  get accountConfirmPassword() {
    return this.accountForm.get('confirmPassword') as FormControl;
  }

  createUserAccount() {
    this.accountHasError = !this.accountForm.valid;

    if (!this.accountHasError
      && this.accountButtonLabel !== '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Create') {
      this.accountButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Create';
      this.userService.createUser(this.accountForm.value.email, this.accountForm.value.password).subscribe({
        next: user => {
          this.createdUser = user;
          this.accountForm.reset();
          this.accountButtonLabel = '<i class="fa fa-user-plus" aria-hidden="true"></i>&nbsp; Create';
          this.alertService.success('The user account has been created successfully!');
          this.profileForm.patchValue({'email': this.createdUser.email || ''});
          this.alertService.setAlertTimeout(4000);
        },
        error: error => {
          this.accountButtonLabel = '<i class="fa fa-user-plus" aria-hidden="true"></i>&nbsp; Create';
          if (error.includes('Document already created.')) {
            error = 'The user already exists.';
          }
          this.alertService.danger(error);
          this.alertService.setAlertTimeout(4000);
        }
      });
    }
  }

  updateCreatedUserProfile() {
    this.profileHasError = !this.profileForm.valid;

    if (!this.profileHasError
      && this.profileButtonLabel !== '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Save') {
      this.profileButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Save';
      this.userService.updateUser(this.createdUser!._id,
        undefined, undefined,
        this.profileForm.value.directoryUrl || undefined,
        this.profileForm.value.firstname || undefined,
        this.profileForm.value.lastname ? this.profileForm.value.lastname.toUpperCase() : undefined,
        this.profileForm.value.gender || undefined, this.profileForm.value.birthday || undefined,
        this.profileForm.value.cuid.toLowerCase() || undefined, this.profileForm.value.email.toLowerCase() || undefined,
        this.profileForm.value.phone || undefined, this.profileForm.value.classification || undefined,
        this.profileForm.value.entity || undefined, this.profileForm.value.country || undefined,
        this.profileForm.value.location || undefined,
        this.profileForm.value.managerFirstname || undefined, this.profileForm.value.managerLastname || undefined,
        this.profileForm.value.managerEmail.toLowerCase() || undefined,
        this.profileForm.value.hrFirstname || undefined, this.profileForm.value.hrLastname || undefined,
        this.profileForm.value.hrEmail.toLowerCase() || undefined).subscribe({
          next: user => {
            this.profileButtonLabel = '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp; Save';
            this.alertService.success(`The profile information for the user ${user.email} has been updated successfully.`);
            this.alertService.setAlertTimeout(4000);
          },
          error: error => {
            this.profileButtonLabel = '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp; Save';
            this.alertService.danger(error);
            this.alertService.setAlertTimeout(4000);
          }
        });
    }
  }
}
