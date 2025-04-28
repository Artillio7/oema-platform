export interface Question {
  label: string;
  type: string;
  name: string;
  id?: string;
  options?: any;
}

export interface FormCategory {
  group: string;
  questions: Question[];
}

export interface WizardStep {
  name: string;
  icon: string;
  active: boolean;
  valid: boolean;
  hasError: boolean;
  form: FormCategory[];
}

export interface Community {
  _id: string;
  name: string;
  label: string;
  flag: number,
  referentName: string;
  referentMail: string;
  reviewers: any[];
  newForm?: WizardStep[];
  renewalForm?: WizardStep[];
  newFormBackup?: WizardStep[];
  renewalFormBackup?: WizardStep[];
  newFormDraft?: WizardStep[];
  renewalFormDraft?: WizardStep[];

  newSeniorForm?: WizardStep[];
  renewalSeniorForm?: WizardStep[];
  newSeniorFormBackup?: WizardStep[];
  renewalSeniorFormBackup?: WizardStep[];
  newSeniorFormDraft?: WizardStep[];
  renewalSeniorFormDraft?: WizardStep[];

  createdAt?: any;
}

export enum FormElementType {
  Textarea = 'textarea',
  TextInput = 'input-text',
  Checkbox = 'input-checkboxes',
  Radio = 'input-radio',
  File = 'input-file',
  S3File = 'input-aws-s3-file',
  Select = 'select',
  BatteryLevels = 'battery-levels',
  Dropzone = 'dropzone',
  MixArray = 'mix-array',
  Text = 'text',
  Unknown = 'unknown',
  CV = 'CV',
  ManagerApproval = 'Manager Approval',
  OrangeCharter = 'Orange Charter',
}

export enum FormModification {
  Draft = 'draft',
  Copy = 'copy',
  Canvas = 'canvas',
  New = 'new',
  Restore = 'restore',
}

export enum FormType {
  Step = 'step',
  Group = 'group',
  Question = 'question',
  Template = 'template',
}
