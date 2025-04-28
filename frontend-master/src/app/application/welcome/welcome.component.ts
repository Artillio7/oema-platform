import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { UserService } from '../../common/ng-services/user.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { AuthService } from '../../common/ng-services/auth.service';
import { AlertService } from '../../common/ng-services/alert';

import { User } from '../../common/ng-models/user';
import { Community } from '../../common/ng-models/community';
import { Domain } from '../../common/ng-models/app-config';
import { AppConfig } from '../../app.config';


@Component({
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit, OnDestroy {
  user!: User;
  userFirstname = '';
  myRole = '';

  isCommunitiesSelectVisible = false;
  communities: Community[] = [];

  canSubmitForms?: boolean;

  selectedCommunity = 'Select an expert community';
  selectedCommunityId = '';
  selectedFormType = 'new';
  renewalFormExists = true;

  thisYear: number = 1 + new Date().getFullYear();
  pendingCommunity = '';
  pendingCommunityId = '';
  pendingFormType = '';
  pendingFormNotification = '';

  creatingApplicationForUserId = '';
  pendingForUserCommunity = '';
  pendingForUserCommunityId = '';
  pendingForUserFormType = '';
  pendingForUserFormId = '';
  pendingFormForUserNotification = '';
  forUser: User | null = null;

  urlPrefix: string;
  appDomain: Domain;

  constructor(
    public appConfig: AppConfig,
    private titleService: Title,
    public userProfileService: UserProfileService,
    private userService: UserService,
    private communityService: CommunityService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router) {
    this.urlPrefix = this.router.url.split('/')[1];
    if (this.urlPrefix === this.appConfig.settings!.domains[3]) {
      this.renewalFormExists = false;
    }
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    this.titleService.setTitle((this.appConfig.settings as { [key: string]: any })[this.urlPrefix].pageTitle);
    if (this.urlPrefix === this.appConfig.settings!.domains[0] || this.urlPrefix === this.appConfig.settings!.domains[3]) {
      (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].welcome.closedMsg =
        (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].welcome.closedMsg.replace('{{ thisYear }}', this.thisYear);
    }
  }

  ngOnInit() {
    document.querySelector('.app-body')!.classList.add('communities');

    this.userProfileService.getProfile(this.retrieveUserData);
  }

  ngOnDestroy() {
    document.querySelector('.app-body')!.classList.remove('communities');
  }

  retrieveUserData = (error: any): void => {
    if (error) {
      this.alertService.danger(error);
    } else {
      this.user = this.userProfileService.user!;
      if (this.userProfileService.user?.firstname) {
        this.userFirstname = ' ' + this.userProfileService.user.firstname;
      }

      if (this.user.role === 'Admin' || this.user.role === 'Referent') {
          this.myRole = 'Referent';
      }

      this.pendingCommunity = this.userProfileService.pendingCommunity;
      this.pendingCommunityId = this.userProfileService.pendingCommunityId;
      this.pendingFormType = this.userProfileService.pendingFormType;
      if (this.pendingCommunity) {
        if (this.pendingFormType.startsWith('new')) {
          this.pendingFormNotification =
            (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].welcome.pendingNewFormHeader.replace('{{ pendingCommunity }}', this.pendingCommunity);
        } else {
          this.pendingFormNotification =
            (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].welcome.pendingRenewFormHeader.replace('{{ pendingCommunity }}', this.pendingCommunity);
        }
      }
      // Check whether application submission is closed
      this.authService.canSubmitForms(this.urlPrefix, '1').subscribe({
        next: answer => {
          this.canSubmitForms = answer.message === 'OK' ? true : false;

          // Init list of communities
          let newForm = { id: 'newForm', includes: 1 };
          let renewalForm = { id: 'renewalForm', includes: 1 };

          if (this.urlPrefix.startsWith('senior')) {
            newForm = { id: 'newSeniorForm', includes: 1 };
            renewalForm = { id: 'renewalSeniorForm', includes: 1 };
          }

          this.communityService.listCommunities(
            { id: '_id', includes: 1 }, { id: 'name', includes: 1 }, { id: 'label', includes: 1 }, { id: 'flag', includes: 1 },
            newForm, renewalForm, {forms: 1}, { group: this.urlPrefix }
          ).subscribe({
            next: communities => {
              if (this.urlPrefix.startsWith('senior')) {
                this.communities = communities.filter(c => c.newSeniorForm);
              } else {
                this.communities = communities.filter(c => c.newForm);
              }
            },
            error: err => {
              this.alertService.danger(err);
            }
          });
        },
        error: err => {
          this.canSubmitForms = false;
          this.alertService.danger(error);
        }
      });
    }
  }

  onCommunitySelected(event: any) { // without type info
    this.selectedCommunity = event.target.innerText;
    const idx = event.target.getAttribute('data-community-id');
    const selection = this.communities[idx];
    this.selectedCommunityId = selection['_id'];
    if (this.urlPrefix.startsWith('senior')) {
      this.renewalFormExists = selection.renewalSeniorForm !== undefined;
    } else {
      this.renewalFormExists = selection.renewalForm !== undefined;
    }
  }

  startAppForm() {
    if (this.creatingApplicationForUserId && this.pendingForUserCommunity) {
      return;
    }

    if (this.communities.length === 1) {
      this.selectedCommunity = this.communities[0].name;
      this.selectedCommunityId = this.communities[0]['_id'];
    }

    if (!(this.appConfig.settings as { [key: string]: any })[this.urlPrefix].welcome.newRenewLabel) {
      // The case there is one community and one application type
      // This is only for the Data Up/CyberSchool programme
      this.selectedFormType = 'new';
      if (this.creatingApplicationForUserId || !this.pendingCommunity) {
        this.createNewApplication();
      } else {
        // Go to editing the pending form
        this.router.navigate(['/' + this.urlPrefix + '/application/form']);
      }

    } else {
      if (this.selectedCommunity === 'Select an expert community') {
        this.alertService.warning('Please select a community for which you want to apply.');

      } else {
        if (this.creatingApplicationForUserId || !this.pendingCommunity) {
          // There is no pending application form
          this.createNewApplication();

        } else {
          // There is a pending application form
          if (this.selectedCommunity === this.pendingCommunity) {
            if (this.selectedFormType === this.pendingFormType) {
              this.alertService.warning('The choice you have just selected corresponds to your current pending form!');
            } else {
              // The user keeps the pending community, but selects another application form type!
              this.userService.updateLastUserApplicationWithCommunityId(
                this.user['_id'], this.pendingCommunityId, this.urlPrefix.startsWith('senior'), undefined, undefined, this.selectedFormType, 'preparing', undefined
              ).subscribe({
                next: updatedHistory => {
                  this.userProfileService.updateAppHistory(updatedHistory);
                  this.router.navigate(['/' + this.urlPrefix + '/application/before']);
                },
                error: error => {
                  this.alertService.danger(error);
                }
              });
            }
          } else {
            // The user changes the pending community and selects another community
            this.userService.updateLastUserApplicationWithCommunityId(this.user['_id'], this.pendingCommunityId, this.urlPrefix.startsWith('senior'),
              this.selectedCommunity, this.selectedCommunityId, this.selectedFormType, 'preparing', undefined
            ).subscribe({
              next: updatedHistory => {
                this.userProfileService.updateAppHistory(updatedHistory);
                this.router.navigate(['/' + this.urlPrefix + '/application/before']);
              },
              error: error => {
                if (this.isDuplicatedFormInSameCommunity(this.selectedCommunityId)) {
                  this.alertService.danger('You have already submitted a form for this community this year.');
                } else {
                  this.alertService.danger(error);
                }
              }
            });
          }
        }
      }
    }
  }

  isDuplicatedFormInSameCommunity(communityId: string): boolean {
    let appform;
    const theUser = this.forUser || this.user;
    let idx = theUser.history.length - 1;
    while (idx > -1) {
      appform = theUser.history[idx];
      if (appform.communityId === communityId && appform.year === this.thisYear && appform.submittedAt) {
        if (this.urlPrefix.endsWith('orange-experts')) {
          if (this.urlPrefix === this.appConfig.settings!.domains[3] && appform.formType.endsWith('senior')) {
            return true;
          } else if (this.urlPrefix === this.appConfig.settings!.domains[0] && !appform.formType.endsWith('senior')) {
            return true;
          }
        } else {
          return true;
        }
      }
      idx--;
    }
    return false;
  }

  createNewApplication() {
    // Let's create a new application!
    this.userService.createNewUserApplication(
      this.creatingApplicationForUserId || this.user['_id'],
      this.selectedCommunity, this.selectedCommunityId, this.selectedFormType, this.urlPrefix.startsWith('senior')
    ).subscribe({
      next: newHistory => {
        if (!this.creatingApplicationForUserId) {
          this.userProfileService.updateAppHistory(newHistory);

          if (!this.appDomain.before) {
            // Go to editing the pending form
            this.router.navigate(['/' + this.urlPrefix + '/application/form']);
          } else {
            this.router.navigate(['/' + this.urlPrefix + '/application/before']);
          }
        } else {
          for (let idx = newHistory.length - 1; idx >= 0; idx--) {
            if (newHistory[idx].communityId === this.selectedCommunityId &&
              newHistory[idx].formType === `${this.selectedFormType}${this.urlPrefix.startsWith('senior') ? '-senior' : ''}` &&
              !newHistory[idx].submittedAt && newHistory[idx].year === this.thisYear) {
                this.router.navigate(['/' + this.urlPrefix + `/application/form/edit/${newHistory[idx].formId}/${this.selectedCommunityId}/${this.selectedFormType}`]);
                return;
            }
          }
        }
      },
      error: error => {
        if (this.urlPrefix !== this.appConfig.settings!.domains[3] && this.isDuplicatedFormInSameCommunity(this.selectedCommunityId)) {
          this.alertService.danger(this.creatingApplicationForUserId ?
            'The user has already submitted a form for this community this year.'
            : 'You have already submitted a form for this community this year.');
        } else {
          this.alertService.danger(error);
        }
      }
    });
  }

  getUserIdForEditingApplication(event: any) {
    if (event.foundUserId) {
      event.eventTarget.disabled = true;

      this.cancelForUserApplication();

      this.creatingApplicationForUserId = event.foundUserId;
      // Check if the user has a pending form
      this.userService.getUser(event.foundUserId)
      .subscribe({
        next: user => {
          this.forUser = user;
          const userAppHistory = user.history;
          if (userAppHistory.length) {
            // the most recent application form is at the end of the array
            // const idx = userAppHistory.length - 1;
            for (let idx = userAppHistory.length - 1; idx >= 0; idx--) {
              if (!userAppHistory[idx].submittedAt && userAppHistory[idx].year === this.thisYear) {
                  /* Orange Experts */
                if ((this.urlPrefix === this.appConfig.settings!.domains[0]
                    && userAppHistory[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[1]].communityId
                    && userAppHistory[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[2]].communityId
                    && !userAppHistory[idx].formType.endsWith('senior'))
                  /* Senior Orange Experts */
                  || (this.urlPrefix === this.appConfig.settings!.domains[3]
                    && userAppHistory[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[1]].communityId
                    && userAppHistory[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[2]].communityId
                    && userAppHistory[idx].formType.endsWith('senior'))
                  /* Dev Senior DTSI */
                  || (this.urlPrefix === this.appConfig.settings!.domains[1]
                    && userAppHistory[idx].communityId === (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].communityId)
                  /* Data Up */
                  || (this.urlPrefix === this.appConfig.settings!.domains[2]
                    && userAppHistory[idx].communityId === (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].communityId)) {
                  // there is a pending form !
                  this.pendingForUserCommunity = userAppHistory[idx].community;
                  this.pendingForUserCommunityId = userAppHistory[idx].communityId;
                  this.pendingForUserFormType = userAppHistory[idx].formType;
                  this.pendingForUserFormId = userAppHistory[idx].formId;
                  this.pendingFormForUserNotification = `The user <strong>${event.foundUserEmail}</strong> has a pending form for a
                    <strong>${this.pendingForUserFormType.replace('-s', ' S').replace('renew', 'renewal')} application</strong>
                    for the <strong>${this.pendingForUserCommunity}</strong> community.`;

                  event.eventTarget.disabled = false;
                  return;
                }
              }
            }
          }

          this.pendingFormForUserNotification = `You are about to create an application for the user <strong>${event.foundUserEmail}</strong>.
            <br>Select now the community and the application form type.`;

          event.eventTarget.disabled = false;
        },
        error: error => {
          this.alertService.danger(error);
          event.eventTarget.disabled = false;
        }
      });
    }
  }

  cancelForUserApplication() {
    this.creatingApplicationForUserId = '';
    this.pendingForUserCommunity = '';
    this.pendingForUserCommunityId = '';
    this.pendingForUserFormType = '';
    this.pendingForUserFormId = '';
    this.pendingFormForUserNotification = '';
    this.forUser = null;
  }
}
