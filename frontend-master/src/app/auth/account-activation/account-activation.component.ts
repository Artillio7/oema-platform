import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../common/ng-services/auth.service';

@Component({
  templateUrl: 'account-activation.component.html'
})
export class AccountActivationComponent implements OnInit {
  message = { type: '', title: '', body: '' };
  urlPrefix: string;

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.titleService.setTitle('Account activation');
  }

  ngOnInit() {
    const token = this.route.snapshot.params['token'];
    this.authService.activate(token).subscribe({
      next: result => {
        if (result.success) {
          this.message = {
            type: 'success',
            title: '<i class="fa fa-check-circle" aria-hidden="true"></i> Account activated!',
            body: 'Your account has been activated successfully.'
          };
        }
      },
      error: error => {
        this.message = {
          type: 'danger',
          title: '<i class="fa fa-times-circle" aria-hidden="true"></i> Account activation failed',
          body: 'Please contact us for support.\n' + error
        };
      }
    });
  }
}
