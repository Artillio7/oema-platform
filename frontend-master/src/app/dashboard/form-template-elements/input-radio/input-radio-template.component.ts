import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-input-radio-template',
  templateUrl: './input-radio-template.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputRadioTemplateComponent),
      multi: true
    }
  ]
})
export class InputRadioTemplateComponent implements ControlValueAccessor {
  @Input() formElement!: Question;
  @Input() labelFormControl!: FormControl;
  @Output() itemDeleted = new EventEmitter<null>();
  @Output() newItem = new EventEmitter<string>();
  @Output() labelEdited = new EventEmitter<null>();
  @Output() options = new EventEmitter<null>();
  @Output() menuVisible = new EventEmitter<null>();
  @Output() menuHidden = new EventEmitter<null>();

  // the internal data model for form control value access
  innerValue: any = '';

  /*** ControlValueAccessor ***/
  // on form value changed
  onChecked(event: any) {
    this.innerValue = event.target.value;
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
