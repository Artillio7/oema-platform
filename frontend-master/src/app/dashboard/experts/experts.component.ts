import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { AlertService } from '../../common/ng-services/alert';

import { Community } from '../../common/ng-models/community';
import { FAKE_SENIOR_ORANGE_EXPERTS_FLAG } from '../../common/ng-models/user';
import { Domain } from '../../common/ng-models/app-config';

import { AppConfig } from '../../app.config';

@Component({
  templateUrl: './experts.component.html',
  styleUrls: ['./experts.component.scss']
})
export class ExpertsComponent implements OnInit {
  urlPrefix: string;
  appDomain: Domain;
  communities: Community[] = [];
  rows: any[] = [];

  selectedCommunityIndex = -1;

  isSeniorOrangeExpert = false;

  infoMsg!: string;

  constructor(
    private appConfig: AppConfig,
    private titleService: Title,
    private userProfileService: UserProfileService,
    private communityService: CommunityService,
    private alertService: AlertService,
    private router: Router) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.appDomain = (this.appConfig.settings as { [key: string]: any })[this.urlPrefix];
    this.titleService.setTitle( 'Orange Experts' );
  }

  ngOnInit() {
    // Init list of communities
    this.communityService.listCommunities(
      { id: '_id', includes: 1 }, { id: 'name', includes: 1 }, { id: 'flag', includes: 1 },
      { group: this.urlPrefix }
    ).subscribe({
      next: communities => {
        this.communities = communities;
        if (this.urlPrefix.endsWith('orange-experts')) {
          this.communities.push({
            _id: FAKE_SENIOR_ORANGE_EXPERTS_FLAG.toString(),
            label: 'SeniorOrangeExpert',
            name: 'Senior Orange Expert',
            flag: FAKE_SENIOR_ORANGE_EXPERTS_FLAG,
            referentName: '',
            referentMail: '',
            reviewers: [],
          });
        }

        this.userProfileService.getProfile(this.getExperts);
      },
      error: error => {
        this.infoMsg = error;
      }
    });
  }

  getExperts = (error: any): void => {
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

      }
    }
  }

  onCommunityChange(value: string) {
    const communityIndex = parseInt(value);

    this.isSeniorOrangeExpert = communityIndex === this.communities.length - 1;

    this.selectedCommunityIndex = communityIndex;
  }
}
