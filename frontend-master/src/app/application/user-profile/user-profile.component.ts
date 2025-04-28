import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
//import { CommunityService } from '../../common/ng-services/community.service';
import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { UserService } from '../../common/ng-services/user.service';
import { FormService } from '../../common/ng-services/form.service';
import { FileUploadService } from '../../common/ng-services/file-upload.service';
import { AlertService } from '../../common/ng-services/alert';
import { CookieService } from 'ngx-cookie';

import { User } from '../../common/ng-models/user';
//import { Community } from '../../common/ng-models/community';

@Component({
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  providers: [FormValidationService]
})
export class UserProfileComponent implements OnInit {
  //communities!: Community[];

  user!: User; /* i.e. connected user */
  userToDisplay!: User | null;
  userToDisplayPhotoSrc: any = 'assets/img/avatars/profile.png';
  userToDisplayId!: string | null;
  userToDisplay$!: Observable<User | null>;

  profileForm!: FormGroup;
  accountForm!: FormGroup;
  deleteForm!: FormGroup;

  profileHasError = false;
  accountHasError = false;
  deleteHasError = false;

  profileButtonLabel = '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp; Update';
  accountButtonLabel = '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp; Update';

  modalWindow!: NgbModalRef;

  constructor(
    private titleService: Title,
    private userProfileService: UserProfileService,
    //private communityService: CommunityService,
    private userService: UserService,
    private formService: FormService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formValidationService: FormValidationService,
    private modalService: NgbModal,
    private alertService: AlertService,
    private fileUploadService: FileUploadService,
    private sanitizer : DomSanitizer,
    private router: Router,
    private cookieService: CookieService) { this.titleService.setTitle('User Profile'); }

