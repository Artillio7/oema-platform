import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Observable } from 'rxjs';

import { FileUploadService } from '../../../common/ng-services/file-upload.service';
import { FormService } from '../../../common/ng-services/form.service';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-input-file',
  templateUrl: './input-file.component.html',
  styleUrls: ['./input-file.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFileComponent),
      multi: true
    }
  ]
})
export class InputFileComponent implements ControlValueAccessor {
  @Input() formElement!: Question;
  @Input() userId!: string;
  @Input() communityId!: string;
  @Input() formId!: string;
  @Input() isSeniorApp = false;
  @Input() uploadTarget!: string; // 'mongo' or 'aws-s3'
  @Input() userAnsweredFormData: any;

  uploadButtonLabel = '<i class="fa fa-upload"></i>';
  errorMessage!: string;

  // the internal data model for form control value access
  private innerFileNameValue: any = '';
  // the file name to display in the input view
  public file: any;

  constructor(private fileUploadService: FileUploadService, private formService: FormService) { }

  fileChange(input: HTMLInputElement) {
    if (input.files?.length) {
      const acceptItems = this.formElement.options?.accept?.split(',')?.map((item: string) => item.trim()) ?? ['application/pdf'];
      if ((this.uploadTarget === 'mongo' && input.files[0].type !== 'application/pdf') ||
        (this.uploadTarget === 'aws-s3' && acceptItems.findIndex((item: string) => input.files![0].type === item || input.files![0].type.startsWith('video')) === -1)) {
        this.errorMessage = this.uploadTarget === 'mongo' ? 'Error: only a PDF file is authorized!' :
          ((acceptItems.length > 1 ? 'Error: authorized file types are: ' : 'Error: unauthorized file type is: ') + acceptItems.join(', '));
        // we will check the file type on the back-end side
        // https://bugs.launchpad.net/ubuntu/+source/firefox/+bug/84880
      } else {
        this.errorMessage = '';
        this.uploadButtonLabel = '<i class="fa fa-spinner fa-pulse fa-fw"></i>';

        // upload the file after adding prefix 'communityId-formId' to its name
        const filename = (this.isSeniorApp ? 'Senior-' : '') + this.communityId + '-' + this.formId + '-' + input.files[0].name;
        const formData = new FormData();
        formData.append('filefield', input.files[0], filename);
        let uploadFile: Observable<any>;
        if (this.uploadTarget === 'mongo') {
          uploadFile = this.fileUploadService.uploadFile(formData)
        } else {
          uploadFile = this.fileUploadService.uploadS3File(formData);
        }
        uploadFile.subscribe({
          next: result => {
            this.uploadButtonLabel = '<i class="fa fa-upload"></i>';
            if (result.success) {
              this.file = input.files![0].name;
              this.onChange(this.file);
              // update the user's application form in backend database
              this.userAnsweredFormData[this.formElement.name] = this.file;
              this.formService.updateForm(
                this.formId, this.communityId, this.userId, undefined, this.isSeniorApp, false, undefined, undefined, this.userAnsweredFormData, undefined
              ).subscribe();
            }
          },
          error: error => {
            this.uploadButtonLabel = '<i class="fa fa-upload"></i>';
            // this.errorMessage = 'Sorry, your upload failed due to an error. Please try again.'
            this.errorMessage = error;

            this.file = '';
            this.onChange(this.file);
          }
        });
      }
    }
  }

  removeFile(): void {
    const filename = (this.isSeniorApp ? 'Senior-' : '') + this.communityId + '-' + this.formId + '-' + this.file;
    let deleteFile: Observable<any>;
    if (this.uploadTarget === 'mongo') {
      deleteFile = this.fileUploadService.deleteFile(this.userId, filename);
    } else {
      deleteFile = this.fileUploadService.deleteS3File(this.userId, filename);
    }
    deleteFile.subscribe();
    this.file = '';
    // update the user's application form in backend database
    this.userAnsweredFormData[this.formElement.name] = this.file;
    this.formService.updateForm(
      this.formId, this.communityId, this.userId, undefined, this.isSeniorApp, false, undefined, undefined, this.userAnsweredFormData, undefined
    ).subscribe();

    this.onChange(this.file);
  }

  /*** ControlValueAccessor ***/
  // on form value changed
  onChange(newValue: any) {
    // set changed value
    this.innerFileNameValue = newValue;
    // propagate value into form control using control value accessor interface
    this.propagateChange(this.innerFileNameValue);
  }

  // get accessor
  get value(): any {
    return this.innerFileNameValue;
  }

  // set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerFileNameValue) {
      this.innerFileNameValue = v;
    }
  }

  // propagate changes into the custom form control
  propagateChange = (_: any) => { }
  onTouched = () => { };

  // ControlValueAccessor interface
  // writes a new value from the form model into the view or (if needed) DOM property
  writeValue(value: any) {
    this.innerFileNameValue = value;
    this.file = value;
  }

  // ControlValueAccessor interface
  // registers a handler that should be called when something in the view has changed
  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  // ControlValueAccessor interface
  // registers a handler specifically for when the form control receives a touch event
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }
}
