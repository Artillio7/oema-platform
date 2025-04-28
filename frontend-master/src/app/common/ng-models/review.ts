import { ApplicationSchema } from './user';


export interface UserProfile {
  email: string;
  cuid: string;
  firstname: string;
  lastname: string;
  gender: string;
  birthday: string;
  phone: string;
  classification: string;
  entity: string;
  location: string;
  country: string;
  managerFirstname: string;
  managerLastname: string;
  managerEmail: string;
  hrFirstname: string;
  hrLastname: string;
  hrEmail: string;
  role: string;
  community: string;
  history: ApplicationSchema[];
}

export interface Reviewer {
  reviewer: any;
  reviews: string;
  rating: any;
  comments: string;
}

export interface Deliberation {
  comments: string;
  status: string;
  recommendation: string;
  notes: string;
}

export interface Review {
  _id: string;
  applicant: UserProfile;
  notesAboutApplicant: string;
  formId: string;
  formType: string;
  communityId: string;
  communityName: string;
  year: number;
  userAppFormData: any;
  reviewers: Reviewer[];
  rate: any;
  deliberation: Deliberation;
  notification: string;
  createdAt: any;
}
