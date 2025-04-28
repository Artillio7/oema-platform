import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie';

import { AuthMsg, AuthService } from '../../common/ng-services/auth.service';
import { UserService } from '../../common/ng-services/user.service';
import { AlertService } from '../../common/ng-services/alert';
import { Domain } from '../../common/ng-models/app-config';
import { AppConfig } from '../../app.config';

@Component({
  selector: 'app-oema-hello',
  templateUrl: './hello.component.html',
  encapsulation: ViewEncapsulation.None
})
export class HelloComponent implements OnInit {
  urlPrefix?: string;
  isAuthed = false;
  modifiedUrlPrefix?: string; // to handle the senior-orange-experts url...
  userId?: string;
  userRole!: string;
  userEmail!: string;
  userName!: string;
  modalWindow!: NgbModalRef;
  appDomain: Domain;
  redirectUrl!: string;

  @ViewChild('privacyPolicy') private privacyPolicy!: ElementRef;

  constructor(
    private titleService: Title,
    private cookieService: CookieService,
    private authService: AuthService,
    private userService: UserService,
    public alertService: AlertService,
    public appConfig: AppConfig,
    private modalService: NgbModal,
    private router: Router
  ) {
    this.titleService.setTitle('Welcome on the board!');
    // When signing in with Orange Connect, we have put this cookie.
    this.urlPrefix = this.cookieService.get('oemaUri');
    this.modifiedUrlPrefix = this.urlPrefix === this.appConfig.settings!.domains[3] ?
      this.appConfig.settings!.domains[0] : this.urlPrefix;
    this.isAuthed = this.authService.isAuthenticated() > 0;
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix || 'orange-experts'];
  }

  ngOnInit() {
    if (this.urlPrefix?.length && !this.isAuthed) {
      console.log(`Redirecting to ${this.urlPrefix}...`);
      this.authService.getOidcUserInfo(this.urlPrefix).subscribe({
        next: result => {
          this.setUpAfterOrangeConnectSignin(result);
        },
        error: error => {
          // On error, redirect to the login page
          // Reset the redirectUrl
          this.authService.redirectUrl = '';
          // Remove all cookies
          this.cookieService.removeAll();
          this.alertService.danger(error);
          this.router.navigate([`/${this.urlPrefix}/auth/login`]);
        }
      });
    }
  }

  setUpAfterOrangeConnectSignin(result: AuthMsg) {
    if (result.success) {
      document.querySelector('body')!.classList.add('aside-menu-hidden');

      this.userId = result.id;
      // Get the redirect URL from our auth service
      // If no redirect has been set, use the default

      const messageParts = result.message.split(' ');
      const role = messageParts[0];
      this.userEmail = messageParts[2];


      if (this.userId === '-1') {
        // User has just signed in with Orange Connect,
        // and has no account associated with the email address linked to Orange Connect.
        this.userName = messageParts[3];
      } else {
        switch(role) {
          case 'Applicant':
            this.userRole = this.authService.hashGen('Applicant');
            this.redirectUrl = '/' + this.urlPrefix + '/application';
            break;
          case 'Reviewer':
            this.userRole = this.authService.hashGen('Reviewer');
            this.redirectUrl = '/' + this.modifiedUrlPrefix + '/application';
            break;
          case 'Referent':
            this.userRole = this.authService.hashGen('Referent');
            this.redirectUrl = '/' + this.modifiedUrlPrefix + '/dashboard';
            break;
          case 'Admin':
            this.userRole = this.authService.hashGen('Admin');
            this.redirectUrl = '/' + this.modifiedUrlPrefix + '/dashboard';
            break;
          default:
            this.alertService.danger('Not authorized!');
            this.cookieService.removeAll();
            this.router.navigate(['/' + this.urlPrefix + '/auth/login']);
            return;
        }

        if (this.cookieService.get('redirect')) {
          this.redirectUrl = this.cookieService.get('redirect')!;
          this.cookieService.remove('redirect');
        }

        // Check if the user has accepted our privacy policy ?
        const hasAcceptedPolicy = this.cookieService.get('privacyPolicy');
        if (!result.policy && hasAcceptedPolicy !== '1') {
          this.modalWindow =
            this.modalService.open(this.privacyPolicy, { windowClass: 'modal-warning', backdrop: 'static', keyboard: false });
        } else {
          this.setCookies();
        }


        // Reset the redirectUrl
        this.authService.redirectUrl = '';
      }
    }
  }

  createNewAccount() {
    this.modalWindow = this.modalService.open(this.privacyPolicy, { windowClass: 'modal-warning', backdrop: 'static', keyboard: false });
  }

  acceptPrivacyPolicy() {
    this.modalWindow.close('I accept');

    if (this.userId === '-1') {
      // Signed in with Orange Connect,
      // and first time on OEMA:
      // Create the account for the user!
      this.authService.createNewOidcAccount(this.userEmail).subscribe({
        next: user => {
          this.userRole = this.authService.hashGen('Applicant');
          this.redirectUrl = '/' + this.urlPrefix + '/application';

          if (this.cookieService.get('redirect')) {
            this.cookieService.remove('redirect');
          }

          this.setCookies();
        },
        error: err => {
          this.alertService.danger(err);
          this.cookieService.removeAll();
          this.router.navigate(['/' + this.urlPrefix + '/auth/login']);
        }
      });
    } else {
      // Save acceptance of policy in the db
      this.userService.hasAcceptedPolicy(this.userId!).subscribe({
        next: user => {
          this.setCookies();
        },
        error: err => {
          this.alertService.danger(err);
          this.cookieService.removeAll();
          this.router.navigate(['/' + this.urlPrefix + '/auth/login']);
        }
      });
    }
  }

  declinePrivacyPolicy() {
    window.location.href = 'https://www.orange.com';
    this.cookieService.removeAll();
  }

  setCookies() {
    // Set some cookies
    this.cookieService.put('oemaEmail', this.userEmail, { secure: true, sameSite: 'strict' });
    this.cookieService.put('oema', this.userRole, { secure: true, sameSite: 'strict' });
    this.cookieService.put('oemaUri', this.redirectUrl.split('/')[1], { secure: true, sameSite: 'strict' });
    this.cookieService.put('privacyPolicy', '1', { secure: true, sameSite: 'strict' });
    // Redirect the user
    this.router.navigate([this.redirectUrl]);
  }
}
