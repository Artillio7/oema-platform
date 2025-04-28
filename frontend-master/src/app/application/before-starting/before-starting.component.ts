import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { AuthService } from '../../common/ng-services/auth.service';
import { AlertService } from '../../common/ng-services/alert';

import { User } from '../../common/ng-models/user';
import { Domain } from '../../common/ng-models/app-config';
import { AppConfig } from '../../app.config';


@Component({
  templateUrl: './before-starting.component.html',
  styleUrls: ['./before-starting.component.css']
})
export class BeforeStartingComponent implements OnInit, OnDestroy {
  user!: User;

  thisYear: number = 1 + new Date().getFullYear();
  pendingCommunity!: string;
  pendingFormType!: string;
  // mrFileName: string;
  beforeStartingMsg!: string;

  userSubscription: Subscription;

  canSubmitForms?: boolean;

  urlPrefix: string;
  appDomain: Domain;

  constructor(
    public appConfig: AppConfig,
    private titleService: Title,
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    this.titleService.setTitle('Before starting');
    if (this.urlPrefix === this.appConfig.settings!.domains[0] || this.urlPrefix === this.appConfig.settings!.domains[3]) {
      (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].before.closedMsg =
        (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].before.closedMsg.replace('{{ thisYear }}', this.thisYear);
    }
    this.userSubscription = this.userProfileService.user$.subscribe(
      user => {
        this.user = user;
        this.pendingCommunity = this.userProfileService.pendingCommunity;
        this.pendingFormType = this.userProfileService.pendingFormType;
        //const mrFileName = 'assets/misc/MR-letters/MR-' + this.pendingFormType + '-' + this.pendingCommunity.replace(/\s+/g, '-').replace(/&/g, 'and') + '.doc';
        const mrFileName = 'api/upload/Group_Experts_manager_TM_approval.doc';
        this.beforeStartingMsg =
          (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].before.beforeStarting.replace('{{ mrFileName }}', mrFileName);
      }
    );
  }

  ngOnInit() {
    // Check whether application submission is closed
    this.authService.canSubmitForms(this.urlPrefix, '1').subscribe({
      next: answer => {
        this.canSubmitForms = answer.message === 'OK' ? true : false;
      },
      error: error => {
        this.canSubmitForms = true;
        this.alertService.danger(error);
      }
    });

    this.route.data
      .subscribe((data) => {
        if (data['userProfile']) {
          this.user = data['userProfile'].user;
          this.pendingCommunity = data['userProfile'].pendingCommunity;
          this.pendingFormType = data['userProfile'].pendingFormType;
          //const mrFileName = 'assets/misc/MR-letters/MR-' + this.pendingFormType + '-' + this.pendingCommunity.replace(/\s+/g, '-').replace(/&/g, 'and') + '.doc';
          const mrFileName = 'api/upload/Group_Experts_manager_TM_approval.doc';
          this.beforeStartingMsg =
            (this.appConfig.settings as { [key: string]: any })[this.urlPrefix].before.beforeStarting.replace('{{ mrFileName }}', mrFileName);
        }
      });

  }

  ngOnDestroy() {
    // Prevent memory leak when component destroyed
    this.userSubscription.unsubscribe();
  }

  goToForm() {
    this.router.navigate(['/' + this.urlPrefix + '/application/form']);
  }
}
