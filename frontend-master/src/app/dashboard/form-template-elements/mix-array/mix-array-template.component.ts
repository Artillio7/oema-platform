import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { FormElementType, Question } from '../../../common/ng-models/community';

@Component({
  selector: 'app-form-mix-array-template',
  templateUrl: './mix-array-template.component.html',
  styleUrls: ['./mix-array-template.component.scss'],
})
export class MixArrayTemplateComponent implements OnChanges {
  @Input() formElement!: Question;
  @Input() labelFormControl!: FormControl;
  @Input() maForm!: FormGroup;
  @Output() itemDeleted = new EventEmitter<any>();
  @Output() newItem = new EventEmitter<any>();
  @Output() labelEdited = new EventEmitter<any>();
  @Output() options = new EventEmitter<any>();
  @Output() createFormQuestion = new EventEmitter<any>();
  @Output() cancelFormQuestion = new EventEmitter<any>();
  @Output() menuVisible = new EventEmitter<null>();
  @Output() menuHidden = new EventEmitter<null>();

  FormElementType = FormElementType;

  columnNames!: FormArray;

  constructor(private formBuilder: FormBuilder) {}

  ngOnChanges() {
    if (this.formElement.options?.columns) {
      this.columnNames = this.formBuilder.array(this.formElement.options.columns.map((column: any) => new FormControl(column.name)));
    }
  }

  getNestedFormControl(name: string) {
    return this.maForm.get(name) as FormControl;
  }

  getColumnNameFormControl(index: number) {
    return this.columnNames.at(index) as FormControl;
  }

  addNewElement(position: string) {
    this.newItem.emit({ alignment: position });
  }

  deleteElement() {
    this.itemDeleted.emit();
  }

  addNewCellIntoTable(cell: {alignment: string, row: number, col: number, index: number}) {
    this.newItem.emit({ cell });
  }

  deleteCell(cell: {row: number, col: number, index: number}) {
    this.itemDeleted.emit(cell);
  }

  addNewColumn(column: {alignment: string, col?: number}) {
    this.newItem.emit({ cell: column });
  }

  addNewRow(row: {alignment: string, row?: number}) {
    this.newItem.emit({ cell: row });
  }

  deleteColumn(col: {col: number}) {
    this.itemDeleted.emit(col);
  }

  deleteRow(row: {row: number}) {
    this.itemDeleted.emit(row);
  }

  modifyLabel() {
    this.labelEdited.emit();
  }

  modifyColumnLabel(col: {alignment: string, col: number}) {
    this.labelEdited.emit(col);
  }

  modifyCellLabel(cell: {row: number, col: number, index: number}) {
    this.labelEdited.emit(cell);
  }

  createNewFormQuestion(cell: {row: number, col: number, index: number}, questionType: string) {
    this.createFormQuestion.emit({cell, questionType});
  }

  cancelNewFormQuestion(cell: {row: number, col: number, index: number}) {
    this.cancelFormQuestion.emit(cell);
  }

  configureOptions(cell?: {row: number, col: number, index: number}) {
    this.options.emit(cell);
  }

  menuIsVisible() {
    this.menuVisible.emit();
  }

  menuIsHidden() {
    this.menuHidden.emit();
  }
}
