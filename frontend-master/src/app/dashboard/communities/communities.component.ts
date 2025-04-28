import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';

import { Observable, OperatorFunction, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { FormValidationService } from '../../common/ng-services/form-validation.service';
import { UserService } from '../../common/ng-services/user.service';
import { AlertService } from '../../common/ng-services/alert';

import { Community, FormModification } from '../../common/ng-models/community';
import { User, FAKE_SENIOR_ORANGE_EXPERTS_FLAG } from '../../common/ng-models/user';
import { Domain } from '../../common/ng-models/app-config';

import { AppConfig } from '../../app.config';

interface SelectedCommunity {
  name: string;
  referentName: string;
  referentMail: string;
  referentId: string;
  searchMail: string;
}

interface Referent {
  name: string;
  email: string;
  id: string;
  checked: boolean;
}

@Component({
  templateUrl: './communities.component.html',
  styleUrls: ['./communities.component.scss'],
  providers: [FormValidationService]
})
export class CommunitiesComponent implements OnInit {
  urlPrefix: string;
  appDomain: Domain;
  communities: Community[] = [];

  selectedCommunity: SelectedCommunity = {
    name: '',
    referentName: '',
    referentMail: '',
    referentId: '',
    searchMail: ''
  };
  selectedCommunityIndex = -1;
  selectedFormType = 'new';
  communityNameCtrl!: FormControl;
  communityReferentMailCtrl!: FormControl;

  otherReferents: Referent[] = [];

  shouldUpdateCommunity = false;

  referentSearching = false;
  referentSearchFailed = false;

  enteredEmail!: string;
  userSearching = false;
  userSearchFailed = false;
  foundUserId!: string;
  foundUserEmail!: string;

  addingMoreReferent = false;
  removingOtherReferents = false;
  isSeniorOrangeExpert = false;

  formModificationChoice = 'Select an action to perform';
  formModificationDescription = '';
  formModification = '';

  FormModification = FormModification;

  searchReferentByEmail: OperatorFunction<string, readonly { _id: string, email: string, lastname?: string, firstname?: string }[]>
    = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => { this.referentSearching = true; }),
        switchMap(term =>
          this.userService.search({ id: 'email', operator: 'includes', value: term === '' ? '#' : term })
            .pipe(
              tap(() => this.referentSearchFailed = false),
              catchError(() => {
                this.referentSearchFailed = true;
                return of([]);
              })
            )
        ),
        tap(() => this.referentSearching = false)
      )

  formatterReferentEmail = (x: { _id: string, email: string, firstname: string, lastname: string } | string) => {
    this.selectedCommunity.searchMail = this.selectedCommunity.referentMail;
    this.selectedCommunity.referentId = '';

    if (x) {
      if (typeof x === 'object') {
        this.selectedCommunity.referentId = x['_id'] || '';
        this.selectedCommunity.referentName = `${x.firstname || '' } ${x.lastname || ''}`;
        this.selectedCommunity.referentMail = x['email'];
        this.selectedCommunity.searchMail = x['email'];
        return `${x.email}`;
      } else {
        return x.trim();
      }
    }

    return '';
  }
  searchUserByEmail: OperatorFunction<string, readonly { _id: string, email: string, lastname?: string, firstname?: string }[]>
    = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => { this.userSearching = true; }),
        switchMap(term =>
          this.userService.search({ id: 'email', operator: 'includes', value: term === '' ? '#' : term })
            .pipe(
              tap(() => this.userSearchFailed = false),
              catchError(() => {
                this.userSearchFailed = true;
                return of([]);
              })
            )
        ),
        tap(() => this.userSearching = false)
      )

  formatterEmail = (x: { _id: string, email: string, lastname: string, firstname: string }) => {
    if (x) {
      this.foundUserId = x['_id'];
      this.foundUserEmail = x['email'];
      return `${x.email}${x.firstname && x.lastname ? ' (' + x.firstname + ' ' + x.lastname + ')' : ''}`;
    }
    return '';
  }

  constructor(
    public appConfig: AppConfig,
    private titleService: Title,
    private userProfileService: UserProfileService,
    private communityService: CommunityService,
    private formValidationService: FormValidationService,
    private userService: UserService,
    private alertService: AlertService,
    private router: Router) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    this.titleService.setTitle(this.appDomain.community);
  }

  ngOnInit() {
    // Init list of communities
    this.communityService.listCommunities(
      { id: '_id', includes: 1 }, { id: 'name', includes: 1 }, { id: 'flag', includes: 1 },
      { id: 'referentName', includes: 1 }, { id: 'referentMail', includes: 1 },
      { id: 'newForm', includes: 1 }, { id: 'renewalForm', includes: 1 },
      { id: 'newFormDraft', includes: 1 }, { id: 'renewalFormDraft', includes: 1 },
      { id: 'newFormBackup', includes: 1 }, { id: 'renewalFormBackup', includes: 1 },

      { id: 'newSeniorForm', includes: 1 }, { id: 'renewalSeniorForm', includes: 1 },
      { id: 'newSeniorFormDraft', includes: 1 }, { id: 'renewalSeniorFormDraft', includes: 1 },
      { id: 'newSeniorFormBackup', includes: 1 }, { id: 'renewalSeniorFormBackup', includes: 1 },
      {forms: 1},
      { group: this.urlPrefix }
    ).subscribe({
      next: communities => {
        this.communities.push(...communities);

        if (this.urlPrefix.endsWith('orange-experts')) {
          this.communityService.listReferentsByCommunityId(FAKE_SENIOR_ORANGE_EXPERTS_FLAG.toString()).subscribe({
            next: users => {
              let seniorReferentName = 'No Referent found!';
              let seniorReferentMail = 'Click here to add a Referent by email';
              let seniorReferentId = '';

              if (users.length) {
                const user = users.find((u) => ((u as any).role.referent & FAKE_SENIOR_ORANGE_EXPERTS_FLAG) === FAKE_SENIOR_ORANGE_EXPERTS_FLAG);
                if (user) {
                  seniorReferentName = this.userProfileService.formatName(user.email, user.firstname, user.lastname);
                  seniorReferentMail = user.email;
                  seniorReferentId = user['_id'];
                }
              }

              // fake a community for senior!
              this.communities.push({
                _id: FAKE_SENIOR_ORANGE_EXPERTS_FLAG.toString(),
                label: seniorReferentId,
                name: 'Senior Orange Expert',
                flag: FAKE_SENIOR_ORANGE_EXPERTS_FLAG,
                referentName: seniorReferentName,
                referentMail: seniorReferentMail,
                reviewers: [],
                newForm: communities[0].newSeniorForm,
                renewalForm: communities[0].renewalSeniorForm,
                newFormBackup: communities[0].newSeniorFormBackup,
                renewalFormBackup: communities[0].renewalSeniorFormBackup,
                newFormDraft: communities[0].newSeniorFormDraft,
                renewalFormDraft: communities[0].renewalSeniorFormDraft,
              });

              this.userProfileService.getProfile(this.getCommunityInfo);
            },
            error: error => {
              this.selectedFormType = 'error';
              this.alertService.danger(error);
            }
          });

        } else {
          this.userProfileService.getProfile(this.getCommunityInfo);
        }
      },
      error: error => {
        this.selectedFormType = 'error';
        this.alertService.danger(error);
      }
    });
  }

  getCommunityInfo = (error: any): void => {
    if (error) {
      this.alertService.danger(error);
    } else {
      if (this.userProfileService.user && this.communities) {
        // Set default selected community to the user's community
        let community = this.communities[0];
        this.selectedCommunityIndex = 0;

        for (let i = 0; i < this.communities.length; i++) {
          community = this.communities[i];
          if (community.name === this.userProfileService.user.community) {
            this.selectedCommunityIndex = i;
            break;
          }
        }

        if ([FAKE_SENIOR_ORANGE_EXPERTS_FLAG, 3840].includes(this.userProfileService.user.referent! & FAKE_SENIOR_ORANGE_EXPERTS_FLAG)) {
          this.isSeniorOrangeExpert = true;
          community = this.communities[this.communities.length - 1];
          this.selectedCommunityIndex = this.communities.length - 1;
        }

        this.getOtherReferents(community);

        this.selectedCommunity.name = community.name;
        this.selectedCommunity.referentName = community.referentName;
        this.selectedCommunity.referentMail = community.referentMail;

        this.communityNameCtrl = new FormControl(this.selectedCommunity.name, [Validators.required]);
        this.communityReferentMailCtrl = new FormControl(this.selectedCommunity.referentMail,
          Validators.compose([Validators.required, this.formValidationService.emailValidator]))
      }
    }
  }

  onCommunityChange(value: string) {
    const communityIndex = parseInt(value);

    this.isSeniorOrangeExpert = communityIndex === this.communities.length - 1;

    const selectedCommunity = this.communities[communityIndex];

    this.getOtherReferents(selectedCommunity);

    this.selectedCommunity.name = selectedCommunity.name;
    this.selectedCommunity.referentName = selectedCommunity.referentName;
    this.selectedCommunity.referentMail = selectedCommunity.referentMail;
    this.selectedCommunityIndex = communityIndex;
    this.communityNameCtrl.reset(this.selectedCommunity.name);
    this.communityReferentMailCtrl.reset(this.selectedCommunity.referentMail);
    this.selectedFormType = 'new';
  }

  toggleCommunityUpdate() {
    this.shouldUpdateCommunity = false;
    this.selectedCommunity.name = this.communities[this.selectedCommunityIndex].name;
    this.selectedCommunity.referentName = this.communities[this.selectedCommunityIndex].referentName;
    this.selectedCommunity.referentMail = this.communities[this.selectedCommunityIndex].referentMail;
    this.communityNameCtrl.reset(this.selectedCommunity.name);
    this.communityReferentMailCtrl.reset(this.selectedCommunity.referentMail);
  }

  updateCommunity(prop: string, control: FormControl) {
    if (prop === 'referentMail') {
      this.selectedCommunity.referentMail = this.selectedCommunity.searchMail;

    } else {
      if (!control.errors) {
        this.selectedCommunity[prop as keyof SelectedCommunity] = control.value;
      } else {
        control.reset(this.selectedCommunity[prop as keyof SelectedCommunity]);
      }
    }

    this.shouldUpdateCommunity = (this.selectedCommunity.name.trim() !== this.communities[this.selectedCommunityIndex].name
              || this.selectedCommunity.referentMail.trim() !== this.communities[this.selectedCommunityIndex].referentMail);
  }

  getOtherReferents(community: Community) {
    this.communityService.listReferentsByCommunityId(community['_id']).subscribe(users => {
      this.otherReferents = users.filter(u => u.email !== community.referentMail)
        // Sort by alphabetical order (putting empty/null lastnames to the end)
        .sort((a: User, b: User) => {
          if (!a.lastname?.trim()) {
            return 1;
          }
          if (!b.lastname?.trim()) {
            return -1;
          }
          return ((a.lastname < b.lastname) ? -1 : ((a.lastname > b.lastname) ? 1 : 0));
        })
        .map(u => {
          const name = this.userProfileService.formatName(u.email, u.firstname, u.lastname);
          return Object.create({ name, email: u.email, id: u['_id'], checked: false });
        });
    });

  }

  selectOtherReferent(refIdx: number) {
    if (this.userProfileService.user?._id !== this.otherReferents[refIdx].id) {
      this.otherReferents[refIdx].checked = !this.otherReferents[refIdx].checked;

      if (this.otherReferents[refIdx].checked) {
        this.removingOtherReferents = true;
      } else {
        this.removingOtherReferents = this.otherReferents.find(element => element.checked) !== undefined;
      }
    }
  }

  removeSelectedReferents() {
    let userIds = '';
    for (const referent of this.otherReferents) {
      if (referent.checked && this.communities.findIndex((community) => community.referentMail === referent.email) === -1) {
        userIds += `${referent.id},`;
      }
    }

    if (userIds === '') {
      this.cancelRemovingReferents();
      return;
    }

    this.userService.switchUsersAsReferents(userIds.slice(0, -1), 'not-referent', this.communities[this.selectedCommunityIndex].name, this.isSeniorOrangeExpert).subscribe({
      next: res => {
        this.removingOtherReferents = false;
        this.getOtherReferents(this.communities[this.selectedCommunityIndex]);
        this.alertService.success(res.message);
        this.alertService.setAlertTimeout(7000);
      },
      error: error => {
        this.alertService.danger(error);
        this.alertService.setAlertTimeout(7000);
      }
    });
  }

  addAsReferent() {
    if (this.foundUserId) {
      this.userService.updateUserRole(this.foundUserId, this.isSeniorOrangeExpert ? 'other-senior-referent' : 'referent', this.communities[this.selectedCommunityIndex].name, this.isSeniorOrangeExpert).subscribe(
        user => {
          this.enteredEmail = '';
          this.getOtherReferents(this.communities[this.selectedCommunityIndex]);
          this.alertService.success(`The user ‘${user.email}’ is now a Referent for the community ‘${this.communities[this.selectedCommunityIndex].name}’.`);
          this.alertService.setAlertTimeout(7000);
        },
        error => {
          this.alertService.danger(error);
          this.alertService.setAlertTimeout(7000);
        }
      );
    }
  }

  cancelRemovingReferents() {
    for (const referent of this.otherReferents) {
      referent.checked = false;
    }
    this.removingOtherReferents = false;
  }

  syncCommunityUpdateWithBackend() {
    if (!this.isSeniorOrangeExpert) {
      this.communityService.updateCommunity(this.communities[this.selectedCommunityIndex]['_id'],
        this.selectedCommunity.name, this.selectedCommunity.referentName, this.selectedCommunity.referentMail)
      .subscribe({
        next: community => {
          this.shouldUpdateCommunity = false;
          // Update communities
          this.communities[this.selectedCommunityIndex].name = this.selectedCommunity.name;
          if (this.communities[this.selectedCommunityIndex].referentMail !== this.selectedCommunity.referentMail) {
            this.communities[this.selectedCommunityIndex].referentName = this.selectedCommunity.referentName;
            this.communities[this.selectedCommunityIndex].referentMail = this.selectedCommunity.referentMail;
            // Grant the referent role to the user
            this.userService.updateUserRole(this.selectedCommunity.referentId, 'referent', this.selectedCommunity.name).subscribe({
              next: user => {
                this.alertService.success(`The community ‘${community.name}’, whose main Referent is ‘${user.email}’, has been updated successfully!`);
                this.alertService.setAlertTimeout(7000);
              },
              error: error => {
                this.alertService.danger(`The community ‘${community.name}’ has been updated successfully, but got this error when upgrading the referent role: ${error}`);
                this.alertService.setAlertTimeout(7000);
              }
            });
            this.getOtherReferents(this.communities[this.selectedCommunityIndex]);
          } else {
            this.alertService.success(`The community ‘${community.name}’ has been updated successfully!`);
            this.alertService.setAlertTimeout(7000);
          }

          // Update the profile to update frontend UI
          this.userProfileService.getProfile();
        },
        error: error => {
          this.alertService.danger(error);
          this.alertService.setAlertTimeout(7000);
        }
      });

    } else {
      // Just set the user as a Referent for Senior Orange Experts (role.reviewer == 1111111100000000)
      // Grant the referent role to the user
      this.userService.updateUserRole(this.selectedCommunity.referentId, 'referent', this.selectedCommunity.name, this.isSeniorOrangeExpert).subscribe({
        next: user => {
          this.shouldUpdateCommunity = false;
          if (this.communities[this.selectedCommunityIndex].label) {
            this.userService.updateUserRole(this.communities[this.selectedCommunityIndex].label, 'other-senior-referent', this.communities[this.selectedCommunityIndex].name, this.isSeniorOrangeExpert)
            .subscribe({
              next: user => {
                this.getOtherReferents(this.communities[this.selectedCommunityIndex]);
                this.userProfileService.getProfile();
              },
              error: error => {
                this.alertService.danger(error);
                this.alertService.setAlertTimeout(7000);
              }
            });
          }
          this.communities[this.selectedCommunityIndex].referentName = this.selectedCommunity.referentName;
          this.communities[this.selectedCommunityIndex].referentMail = this.selectedCommunity.referentMail;
          this.communities[this.selectedCommunityIndex].label = user['_id'];

          this.alertService.success(`The Senior Orange Expert community, whose main Referent is ‘${user.email}’, has been updated successfully!`);
          this.alertService.setAlertTimeout(7000);
        },
        error: error => {
          this.alertService.danger(error);
          this.alertService.setAlertTimeout(7000);
        }
      });
    }
  }

  changeFormType(_: any) {
    this.selectFormModifcation('');
  }

  selectFormModifcation(type: string) {
    const warningText = (this.selectedFormType === 'new' && this.communities[this.selectedCommunityIndex].newFormDraft)
      || (this.selectedFormType === 'renew' && this.communities[this.selectedCommunityIndex].renewalFormDraft) ?
      '<p class="text-danger font-weight-bold">⚠ You have currently a draft template, not yet published: if you continue, it will be overridden.</p>' : '';

    this.formModification = type;

    switch (type) {
      case FormModification.Draft:
        this.formModificationChoice = 'Edit draft template';
        this.formModificationDescription = `<p>You are about to continue making modifications to your draft template. Don't forget to publish it when ready, so that applicants can view your application template.</p>`;
        break;
      case FormModification.Copy:
        this.formModificationChoice = 'Create draft from published template';
        this.formModificationDescription = '<p>A copy of the currently published application template will be created as a draft, and all your modifications will be done using this copied template.</p>'
          + warningText;
        break;
      case FormModification.New:
        this.formModificationChoice = 'Create draft from "new application" template';
        this.formModificationDescription = '<p>You create a draft template for the renewal application as a copy of the new application template.</p>'
          + warningText;
        break;
      case FormModification.Canvas:
        this.formModificationChoice = 'Create empty template';
        this.formModificationDescription = '<p>You create an application template from scratch. A draft based on an empty template (with no questions in it) will be created as a starting point for you.</p>'
          + warningText;
        break;
      case FormModification.Restore:
        this.formModificationChoice = 'Restore last published template';
        this.formModificationDescription = '<p>You are about to restore the last published application template.</p>';
        break;
      default:
        this.formModificationChoice = 'Select an action to perform';
        this.formModificationDescription = '';
    }
  }

  startModifyingForm() {
    switch (this.formModification) {
      case FormModification.Draft:
        this.router.navigate([`/${this.urlPrefix}/dashboard/communities/template/edit/${this.selectedFormType}/${this.communities[this.selectedCommunityIndex]['_id']}`]);
        break;
      case FormModification.Copy:
        this.communityService.copyAppFormAsDraft(this.communities[this.selectedCommunityIndex]['_id'], this.selectedFormType, this.isSeniorOrangeExpert)
        .subscribe({
          next: community => {
            this.router.navigate([`/${this.urlPrefix}/dashboard/communities/template/edit/${this.selectedFormType}/${this.isSeniorOrangeExpert ? FAKE_SENIOR_ORANGE_EXPERTS_FLAG : community['_id']}`]);
          },
          error: error => {
            this.alertService.danger(error);
            this.alertService.setAlertTimeout(7000);
          }
        });
        break;
      case FormModification.New:
        this.communityService.createRenewalAppFormDraftFromNewTemplate(this.communities[this.selectedCommunityIndex]['_id'], this.isSeniorOrangeExpert)
        .subscribe({
          next: community => {
            this.router.navigate([`/${this.urlPrefix}/dashboard/communities/template/edit/${this.selectedFormType}/${this.isSeniorOrangeExpert ? FAKE_SENIOR_ORANGE_EXPERTS_FLAG : community['_id']}`]);
          },
          error: error => {
            this.alertService.danger(error);
            this.alertService.setAlertTimeout(7000);
          }
        });
        break;
      case FormModification.Canvas:
        this.communityService.createAppFormDraftFromCanvas(this.communities[this.selectedCommunityIndex]['_id'], this.selectedFormType, this.isSeniorOrangeExpert)
        .subscribe({
          next: community => {
            this.router.navigate([`/${this.urlPrefix}/dashboard/communities/template/edit/${this.selectedFormType}/${this.isSeniorOrangeExpert ? FAKE_SENIOR_ORANGE_EXPERTS_FLAG : community['_id']}`]);
          },
          error: error => {
            this.alertService.danger(error);
            this.alertService.setAlertTimeout(7000);
          }
        });
        break;
      case FormModification.Restore:
        this.communityService.createAppFormDraftFromPreviousTemplate(this.communities[this.selectedCommunityIndex]['_id'], this.selectedFormType, this.isSeniorOrangeExpert)
        .subscribe({
          next: community => {
            this.router.navigate([`/${this.urlPrefix}/dashboard/communities/template/edit/${this.selectedFormType}/${this.isSeniorOrangeExpert ? FAKE_SENIOR_ORANGE_EXPERTS_FLAG : community['_id']}`]);
          },
          error: error => {
            this.alertService.danger(error);
            this.alertService.setAlertTimeout(7000);
          }
        });
        break;
    }
  }
}
