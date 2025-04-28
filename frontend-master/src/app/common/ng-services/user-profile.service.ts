import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { AuthService } from './auth.service';
import { ReviewService } from './review.service';

import { ApplicationSchema, User } from '../ng-models/user';
import { AppConfig } from '../../app.config';

@Injectable()
export class UserProfileService {
  user!: User | null;
  pendingCommunity!: string;
  pendingCommunityId!: string;
  pendingFormType!: string;
  pendingHistoryIndex!: number;

  profileLoaded = false;

  nbReviews: any = {};

  // Observable sources
  private userSource = new Subject<User>();
  private nbAppsToReviewSource = new Subject<any>();

  // Observable streams
  user$ = this.userSource.asObservable();
  nbReviews$ = this.nbAppsToReviewSource.asObservable();

  constructor(
    public appConfig: AppConfig,
    private authService: AuthService,
    private reviewService: ReviewService,
    private router: Router
  ) { }

  getProfile(callback?: (error: any) => void, url: string = this.router.url) {
    this.authService.profile(url.split('/')[1]).subscribe({
      next: user => {
        this.updateUser(user);
        this.profileLoaded = true;
        if (callback) {
          callback(null);
        }
      },
      error: error => { if (callback) callback(error); }
    });
  }

  getNbAppsToReview(callback: (error: any) => void) {
    if (this.user && (this.user.role === 'Referent' || this.user.role === 'Admin')) {
      this.reviewService.getNbAppsToReview(this.user.communityId!).subscribe({
        next: answer => {
          this.updateNbAppsToReview(answer);
          callback(null);
        },
        error: error => { callback(error); }
      });
    } else {
      callback('Not authorized!');
    }
  }

  hasPendingForm(urlPrefix: string): any {
    this.authService.profile(urlPrefix).subscribe(
      user => {
        this.user = user;
        const userAppHistory = user.history;
        if (userAppHistory.length) {
          // the most recent application form is at the end of the array
          // const idx = userAppHistory.length - 1;
          for (let idx = userAppHistory.length - 1; idx >= 0; idx--) {
            if (!userAppHistory[idx].submittedAt && userAppHistory[idx].year === 1 + new Date().getFullYear()) {
                /* Orange Experts */
              if ((urlPrefix === this.appConfig.settings!.domains[0]
                  && userAppHistory[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[1]].communityId
                  && userAppHistory[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[2]].communityId
                  && !user.history[idx].formType.endsWith('senior'))
                /* Senior Orange Experts */
                || (urlPrefix === this.appConfig.settings!.domains[3]
                  && userAppHistory[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[1]].communityId
                  && userAppHistory[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[2]].communityId
                  && userAppHistory[idx].formType.endsWith('senior'))
                /* Dev Senior DTSI */
                || (urlPrefix === this.appConfig.settings!.domains[1]
                  && userAppHistory[idx].communityId === (this.appConfig.settings as { [key: string]: any })[urlPrefix].communityId)
                /* Data Up */
                || (urlPrefix === this.appConfig.settings!.domains[2]
                  && userAppHistory[idx].communityId === (this.appConfig.settings as { [key: string]: any })[urlPrefix].communityId)) {
                // there is a pending form !
                this.pendingCommunity = userAppHistory[idx].community;
                this.pendingCommunityId = userAppHistory[idx].communityId;
                this.pendingFormType = userAppHistory[idx].formType;
                this.pendingHistoryIndex = idx;
                this.userSource.next(user);
                this.profileLoaded = true;
                return {
                  user: this.user,
                  pendingCommunity: userAppHistory[idx].community,
                  pendingCommunityId: userAppHistory[idx].communityId,
                  pendingFormType: userAppHistory[idx].formType
                };
              }
            }
          }
        }

        this.router.navigate(['/' + urlPrefix + '/application']);
        this.pendingCommunity = '';
        this.pendingCommunityId = '';
        this.pendingFormType = '';
        this.pendingHistoryIndex = -1;
        this.userSource.next(user);
        this.profileLoaded = true;
        return null;

      }
    );
  }

  // BE CAREFUL: [TODO] to improve...
  // Search in code `/* keep the following 6 values (as they are not returned by userService.updateUser... */`
  updateUser(user: User) {
    this.user = user;
    this.pendingCommunity = '';
    this.pendingCommunityId = '';
    this.pendingFormType = '';
    this.pendingHistoryIndex = -1;
    if (user.history.length) {
      // the most recent application form is at the end of the array
      for (let idx = user.history.length - 1; idx >= 0; idx--) {
        if (!user.history[idx].submittedAt && user.history[idx].year === 1 + new Date().getFullYear()) {
          const urlPrefix = this.router.url.split('/')[1];
            /* Orange Experts */
          if ((urlPrefix === this.appConfig.settings!.domains[0]
              && user.history[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[1]].communityId
              && user.history[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[2]].communityId
              && !user.history[idx].formType.endsWith('senior'))
            /* Senior Orange Experts */
            || (urlPrefix === this.appConfig.settings!.domains[3]
              && user.history[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[1]].communityId
              && user.history[idx].communityId !== (this.appConfig.settings as { [key: string]: any })[this.appConfig.settings!.domains[2]].communityId
              && user.history[idx].formType.endsWith('senior'))
            /* Dev Senior DTSI */
            || (urlPrefix === this.appConfig.settings!.domains[1]
              && user.history[idx].communityId === (this.appConfig.settings as { [key: string]: any })[urlPrefix].communityId)
            /* Data Up */
            || (urlPrefix === this.appConfig.settings!.domains[2]
              && user.history[idx].communityId === (this.appConfig.settings as { [key: string]: any })[urlPrefix].communityId)) {
            // and if there is a pending form !
            this.pendingCommunity = user.history[idx].community;
            this.pendingCommunityId = user.history[idx].communityId;
            this.pendingFormType = user.history[idx].formType;
            this.pendingHistoryIndex = idx;
            break;
          }
        }
      }
    }
    this.userSource.next(user);
    this.getNbAppsToReview(() => { });
  }

  updateAppHistory(appHistory: ApplicationSchema[]) {
    this.user!.history = appHistory;
    this.updateUser(this.user!);
  }

  propagateSource() {
    this.userSource.next(this.user!);
  }

  updateNbAppsToReview(count: any): void {
    Object.assign(this.nbReviews, count);
    this.nbAppsToReviewSource.next(count);
  }

  formatName(email: string, firstname?: string, lastname?: string) {
    let name = firstname && lastname ?
    firstname.replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase())
      + ' ' + lastname.toUpperCase()
    : '';
    if (name === '') {
      const emailParts = email.split('@')[0].split('.');
      name = emailParts[0].replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, (letter: any) => letter.toUpperCase()) + ' '
        + emailParts[1].toUpperCase();
    }

    return name
  }
}
