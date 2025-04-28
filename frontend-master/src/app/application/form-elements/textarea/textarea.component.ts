import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-textarea',
  templateUrl: './textarea.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ]
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() formElement!: Question;
  public ckeditorContent: string;
  public config: any;

  // the internal data model for form control value access
  private innerTextareaValue: any = '';

  constructor() {
    this.ckeditorContent = '';
    this.config = {
      uiColor: '#F0F3F4',
      height: '300px',
      autoGrow_minHeight: '300px'
    };
  }

  /*** ckeditor callbacks ***/
  onChange(event: any) {
    setTimeout(() => {
      this.ckeditorContent = event;
      this.onTextareaChange(this.ckeditorContent);
    });
  }
  onReady(event: any) {
    if (this.formElement.options && this.formElement.options.hasOwnProperty('height')) {
      jQuery('ckeditor#' + this.formElement.name + ' .cke_contents.cke_reset').css('height', this.formElement.options.height);
    } else {
      jQuery('ckeditor#' + this.formElement.name + ' .cke_contents.cke_reset').css('height', this.config.height);
    }
  }
  onFocus(event: any) {
    // console.log(event);
  }
  onBlur(event: any) {
  }


  /*** ControlValueAccessor ***/
  // on form value changed
  onTextareaChange(newValue: any) {
    // set changed value
    this.innerTextareaValue = newValue;
    // propagate value into form control using control value accessor interface
    this.propagateChange(this.innerTextareaValue);
  }

  // get accessor
  get value(): any {
    return this.innerTextareaValue;
  }

  // set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerTextareaValue) {
      this.innerTextareaValue = v;
    }
  }

  // propagate changes into the custom form control
  propagateChange = (_: any) => { }
  onTouched = () => { };

  // ControlValueAccessor interface
  // writes a new value from the form model into the view or (if needed) DOM property
  writeValue(value: any) {
    this.innerTextareaValue = value;
    this.ckeditorContent = value;
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

