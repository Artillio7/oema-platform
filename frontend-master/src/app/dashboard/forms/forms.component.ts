import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';

import { OngoingFormsTableComponent } from '../../common/ng-components/ongoing-forms-table/ongoing-forms-table.component';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { CommunityService } from '../../common/ng-services/community.service';
import { FormService } from '../../common/ng-services/form.service';
import { AlertService } from '../../common/ng-services/alert';

import { Community } from '../../common/ng-models/community';
import { AppForm } from '../../common/ng-models/form';

@Component({
  templateUrl: './forms.component.html',
  styleUrls: ['./forms.component.scss']
})
export class FormsComponent implements OnInit, OnDestroy {
  @ViewChild(OngoingFormsTableComponent)
  private formsTable!: OngoingFormsTableComponent;

  selectedAppType = '';
  excelExportBtn = 'fa-file-excel-o';

  communities: Community[] = [];
  forms: AppForm[] | null = [];
  myCommunityId!: string;
  myCommunity!: string;
  thisYear: number;

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
    this.titleService.setTitle('Candidates');
    this.thisYear = 1 + new Date().getFullYear();
    this.urlPrefix = this.router.url.split('/')[1];
  }

  ngOnInit() {
    // Init list of communities
    this.communityService.listCommunities(
      { id: '_id', includes: 1 }, { id: 'name', includes: 1 }, { id: 'flag', includes: 1 },
      { group: this.urlPrefix }
    ).subscribe({
      next: communities => {
        this.communities = communities;
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
        if (this.userProfileService.user.community === 'Senior Orange Experts') {
          this.myCommunity = this.communities[0].name;
        } else {
          this.myCommunity = this.userProfileService.user.community;
        }

        // Find myCommunityId
        for (const community of this.communities) {
          if (community.name === this.myCommunity) {
            this.myCommunityId = community['_id'];
            this.formService.listFormsWithUserProfiles(this.myCommunityId, this.thisYear, false, this.selectedAppType === 'senior').subscribe({
              next: forms => {
                if (forms.length) {
                  this.forms = forms;
                  this.dtTrigger.next(null);
                  this.infoMsg =
                    `Showing candidates for the <span class="text-primary">${this.myCommunity}</span> community in ${this.thisYear - 1}`;
                  this.tableReady = true;
                } else {
                  this.infoMsg =
                    `No candidates available for the <span class="text-primary">
                    ${this.myCommunity}</span> community in ${this.thisYear - 1}.`;
                }
              },
              error: err => {
                this.infoMsg = err;
              }
            });
            break;
          }
        }
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

  onAppTypeChanged() {
    this.onCommunityChange({value: this.myCommunityId, text: this.myCommunity});
  }

  onCommunityChange(item: any) {
    this.tableReady = false;
    this.infoMsg = '';

    this.myCommunityId = item.value;
    this.myCommunity = item.text;
    this.formService.listFormsWithUserProfiles(item.value, this.thisYear, false, this.selectedAppType === 'senior').subscribe({
      next: forms => {
        if (forms.length) {
          if (this.formsTable.datatableElement.dtInstance) {
            this.formsTable.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
              dtInstance.destroy();
              this.forms = forms;
              this.dtTrigger.next(null);
              this.infoMsg =
                `Showing candidates for the <span class="text-primary">${this.myCommunity}</span> community in ${this.thisYear - 1}`;
              this.tableReady = true;
            });
          } else {
            this.forms = forms;
            this.dtTrigger.next(null);
            this.infoMsg =
                `Showing candidates for the <span class="text-primary">${this.myCommunity}</span> community in ${this.thisYear - 1}`;
            this.tableReady = true;
          }

        } else {
          this.infoMsg =
            `No candidates available for the <span class="text-primary">${this.myCommunity}</span> community in ${this.thisYear - 1}.`;
        }
      },
      error: error => {
        this.infoMsg = error;
      }
    });
  }

  setEventNotification(event: any): void {
    this.alertService.unknown(event.type, event.message);
  }
}
