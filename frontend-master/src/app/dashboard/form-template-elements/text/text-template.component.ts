import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-text-template',
  templateUrl: './text-template.component.html'
})
export class TextTemplateComponent {
  @Input() formElement?: Question;
  @Input() labelFormControl!: FormControl;
  @Output() itemDeleted = new EventEmitter<null>();
  @Output() newItem = new EventEmitter<string>();
  @Output() labelEdited = new EventEmitter<null>();
  @Output() menuVisible = new EventEmitter<null>();
  @Output() menuHidden = new EventEmitter<null>();

  addNewElement(position: string) {
    this.newItem.emit(position);
  }

  deleteElement() {
    this.itemDeleted.emit();
  }

  modifyLabel() {
    this.labelEdited.emit();
  }

  menuIsVisible() {
    this.menuVisible.emit();
  }

  menuIsHidden() {
    this.menuHidden.emit();
  }
}
