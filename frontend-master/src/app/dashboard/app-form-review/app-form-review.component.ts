import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { UserProfileService } from '../../common/ng-services/user-profile.service';
import { ReviewService } from '../../common/ng-services/review.service';
import { AlertService } from '../../common/ng-services/alert';

@Component({
  templateUrl: './app-form-review.component.html',
  styleUrls: ['./app-form-review.component.scss']
})
export class AppFormReviewComponent implements OnInit {
  isSeniorExpert = false;
  formId!: string;
  communityId!: string;

  messageType!: string;
  messageBody!: string;
  canBeDisplayed!: boolean;

  applicantName!: string;
  communityName = '';
  applicationType = '';
  submissionYear!: number;
  rate: any;
  reviewers: any;
  deliberation: any;

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private router: Router,
    private userProfileService: UserProfileService,
    private reviewService: ReviewService,
    private alertService: AlertService
  ) {
    this.titleService.setTitle('Viewing a review');
    if (this.router.url.includes('/dashboard/senior-')) {
      this.isSeniorExpert = true;
    }
  }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.formId = params['formId'];
      this.communityId = params['communityId'];
      this.messageBody = '';
      this.canBeDisplayed = false;

      this.userProfileService.getProfile(this.retrieveApplicantData);
    });
  }

  retrieveApplicantData = (error: any): void => {
    if (error) {
      this.alertService.danger(error);

    } else {
      this.reviewService.getReviewByFormId(this.communityId, this.formId, this.isSeniorExpert).subscribe({
        next: review => {
          this.applicantName = review.applicant.firstname + ' ' + review.applicant.lastname;
          const appform = review.applicant.history.find(element => element.formId === this.formId && element.communityId === this.communityId);
          if (appform) {
            this.communityName = appform.community;
            this.applicationType = appform.formType == 'new' ? `New${this.isSeniorExpert ? ' Senior' : ''}` : `Renewal${this.isSeniorExpert ? ' Senior' : ''}`;
          }
          this.submissionYear = review.year;
          this.rate = review.rate;
          this.reviewers = review.reviewers.filter(reviewer => reviewer.reviews === 'yes');
          this.deliberation = review.deliberation;
          this.canBeDisplayed = true;
        },
        error: error => {
          this.messageType = 'danger';
          this.messageBody = error;
        }
      });
    }
  }
}
