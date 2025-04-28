export interface IAppConfig {
  'currentDomain': string;
  'domains': string[];
  'orange-experts': Domain;
  'experts-dtsi': Domain;
  'data-up': Domain;
}

export interface Domain {
  name: string;
  community: string;
  communitiesGroupFlag: number;
  pageTitle: string;
  navBarTitle: string;
  logo: any;
  policy: any;
  supportLabel: string;
  contactUs: string;
  welcome: WelcomeData;
  before: BeforeStartingData;
  formWizard: FormWizardData;
}

export interface WelcomeData {
  title: string;
  closedMsg: string;
  pendingNewFormHeader: string;
  pendingRenewFormHeader: string;
  pendingFormButton: string;
  pendingFormFooter: string;
  htmlMessage: string;
  newRenewLabel: string;
  newChoiceLabel: string;
  renewChoiceLabel: string;
  newChoiceLabelHint: string;
  renewChoiceLabelHint: string;
  nextButtonLabel: string;
}

export interface BeforeStartingData {
  closedMsg: string;
  cardHeader: string;
  currentNewForm: string;
  currentRenewalForm: string;
  warningLabel: string;
  beforeStarting: string;
  endingSubmission: string;
  nextButtonLabel: string;
}

export interface FormWizardData {
  closedMsg: string;
  newFormCardHeader: string;
  renewFormCardHeader: string;
}
