import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-input-file-template',
  templateUrl: './input-file-template.component.html',
  styleUrls: ['./input-file-template.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFileTemplateComponent),
      multi: true
    }
  ]
})
export class InputFileTemplateComponent implements ControlValueAccessor {
  @Input() formElement!: Question;
  @Input() labelFormControl!: FormControl;
  @Input() userId!: string;
  @Input() communityId!: string;
  @Input() communityName!: string;
  @Input() formId = 'template';
  @Input() uploadTarget!: string; // 'mongo' or 'aws-s3'
  @Input() userAnsweredFormData: any;
  @Output() itemDeleted = new EventEmitter<null>();
  @Output() newItem = new EventEmitter<string>();
  @Output() labelEdited = new EventEmitter<null>();
  @Output() options = new EventEmitter<null>();
  @Output() menuVisible = new EventEmitter<null>();
  @Output() menuHidden = new EventEmitter<null>();

  uploadButtonLabel = '<i class="fa fa-upload"></i>';
  errorMessage!: string;

  // the internal data model for form control value access
  private innerFileNameValue: any = '';
  // the file name to display in the input view
  public file: any;

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
        const filename = this.communityId + '-' + this.formId + '-' + input.files[0].name;
        const formData = new FormData();
        formData.append('filefield', input.files[0], filename);

        setTimeout(() => {
          this.uploadButtonLabel = '<i class="fa fa-upload"></i>';
          this.file = input.files![0].name;
          this.onChange(this.file);
          // update the user's application form in backend database
          this.userAnsweredFormData[this.formElement.name] = this.file;
        }, 2000);
      }
    }
  }

  removeFile(): void {
    this.file = '';
    // update the user's application form in backend database
    this.userAnsweredFormData[this.formElement.name] = this.file;

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


  addNewElement(position: string) {
    this.newItem.emit(position);
  }

  deleteElement() {
    this.itemDeleted.emit();
  }

  modifyLabel() {
    this.labelEdited.emit();
  }

  configureOptions() {
    this.options.emit();
  }

  menuIsVisible() {
    this.menuVisible.emit();
  }

  menuIsHidden() {
    this.menuHidden.emit();
  }
}
