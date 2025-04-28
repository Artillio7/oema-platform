import { Component, Input, forwardRef, ElementRef, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-input-text',
  templateUrl: './input-text.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputTextComponent),
      multi: true
    }
  ]
})
export class InputTextComponent implements ControlValueAccessor {
  @Input() formElement!: Question;

  // get reference to the input element
  @ViewChild('input', { static: true, read: ElementRef }) inputRef!: ElementRef;

  // the internal data model for form control value access
  private innerValue: any = '';

  /*** ControlValueAccessor ***/
  // on form value changed (from @Viewchild inputRef)
  onChange(e: Event, value: any) {
    // set changed value
    this.innerValue = value;
    // propagate value into form control using control value accessor interface
    this.propagateChange(this.innerValue);
  }

  // get accessor
  get value(): any {
    return this.innerValue;
  }

  // set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerValue) {
      this.innerValue = v;
    }
  }

  // propagate changes into the custom form control
  propagateChange = (_: any) => { }
  onTouched = () => { };

  // ControlValueAccessor interface
  // writes a new value from the form model into the view or (if needed) DOM property
  writeValue(value: any) {
    this.innerValue = value;
    this.inputRef.nativeElement.value = value;
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
