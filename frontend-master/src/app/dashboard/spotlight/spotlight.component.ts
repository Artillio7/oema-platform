import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { LegendPosition, ScaleType, colorSets, escapeLabel, formatLabel } from '@swimlane/ngx-charts';
import * as shape from 'd3-shape';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { UserProfileService } from '../../common/ng-services/user-profile.service';

import { Community } from '../../common/ng-models/community';
import { FormService } from '../../common/ng-services/form.service';
import { AlertService } from '../../common/ng-services/alert';

import { AppConfig } from '../../app.config';

@Component({
  templateUrl: './spotlight.component.html',
  styleUrls: ['./spotlight.component.scss']
})
export class SpotlightComponent implements OnInit {
  urlPrefix: string;
  communities: Community[] = [];
  communityStats: any[] = [];
  yearStats: any = {}
  yearForStats = new Date().getFullYear() + 1;
  yearsList = Array.from({length: this.yearForStats - 2017}, (_, k) => this.yearForStats - k);
  selectedYear = this.yearForStats;
  selectedCommunityIdx = -1;
  selectedAppState = 'All';

  loading = true;
  clickedCommunityName = '';
  communitySubmissionsOverYears = [];
  submissionsOverYears: any = {};
  perCommunityStatsAvailable = false;
  perCommunityStats: any = {
    forms: [],
    gender: [],
    country: [],
    community: [],
  };
  perCommunityGenderStats = [];
  perCommunityCountryStats = [];
  perCommunityClassificationStats = [];
  perSeniorCommunityStats = [];

  coolColorScheme: any;
  vividColorScheme: any;
  picnicColorScheme: any;
  curve = shape.curveLinear;

  modalWindow!: NgbModalRef;
  @ViewChild('communitySubmissionsOverYearsModal', { read: TemplateRef })
  communitySubmissionsOverYearsModal!: TemplateRef<any>;

  ScaleType = ScaleType;
  LegendPosition = LegendPosition;

  constructor(
    public appConfig: AppConfig,
    private titleService: Title,
    private userProfileService: UserProfileService,
    private formService: FormService,
    private alertService: AlertService,
    private modalService: NgbModal,
    private router: Router) {
    this.urlPrefix = this.router.url.split('/')[1];
    this.titleService.setTitle( 'OEMA Spotlight' );

    this.coolColorScheme = colorSets.find(s => s.name === 'cool');
    this.vividColorScheme = colorSets.find(s => s.name === 'vivid');
    this.picnicColorScheme = colorSets.find(s => s.name === 'picnic');
  }

  ngOnInit() {
    // Init list of communities
    this.formService.getStats(this.urlPrefix).subscribe({
      next: resp => {
        this.communities = resp.communities;
        this.communityStats = resp.communityStats;
        this.yearStats = resp.yearStats;

        if (this.yearStats[this.selectedYear - 1].length === 1) {
          for (let i = 0; i < 2; i++) {
            this.yearStats[this.selectedYear - 1].push({
              name: `NULL${i}`,
              series: []
            });
            this.yearStats[this.selectedYear - 1].unshift({
              name: `NULL${i+2}`,
              series: []
            });
          }
        }

        for (const community of this.communities) {
          this.submissionsOverYears[community.label] = {
            name: community.name,
            data: [
              {
                name: 'Created',
                series: []
              },
              {
                name: 'Submitted',
                series: []
              },
              {
                name: 'Submitted (new forms)',
                series: []
              },
              {
                name: 'Submitted (renewal forms)',
                series: []
              }
            ]
          };
          for (const [year, communitiesStats] of Object.entries(this.yearStats)) {
            const communityStats = (communitiesStats as any[]).find(element => element.name === community.name);
            let createdCount = 0;
            let newCount = 0;
            let renewalCount = 0;
            for (let i = 0; i < communityStats.series.length; i++) {
              createdCount += communityStats.series[i].value;
              if (communityStats.series[i].name === 'Submitted - New') {
                newCount = communityStats.series[i].value;
              } else if (communityStats.series[i].name === 'Submitted - Renewal') {
                renewalCount = communityStats.series[i].value;
              }
            }
            this.submissionsOverYears[community.label].data[0].series.push({
              value: createdCount,
              name: year
            });
            this.submissionsOverYears[community.label].data[1].series.push({
              value: newCount + renewalCount,
              name: year
            });
            this.submissionsOverYears[community.label].data[2].series.push({
              value: newCount,
              name: year
            });
            this.submissionsOverYears[community.label].data[3].series.push({
              value: renewalCount,
              name: year
            });
          }
        }

        this.userProfileService.getProfile(this.getCommunityStats);
      },
      error: error => {
        this.alertService.danger(error);
        this.loading = false;
      }
    });
  }

