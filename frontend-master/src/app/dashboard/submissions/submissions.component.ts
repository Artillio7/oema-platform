import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { FormService } from '../../common/ng-services/form.service';
import { AlertService } from '../../common/ng-services/alert';

import { FAKE_SENIOR_ORANGE_EXPERTS_FLAG } from '../../common/ng-models/user';
import { AppForm } from '../../common/ng-models/form';

@Component({
  templateUrl: './submissions.component.html',
  styleUrls: ['./submissions.component.scss']
})
export class SubmissionsComponent implements OnInit, OnDestroy {
  isSeniorExpert = false;
  excelExportBtn = 'fa-file-excel-o';

  communities = {};
  forms: AppForm[] | null = [];
  myCommunityId!: string;
  myCommunity!: string;
  thisYear!: number;

  infoMsg!: string;

  // We use this trigger because fetching the list of forms can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger: Subject<any> = new Subject();
  tableReady = false;

  urlPrefix: string;

  constructor(
    private titleService: Title,
    public userProfileService: UserProfileService,
    private communityService: CommunityService,
    private formService: FormService,
    private alertService: AlertService,
    private router: Router) {
    this.urlPrefix = this.router.url.split('/')[1];
    if (this.router.url.includes('/dashboard/senior-')) {
      this.isSeniorExpert = true;
    }
    this.titleService.setTitle('Submissions');
  }

  ngOnInit() {
    this.thisYear = 1 + new Date().getFullYear();

    // Init list of communities
    this.communityService.listCommunities(
      { id: '_id', includes: 1 }, { id: 'name', includes: 1 }, { id: 'flag', includes: 1 },
      { group: this.urlPrefix }
    ).subscribe({
      next: communities => {
        this.communities = communities.reduce((a, b) =>({
          ...a,
          [b._id]: b.name,
        }), {});
        this.userProfileService.getProfile(this.getForms);
      },
      error: error => {
        this.infoMsg = error;
      }
    });
  }

  ngOnDestroy() {
    this.dtTrigger.unsubscribe();
  }

  getForms = (error: any): void => {
    if (error) {
      this.infoMsg = error;
    } else {
      if (this.userProfileService.user && this.communities) {
        if (this.isSeniorExpert) {
          this.myCommunity = 'Senior Orange Experts';
          this.myCommunityId = FAKE_SENIOR_ORANGE_EXPERTS_FLAG.toString();
        } else {
          this.myCommunity = this.userProfileService.user.community;
          // Find myCommunityId
          for (const [communityId, communityName] of Object.entries(this.communities)) {
            if (communityName === this.userProfileService.user.community) {
              this.myCommunityId = communityId;
              break;
            }
          }
        }

        this.formService.listFormsWithUserProfiles(this.myCommunityId, this.thisYear, true, this.isSeniorExpert).subscribe({
          next: forms => {
            if (forms.length) {
              this.forms = forms;
              this.dtTrigger.next(null);
              this.infoMsg =
                'Showing application submissions for the <span class="text-primary">' + this.myCommunity + '</span> community' +
                ` in ${this.thisYear - 1}`
              this.tableReady = true;
            } else {
              this.infoMsg =
                'No application submission available for the <span class="text-primary">' + this.myCommunity + '</span> community' +
                ` in ${this.thisYear - 1}.`;
            }
          },
          error: err => {
            this.infoMsg = err;
          }
        });
      }
    }
  }

  onExcelExport(event: string) {
    if (event === 'Loading...') {
      this.excelExportBtn = 'fa-spinner fa-pulse fa-fw';
    } else if (event === 'Ending...') {
      this.excelExportBtn = 'fa-file-excel-o';
    } else {
      this.alertService.danger(event);
      this.excelExportBtn = 'fa-file-excel-o';
    }
  }

  setEventNotification(event: any): void {
    this.alertService.unknown(event.type, event.message);
  }
}
