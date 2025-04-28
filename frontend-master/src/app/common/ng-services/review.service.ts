import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Review, Reviewer } from '../ng-models/review';

export interface RespMsg {
  success: boolean;
  message: string;
}

@Injectable()
export class ReviewService {
  private reviewRoute = '/api/reviews';

  constructor(private http: HttpClient) { }

  buildReviewCollection(communityId: string, isSenior = false) {
    return this.http.get<Review[]>(`${this.reviewRoute}/community/${communityId}/populate${isSenior ? '?type=senior' : ''}`);
  }

  rebuildReviewCollection(communityId: string, isSenior = false) {
    return this.http.get<Review[]>(`${this.reviewRoute}/community/${communityId}/repopulate${isSenior ? '?type=senior' : ''}`);
  }

  // Set `template` to true to also get the template for the previewed questions when reviewing applications
  listReviews(communityId: string, template: boolean, isSenior = false, ...searches: any[]) {
    let params = new HttpParams();
    for (const search of searches) {
      if (search.id && search.operator && search.value) {
        if (search.child) {
          params = params.append(`filter[${search.id}][${search.child}][${search.operator}]`, search.value);
        } else {
          params = params.append(`filter[${search.id}][${search.operator}]`, search.value);
        }
      }
      if (search.id && search.excludes && search.excludes === 1) {
        params = params.append(`excludes[${search.id}]`, search.excludes);
      }
      if (search.id && search.includes && search.includes === 1) {
        params = params.append(`includes[${search.id}]`, search.includes);
      }
    }

    if (template) {
      return this.http.get<Review[]>(`${this.reviewRoute}/community/${communityId}?template=1${isSenior ? '&type=senior': ''}`, { params });
    } else {
      return this.http.get<Review[]>(`${this.reviewRoute}/community/${communityId}${isSenior ? '?type=senior' : ''}`, { params });
    }

  }

  createReview(communityId: string, formId: string, isSenior = false) {
    return this.http.post<Review>(`${this.reviewRoute}/community/${communityId}${isSenior ? '?type=senior' : ''}`, { formId });
  }

  getReview(communityId: string, reviewId: string, isSenior = false) {
    return this.http.get<Review>(`${this.reviewRoute}/${reviewId}/community/${communityId}${isSenior ? '?type=senior' : ''}`);
  }

  getReviewByFormId(communityId: string, formId: string, isSenior = false) {
    return this.http.get<Review>(`${this.reviewRoute}/form/${formId}/community/${communityId}${isSenior ? '?type=senior' : ''}`);
  }

  updateReview(
    communityId: string,
    reviewId: string,
    isSenior = false,
    notesAboutApplicant?: string,
    reviewer?: Reviewer,
    deliberation?: any,
    notification?: string
  ) {
    return this.http.put<Review>(`${this.reviewRoute}/${reviewId}/community/${communityId}${isSenior ? '?type=senior' : ''}`,
      { notesAboutApplicant, reviewer, deliberation, notification });
  }

  deleteReview(communityId: string, reviewId: string, isSenior = false) {
    return this.http.delete<Review>(`${this.reviewRoute}/${reviewId}/community/${communityId}${isSenior ? '?type=senior' : ''}`);
  }

  getReviewSettings(communityId: string) {
    return this.http.get<any>(`${this.reviewRoute}/community/${communityId}/settings`);
  }

  putReviewSettings(
    communityId: string,
    startReviewing?: number,
    canAssignReviewers?: number,
    lockReviewers?: number,
    visibleReviews?: number,
    hiddenColumnsFromReviewers?: string
  ) {
    return this.http.put<RespMsg>(
      `${this.reviewRoute}/community/${communityId}/settings`,
      { startReviewing, canAssignReviewers, lockReviewers, visibleReviews, hiddenColumnsFromReviewers });
  }

  getNbAppsToReview(communityId: string) {
    return this.http.get<any>(`${this.reviewRoute}/community/${communityId}/count`);
  }

  /*
  * Helper to count number of bits set to 1
  */
  bitCount(n: number) {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
  }
}
