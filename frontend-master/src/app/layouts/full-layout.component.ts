import { Component, ElementRef, ViewChild, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

import { Subscription } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie';

import { AuthService } from '../common/ng-services/auth.service';
import { UserProfileService } from '../common/ng-services/user-profile.service';
import { FileUploadService } from '../common/ng-services/file-upload.service';

import { ApplicationSchema, User, FAKE_SENIOR_ORANGE_EXPERTS_FLAG } from '../common/ng-models/user';
import { Domain } from '../common/ng-models/app-config';
import { AppConfig } from '../app.config';

@Component({
  selector: 'app-oema',
  templateUrl: './full-layout.component.html'
})

export class FullLayoutComponent implements OnInit, OnDestroy {
  programmeLogo!: string;
  navBarTitle!: string;

  userRole = 0;
  isOnlySeniorReferent = false;
  userFirstname = '';
  userPhotoSrc: any = 'assets/img/avatars/profile.png';
  userCommunity!: string;
  userAppHistory: ApplicationSchema[] = [];

  currentUrl!: string;
  urlPrefix!: string;
  urlPrefixWithoutSenior!: string;

  appFormsByYear: any = {};
  formYears: string[] = [];

  userSubscription: Subscription;
  nbAppsToReviewSubscription: Subscription;

  reviewerCommunities: any[] = [];
  nbReviews: any = {};

  asideMenuOpen = false;
  dashboardMenuOpen = true;

  appDomain!: Domain;
  modalWindow!: NgbModalRef;
  @ViewChild('privacyPolicy') private privacyPolicy!: ElementRef;

  constructor(
    public appConfig: AppConfig,
    public authService: AuthService,
    public userProfileService: UserProfileService,
    private fileUploadService: FileUploadService,
    private sanitizer : DomSanitizer,
    private router: Router,
    private cookieService: CookieService,
    private modalService: NgbModal,
    private ngZone: NgZone) {
    this.asideMenuOpen = document.querySelector('body')!.classList.contains('aside-menu-hidden') ? false : true;
    if (window.innerWidth < 980) {
      this.dashboardMenuOpen = document.querySelector('body')!.classList.contains('sidebar-mobile-show') ? true : false;
    } else {
      this.dashboardMenuOpen = document.querySelector('body')!.classList.contains('sidebar-hidden') ? false : true;
    }
    window.onresize = (e: any) => {
      this.ngZone.run(() => {
        if (window.innerWidth < 980) {
          this.dashboardMenuOpen = document.querySelector('body')!.classList.contains('sidebar-mobile-show') ? true : false;
        } else {
          this.dashboardMenuOpen = document.querySelector('body')!.classList.contains('sidebar-hidden') ? false : true;
        }
      });
    };
    this.userRole = this.authService.isAuthenticated();
    if (this.userRole === 1) {
      document.querySelector('body')!.classList.remove('sidebar-fixed');
    }
    this.userSubscription = this.userProfileService.user$.subscribe(
      user => {
        this.getInfoFromUser(user);
      }
    );
    this.nbAppsToReviewSubscription = this.userProfileService.nbReviews$.subscribe(
      nbAppsToReview => {
        this.nbReviews = nbAppsToReview;
      }
    );

    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        this.currentUrl = ev.url;
        this.urlPrefix = this.currentUrl.split('/')[1];
        this.urlPrefixWithoutSenior = this.urlPrefix.replace('senior-', '');
        this.programmeLogo = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].logo.navBar;
        this.navBarTitle = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].navBarTitle;
        this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
      }
    });
  }

  getInfoFromUser(user: User) {
    switch (user.role) {
      case 'Applicant': {
        if (this.userRole != 1) {
          this.userRole = 1;
          this.cookieService.put('oema', this.authService.hashGen('Applicant'), { secure: true, sameSite: 'strict' });
        }
        break;
      }
      case 'Reviewer': {
        if (this.userRole != 2) {
          this.userRole = 2;
          this.cookieService.put('oema', this.authService.hashGen('Reviewer'), { secure: true, sameSite: 'strict' });
        }
        break;
      }
      case 'Referent': {
        if (this.userRole != 3) {
          this.userRole = 3;
          this.cookieService.put('oema', this.authService.hashGen('Referent'), { secure: true, sameSite: 'strict' });
        }
        break;
      }
      case 'Admin': {
        if (this.userRole != 4) {
          this.userRole = 4;
          this.cookieService.put('oema', this.authService.hashGen('Admin'), { secure: true, sameSite: 'strict' });
        }
        break;
      }
    }

    if (user.photo) {
      this.fileUploadService.getFile(user._id, `${user._id}-profile-photo`)
        .subscribe({
          next: (resp: Blob) => {
            this.userPhotoSrc = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(new Blob([resp])));
          },
          error: error => {
            console.error(error);
          }
      });
    }

    this.userFirstname = user.firstname || 'Profile';
    this.userCommunity = user.community === 'N/A' ? '' : user.community;
    this.isOnlySeniorReferent = [FAKE_SENIOR_ORANGE_EXPERTS_FLAG, 3840].includes(user.referent!);
    this.userAppHistory = user.history;
    this.reviewerCommunities = user.reviewer.communities;

    // build user application history
    this.appFormsByYear = {};
    for (const appform of this.userAppHistory) {
      const year = appform.year - 1;

      if (appform.status === 'preparing') {
        if (year === new Date().getFullYear()) {
          appform.status = '<i class="fa fa-pencil-square-o" aria-hidden="true"></i>&nbsp; Ongoing';
        } else {
          appform.status = '<i class="fa fa-pencil-square-o" aria-hidden="true"></i>&nbsp; Not submitted';
        }
      } else if (appform.status === 'submitted') {
        appform.status = '<i class="fa fa-paper-plane" aria-hidden="true"></i>&nbsp; Submitted';
      } else if (appform.status === 'accepted') {
        appform.status = '<i class="fa fa-check-circle" aria-hidden="true"></i>&nbsp; Accepted';
      } else if (appform.status === 'withdrew') {
        appform.status = '<i class="fa fa-exclamation-circle" aria-hidden="true"></i>&nbsp; Withdrew';
      } else if (appform.status === 'refused') {
        appform.status = '<i class="fa fa-times-circle" aria-hidden="true"></i>&nbsp; Refused';
      }

      // Shallow copy
      const copiedAppform: any = Object.assign({}, appform);
      if (appform.formType.startsWith('new')) {
        copiedAppform['formTypeText'] = 'New application';
      } else {
        copiedAppform['formTypeText'] = 'Renewal application';
      }

      if (this.appFormsByYear.hasOwnProperty(year)) {
        this.appFormsByYear[year].unshift(copiedAppform);
      } else {
        this.appFormsByYear[year] = [copiedAppform];
      }
    }

    this.formYears = Object.keys(this.appFormsByYear);
    this.formYears.sort();
    this.formYears.reverse();
  }

  ngOnInit() {
    // Don't get profile if the url is requested for pdf export (using puppeteer)
    if (!this.currentUrl.includes('thephantomroute')) {
      if (this.userProfileService.user) {
        this.getInfoFromUser(this.userProfileService.user);
      } else {
        this.userProfileService.getProfile(() => { });
      }
    }
  }

  ngOnDestroy() {
    // Prevent memory leak when component destroyed
    this.userSubscription.unsubscribe();
    this.nbAppsToReviewSubscription.unsubscribe();
  }

  logout() {
    this.cookieService.removeAll();

    if (!this.router.url.includes('/application/form') && !this.router.url.includes('/dashboard/communities/template/edit')) {
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

    this.userProfileService.user = null;
    this.router.navigate(['/' + this.urlPrefix + '/auth/login']);
  }

  openUserGuide() {
    window.open('assets/misc/MR-letters/User_Guide_Orange_Expert_Application.pdf', '_blank');
  }

  openPrivacyPolicy() {
    this.modalWindow = this.modalService.open(this.privacyPolicy, { windowClass: 'modal-warning', backdrop: 'static', keyboard: false });
  }

  closePrivacyPolicyModal() {
    this.modalWindow.close('Close!');
  }
}
