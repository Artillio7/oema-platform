import { Component, Input, OnInit, forwardRef, NgZone } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import Dropzone from 'dropzone';

import { FileUploadService } from '../../../common/ng-services/file-upload.service';
import { FormService } from '../../../common/ng-services/form.service';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-dropzone',
  templateUrl: './dropzone.component.html',
  styleUrls: ['./dropzone.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropzoneComponent),
      multi: true
    }
  ]
})
export class DropzoneComponent implements OnInit, ControlValueAccessor {
  @Input() formElement!: Question;
  @Input() userId!: string;
  @Input() communityId!: string;
  @Input() formId!: string;
  @Input() isSeniorApp = false;
  @Input() userAnsweredFormData: any;

  errorMessage = '';

  // the internal data model for form control value access
  // type = array of objects {name: 'filename', size: 'filesize'}
  private innerFileNames: any;
  dropzone: any;

  constructor(private fileUploadService: FileUploadService, private formService: FormService, private ngZone: NgZone) { }

  ngOnInit() {
    Dropzone.autoDiscover = false;

    this.dropzone = new Dropzone('#multiple-uploads', {
      url: '/api/upload',
      addRemoveLinks: true,
      acceptedFiles: 'application/pdf',
      dictDefaultMessage: 'Drop files here or click to upload.',
      maxFilesize: 100,
      maxFiles: 10,
      headers: {
        'x-csrf-token': localStorage.getItem('ctn') || ''
      }
    });

    this.dropzone.on('removedfile', (file: any) => {
      this.ngZone.run(() => {
        this.errorMessage = '';
        // delete the file in the server
        if (file.status === 'success' || !file.status) {
          const removedFile = { name: file.name, size: file.upload ? file.upload.total : file.size };
          this.onRemoved(removedFile);
          const filename = (this.isSeniorApp ? 'Senior-' : '') + this.communityId + '-' + this.formId + '-' + file.name;
          this.fileUploadService.deleteFile(this.userId, filename).subscribe();
          // update the user's application form in backend database
          this.userAnsweredFormData[this.formElement.name] = this.innerFileNames;
          this.formService.updateForm(
            this.formId, this.communityId, this.userId, undefined, this.isSeniorApp, false, undefined, undefined, this.userAnsweredFormData, undefined
          ).subscribe();
        }
      });
    });
    this.dropzone.on('sending', (file: any, xhr: any, formData: FormData) => {
      this.ngZone.run(() => {
        const filename = (this.isSeniorApp ? 'Senior-' : '') + this.communityId + '-' + this.formId + '-' + file.name;
        formData.append('filefield', file, filename);
      });
    });
    this.dropzone.on('success', (file: any, response: any) => {
      this.ngZone.run(() => {
        this.errorMessage = '';
        const newFile = { name: file.name, size: file.upload.total };
        this.onNewAdded(newFile);
        // update the user's application form in backend database
        this.userAnsweredFormData[this.formElement.name] = this.innerFileNames;
        this.formService.updateForm(
          this.formId, this.communityId, this.userId, undefined, this.isSeniorApp, false, undefined, undefined, this.userAnsweredFormData, undefined
        ).subscribe();
      })
    });
    this.dropzone.on('error', (file: any, errorMessage: any) => {
      this.ngZone.run(() => {
        if (!file.accepted) {
          this.dropzone.removeFile(file);
          this.errorMessage = errorMessage + ' Only PDF files are authorized!';
        } else {
          this.dropzone.removeFile(file);
          if (errorMessage.message) {
            this.errorMessage = errorMessage.message + ' => Sorry, your file is not uploaded.';
          } else {
            this.errorMessage = 'Something was wrong, your file is not uploaded.';
          }
        }
      });
    });
    /*this.dropzone.on('thumbnail', (file: any, dataUrl: any) => {

    });*/
  }


  /*** ControlValueAccessor ***/
  // on form value changed
  onNewAdded(newFile: any) {
    // add new value
    if (!this.innerFileNames) {
      this.innerFileNames = [newFile];
    } else {
      this.innerFileNames.push(newFile);
    }

    // propagate value into form control using control value accessor interface
    this.propagateChange(this.innerFileNames);
  }
  onRemoved(file: any) {
    // remove file
    this.innerFileNames = this.innerFileNames.filter((item: any) => item.name !== file.name);

    // propagate updated value into form control using control value accessor interface
    this.propagateChange(this.innerFileNames);
  }

  // get accessor
  get value(): any {
    return this.innerFileNames;
  }

  // set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerFileNames) {
      this.innerFileNames = v;
    }
  }

  // propagate changes into the custom form control
  propagateChange = (_: any) => { }
  onTouched = () => { };

  // ControlValueAccessor interface
  // writes a new value from the form model into the view or (if needed) DOM property
  writeValue(value: any) {
    this.innerFileNames = value;
    // show files already stored on server
    for (const storedFile of this.innerFileNames) {
      // Call the default addedfile event handler
      this.dropzone.emit('addedfile', storedFile);
      // Make sure that there is no progress bar, etc...
      this.dropzone.emit('complete', storedFile);
    }
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
