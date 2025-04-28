import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-input-checkboxes-template',
  templateUrl: './input-checkboxes-template.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputCheckboxesTemplateComponent),
      multi: true
    }
  ]
})
export class InputCheckboxesTemplateComponent implements ControlValueAccessor {
  @Input() formElement!: Question;
  @Input() labelFormControl!: FormControl;
  @Output() itemDeleted = new EventEmitter<null>();
  @Output() newItem = new EventEmitter<string>();
  @Output() labelEdited = new EventEmitter<null>();
  @Output() options = new EventEmitter<null>();
  @Output() menuVisible = new EventEmitter<null>();
  @Output() menuHidden = new EventEmitter<null>();

  // the internal data model for form control value access
  innerCompetencesList: any = {};

  /*** ControlValueAccessor ***/
  // on chechbox clicked
  onChecked(event: any) {
    const newExpertise: { [key: string]: any } = {};
    newExpertise[event.target.name] = event.target.checked ? 1 : 0; // /*example: { c-5g: 1 } */
    this.innerCompetencesList = Object.assign(this.innerCompetencesList, newExpertise);
    // propagate value into form control using control value accessor interface
    this.propagateChange(this.innerCompetencesList);
  }

  // get accessor
  get value(): any {
    return this.innerCompetencesList;
  }

  // set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerCompetencesList) {
      this.innerCompetencesList = v;
    }
  }

  // propagate changes into the custom form control
  propagateChange = (_: any) => { }
  onTouched = () => { };

  // ControlValueAccessor interface
  // writes a new value from the form model into the view or (if needed) DOM property
  writeValue(value: any) {
    this.innerCompetencesList = Object.assign(this.innerCompetencesList, value);
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
