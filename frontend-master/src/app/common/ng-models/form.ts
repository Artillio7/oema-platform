import { WizardStep } from './community';

export interface AppForm {
  _id: string;
  applicant: {
    firstname: string;
    lastname: string;
    entity: string;
    country: string;
    directoryUrl?: string;
  }[];
  email: string;
  formType: string;
  year: number;
  communityId: string,
  communityName: string,
  formTemplate: WizardStep[];
  userAnsweredForm: any;
  juryDecision: any;
  submittedAt: any;
  lastUpdatedAt: any;
  createdAt: any;
}