  buildUserData = (error: any): void => {
    if (error) {
      this.alertService.danger(error);

    } else {
      this.user = this.userProfileService.user!;
      if (!this.userToDisplay) {
        this.userToDisplay = this.user;
      }

      this.profileForm.setValue({
        'photo': this.userToDisplay.photo || '',
        'directoryUrl': this.userToDisplay.directoryUrl || '',
        'firstname': this.userToDisplay.firstname || '',
        'lastname': this.userToDisplay.lastname || '',
        'gender': this.userToDisplay.gender || '',
        'birthday': this.userToDisplay.birthday || '',
        'cuid': this.userToDisplay.cuid || '',
        'email': this.userToDisplay.email || '',
        'phone': this.userToDisplay.phone || '',
        'classification': this.userToDisplay.classification || '',
        'entity': this.userToDisplay.entity || '',
        'country': this.userToDisplay.country || '',
        'location': this.userToDisplay.location || '',
        'managerFirstname': this.userToDisplay.managerFirstname || '',
        'managerLastname': this.userToDisplay.managerLastname || '',
        'managerEmail': this.userToDisplay.managerEmail || '',
        'hrFirstname': this.userToDisplay.hrFirstname || '',
        'hrLastname': this.userToDisplay.hrLastname || '',
        'hrEmail': this.userToDisplay.hrEmail || ''
      });

      this.accountForm.patchValue({
        email: this.userToDisplay.email,
        /*role: this.userToDisplay.role,
        status: this.userToDisplay.status ? this.userToDisplay.status: 'None',
        community: this.userToDisplay.community*/
      });

      this.deleteForm = this.formBuilder.group({
        'email': ['', Validators.compose([Validators.required, this.formValidationService.isThisEmailValidator(this.userToDisplay.email)])],
        'confirm': ['',
          Validators.compose([Validators.required,
            this.formValidationService.deleteAccountConfirmationValidator(
              (this.user.role === 'Referent' || this.user.role === 'Admin')
                && this.user.email !== this.userToDisplay.email ? 'delete the account' : 'delete my account'
            )
          ])
        ]
      });

      if (this.userToDisplay.photo) {
        this.fileUploadService.getFile(this.userToDisplay._id, `${this.userToDisplay._id}-profile-photo`)
          .subscribe({
            next: (resp: Blob) => {
              this.userToDisplayPhotoSrc = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(new Blob([resp])));
            },
            error: error => {
              console.error(error);
            }
        });
      }
    }
  }

  ngOnInit() {
    // Init list of communities
    /*this.communityService.listCommunities({ id: 'name', includes: 1 }).subscribe(
      communities => {
        this.communities = communities;
      }
    );*/

    // Uncomment hereafter to have validations on the form
    this.profileForm = this.formBuilder.group({
      'photo': [''],
      'directoryUrl': ['', Validators.compose([Validators.required, this.formValidationService.urlValidator])],
      'firstname': ['', Validators.required],
      'lastname': ['', Validators.required],
      'gender': [''],
      'birthday': ['', this.formValidationService.birthdayValidator],
      'cuid': ['', Validators.compose([Validators.required, this.formValidationService.cuidValidator])],
      'email': [''],
      'phone': ['', Validators.compose([Validators.required, this.formValidationService.phoneValidator])],
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

    this.accountForm = this.formBuilder.group({
      'email': ['', this.formValidationService.emailValidator],
      'password': ['', this.formValidationService.newPasswordValidator],
      'confirmPassword': [''],
      // 'role': ['Applicant'],
      'account': ['Select an action'],
      /*'status': ['None'],
      'community': ['Applicant'], */
    }, { validators: this.formValidationService.matchingPasswords('password', 'confirmPassword') });


    this.userToDisplay$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        this.userToDisplayId = params.get('id');
        if (this.userToDisplayId) {
          return this.userService.getUser(this.userToDisplayId);
        } else {
          return of(null);
        }
      }));

    this.userToDisplay$.subscribe({
      next: foundUser => { // this corresponds to a Referent or Admin display a user profile
        this.userToDisplay = foundUser;
        this.userProfileService.getProfile(this.buildUserData);
      },
      error: error => {
        this.modalWindow.close('Error with the userToDisplay$ observable');
        this.alertService.danger('Error when getting info about the user to display.');
      }
    });
  }

  updateProfile() {
    this.profileHasError = !this.profileForm.valid;

    if (!this.profileHasError
      && this.profileButtonLabel !== '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Update') {
      this.profileButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Update';
      this.userService.updateUser(this.userToDisplay!._id,
        undefined, undefined,
        this.profileForm.value.directoryUrl?.trim() || undefined,
        this.profileForm.value.firstname || undefined,
        this.profileForm.value.lastname?.toUpperCase() || undefined,
        this.profileForm.value.gender || undefined, this.profileForm.value.birthday || undefined,
        this.profileForm.value.cuid?.toLowerCase() || undefined, this.profileForm.value.email?.toLowerCase() || undefined,
        this.profileForm.value.phone || undefined, this.profileForm.value.classification || undefined,
        this.profileForm.value.entity || undefined, this.profileForm.value.country || undefined,
        this.profileForm.value.location || undefined,
        this.profileForm.value.managerFirstname || undefined, this.profileForm.value.managerLastname || undefined,
        this.profileForm.value.managerEmail?.trim()?.toLowerCase() || undefined,
        this.profileForm.value.hrFirstname || undefined, this.profileForm.value.hrLastname || undefined,
        this.profileForm.value.hrEmail?.trim()?.toLowerCase() || undefined).subscribe({
          next: user => {
            this.userToDisplay = user;
            if (this.user['_id'] === this.userToDisplay['_id']) {
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
              this.alertService.success('Your profile information has been updated successfully.');
            } else {
              this.alertService.success('The user profile information has been updated successfully.');
            }
            this.profileButtonLabel = '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp; Update';
            this.alertService.setAlertTimeout(4000);
          },
          error: error => {
            this.profileButtonLabel = '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp; Update';
            this.alertService.danger(error);
            this.alertService.setAlertTimeout(4000);
          }
        });
    }
  }

  get profileFormUserPhoto() {
    return this.profileForm.get('photo') as FormControl;
  }

  get accountFormEmail() {
    return this.accountForm.get('email') as FormControl;
  }

  get accountFormPassword() {
    return this.accountForm.get('password') as FormControl;
  }

  get accountFormConfirmPassword() {
    return this.accountForm.get('confirmPassword') as FormControl;
  }

  updateAccount() {
    this.accountHasError = !this.accountForm.valid;

    if ((!this.accountHasError || (this.user['_id'] !== this.userToDisplay!._id && !this.accountForm.value.password && !this.accountForm.controls['email'].errors))
      && this.accountButtonLabel !== '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Update') {
      this.accountButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>&nbsp; Update';

      this.userService.updateUserAccount(this.userToDisplay!._id,
        this.accountForm.value.email, this.accountForm.value.password || undefined,
        this.accountForm.value.account === 'Select an action' ? undefined : this.accountForm.value.account).subscribe({
          next: user => {
            if (this.user['_id'] === this.userToDisplay!._id) {
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
              this.alertService.success('Your password has been modified successfully.');
            } else {
              this.alertService.success('The user account has been updated successfully.');
              if (this.accountForm.value.email !== this.userToDisplay!.email) {
                this.profileForm.patchValue({
                  email: this.accountForm.value.email
                });
                this.userToDisplay = user;
              }
            }
            this.accountButtonLabel = '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp; Update';
            this.alertService.setAlertTimeout(4000);
          },
          error: error => {
            this.accountButtonLabel = '<i class="fa fa-refresh" aria-hidden="true"></i>&nbsp; Update';
            this.alertService.danger(error);
            this.alertService.setAlertTimeout(4000);
          }
        });
    }
  }

  get deleteFormEmail() {
    return this.deleteForm.get('email') as FormControl;
  }

  get deleteFormConfirm() {
    return this.deleteForm.get('confirm') as FormControl;
  }

  deleteAccount() {
    this.deleteHasError = !this.deleteForm.valid;

    if (!this.deleteHasError) {
      // delete the user account
      // This request also deletes all user's forms!
      this.userService.deleteUser(this.userToDisplay!._id).subscribe({
        next: deletedUser => {
          this.modalWindow.close('bye bye user');
          // logout user if not referent or admin
          if (this.user['_id'] === this.userToDisplay!._id) {
            this.cookieService.remove('oema');
            this.cookieService.remove('oemaEmail');
            // this.cookieService.removeAll();
            this.router.navigate([`${this.router.url.split('/')[1]}/auth/login`]);
          } else {
            this.alertService.success('The user account has been deleted successfully.');
          }
        },
        error: error => {
          this.modalWindow.close('error when deleting user account :(');
          this.alertService.danger(error);
        }
      });
    }
  }

  openAccountDeletionModal(content: any) {
    this.modalWindow = this.modalService.open(content, { windowClass: 'modal-danger' });
  }
}