  onCampaignYearChange(year: string) {
    this.selectedYear = +year;

    if (this.yearStats[this.selectedYear - 1].length === 1) {
      for (let i = 0; i < 2; i++) {
        this.yearStats[this.selectedYear - 1].push({
          name: `NULL${i}`,
          series: []
        });
        this.yearStats[this.selectedYear - 1].unshift({
          name: `NULL${i+2}`,
          series: []
        });
      }
    }

    // Retrieve detailed stats for selected community
    this.loading = true;
    this.perCommunityStatsAvailable = false;
    this.loadCommunityStats();
  }

  getCommunityStats = (error: any): void => {
    if (error) {
      this.alertService.danger(error);
      this.loading = false;
    } else {
      if (this.userProfileService.user && this.communities) {
        // Set default selected community to the user's community
        if (this.userProfileService.user.community === 'Senior Orange Experts') {
          this.selectedCommunityIdx = 0;
        } else {
          for (let i = 0; i < this.communities.length; i++) {
            const community = this.communities[i];
            if (community.name === this.userProfileService.user.community) {
              this.selectedCommunityIdx = i;
              break;
            }
          }
        }

        // Retrieve detailed stats about the selected community
        this.loadCommunityStats();
      }
    }
  }

  onCommunityChange(value: string) {
    this.selectedCommunityIdx = +value;

    // Retrieve detailed stats about the selected community
    this.loading = true;
    this.perCommunityStatsAvailable = false;
    this.loadCommunityStats();
  }

  onAppStateChange(state: string) {
    this.selectedAppState = state;
    this.setUpPerCommunityStats();
  }

  loadCommunityStats() {
    this.formService.getCommunityStats(this.communities[this.selectedCommunityIdx]['_id'], this.selectedYear)
    .subscribe({
      next: resp => {
        this.perCommunityStats.forms = resp.forms;
        for (const point of this.perCommunityStats.forms[0].series) {
          point.name = new Date(point.name);
        }
        for (const point of this.perCommunityStats.forms[1].series) {
          point.name = new Date(point.name);
        }

        this.perCommunityStats.gender = resp.gender;
        this.perCommunityStats.country = resp.country;
        this.perCommunityStats.classification = resp.classification;
        if (this.urlPrefix === this.appConfig.settings!.domains[0] || this.urlPrefix === this.appConfig.settings!.domains[3]) {
          this.perCommunityStats.community = resp.community;
        }
        this.setUpPerCommunityStats();

        this.loading = false;
        this.perCommunityStatsAvailable = true;
      },
      error: error => {
        this.alertService.danger(`Got error when retrieving statistics for the community ${this.communities[this.selectedCommunityIdx].name}: ${error}`);
        this.loading = false;
      }
    });
  }

  setUpPerCommunityStats() {
    this.perCommunityGenderStats = this.perCommunityStats.gender.filter((e: any) => e.ref === this.selectedAppState);
    this.perCommunityGenderStats.sort((a: any, b: any) => b.value - a.value);
    this.perCommunityCountryStats = this.perCommunityStats.country.filter((e: any) => e.ref === this.selectedAppState);
    this.perCommunityCountryStats.sort((a: any, b: any) => b.value - a.value);
    this.perCommunityClassificationStats = this.perCommunityStats.classification.filter((e: any) => e.ref === this.selectedAppState);
    this.perCommunityClassificationStats.sort((a: any, b: any) => b.value - a.value);
    if (this.urlPrefix === this.appConfig.settings!.domains[0] || this.urlPrefix === this.appConfig.settings!.domains[3]) {
      this.perSeniorCommunityStats = this.perCommunityStats.community.filter((e: any) => e.ref === this.selectedAppState);
    }
  }

  openModal(content: any, options?: any) {
    this.modalWindow = this.modalService.open(content, options);
  }

  // Functions for interacting with charts
  pieTooltipText({data}: any) {
    const label = formatLabel(data.name);
    const val = formatLabel(data.value);

    return `
      <span class="tooltip-label">${escapeLabel(label)}</span>
      <span class="tooltip-val">${parseInt(val).toLocaleString()} application forms</span>
    `;
  }

  percentageFormatting(value: number): number {
    return Math.round( value * 10 ) / 10;
  }

  dataLabelFormatting(value: number): string {
    return value ? value.toString() : '';
  }

  tickFormatting(name: string): string {
    return name.startsWith('NULL') ? '' : name;
  }

  select(data: any) {
    if (typeof data === 'string' && data.endsWith(' submitted')) {
      this.clickedCommunityName = data.split('-')[0].trim();
      const communityStats: any = Object.values(this.submissionsOverYears).find((c: any) => c.name === this.clickedCommunityName);
      this.communitySubmissionsOverYears = communityStats.data;
      this.openModal(this.communitySubmissionsOverYearsModal, { scrollable: true, size: 'xl' });
    }
  }

  activate(data: any) {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  deactivate(data: any) {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }
}
