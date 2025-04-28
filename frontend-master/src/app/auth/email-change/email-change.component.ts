import { Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie';

import { AuthService } from '../../common/ng-services/auth.service';
import { UserService } from '../../common/ng-services/user.service';
import { AlertService } from '../../common/ng-services/alert';
import { Domain } from '../../common/ng-models/app-config';
import { AppConfig } from '../../app.config';

@Component({
  templateUrl: './email-change.component.html',
  encapsulation: ViewEncapsulation.None
})
export class EmailChangeComponent {
  changing = false;
  urlPrefix: string;
  modifiedUrlPrefix: string;
  userId!: string;
  userRole!: string;
  userEmail!: string;
  redirectUrl!: string;
  modalWindow!: NgbModalRef;
  appDomain: Domain;

  @ViewChild('privacyPolicy') private privacyPolicy!: ElementRef;

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private cookieService: CookieService,
    private alertService: AlertService,
    private modalService: NgbModal,
    private appConfig: AppConfig,
  ) {

    this.urlPrefix = this.router.url.split('/')[1];
    this.modifiedUrlPrefix = this.urlPrefix === this.appConfig.settings!.domains[3] ?
      this.appConfig.settings!.domains[0] : this.urlPrefix;
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    this.titleService.setTitle('Change Account Email');
  }

  changeAccountEmail() {
    if (!this.changing) {
      this.changing = true;
      const token = this.route.snapshot.params['token'];
      this.authService.changeOidcAccountEmail(token).subscribe({
        next: result => {
          if (result.success) {
            this.changing = false;
            this.alertService.success('Your account email has been modified successfully.');

            this.userId = result.id;

            const messageParts = result.message.split(' ');
            const role = messageParts[0];
            this.userEmail = messageParts[2];

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
              this.cookieService.remove('redirect');
            }

            // Check if the user has accepted our privacy policy ?
            if (!result.policy) {
              this.modalWindow =
                this.modalService.open(this.privacyPolicy, { windowClass: 'modal-warning', backdrop: 'static', keyboard: false });
            } else {
              this.setCookies();
            }
          }
        },
        error: error => {
          this.alertService.danger(error);
          this.changing = false;
          this.cookieService.removeAll();
          this.router.navigate(['/' + this.urlPrefix + '/auth/login']);
        }
      });
    }
  }

  acceptPrivacyPolicy() {
    this.modalWindow.close('I accept');

    // Save acceptance of policy in the db
    this.userService.hasAcceptedPolicy(this.userId).subscribe({
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
