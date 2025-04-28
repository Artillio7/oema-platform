import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ContactService } from '../../ng-services/contact.service';

@Component({
  selector: 'app-ngb-modal-mail-compose',
  templateUrl: './mail-compose.component.html'
})
export class MailComposeComponent implements OnInit {
  @Input() modalTitle!: string;
  @Input() recipients: string[] = [];
  @Input() emailFrom!: string;
  @Input() emailsCC: string[] = [];
  @Input() emailsBCC: string[] = [];


  composeMessageForm!: FormGroup;
  composeMessageFormHasError = false;

  sentStatusMsg!: string;
  sentStatus!: string;

  constructor(private formBuilder: FormBuilder, private contactService: ContactService, public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.composeMessageForm = this.formBuilder.group({
      'select-mail-from': [this.emailFrom || 'orange-experts.programme@orange.com', Validators.required],
      'input-mail-subject': ['', Validators.required],
      'textarea-mail-message': ['', Validators.required],
      'keepcopy': [true]
    });
  }

  get composeMessageFormSelectMailFrom() {
    return this.composeMessageForm.get('select-mail-from') as FormControl;
  }

  get composeMessageFormInputMailSubject() {
    return this.composeMessageForm.get('input-mail-subject') as FormControl;
  }

  get composeMessageFormTextareaMailMessage() {
    return this.composeMessageForm.get('textarea-mail-message') as FormControl;
  }

  sendMail() {
    this.composeMessageFormHasError = !this.composeMessageForm.valid;

    if (!this.composeMessageFormHasError) {
      this.sentStatus = 'sending';

      if (this.composeMessageForm.value.keepcopy) {
        this.emailsCC.push(this.composeMessageForm.value['select-mail-from']);
      }

      this.contactService.contactUsers(
        this.recipients,
        this.composeMessageForm.value['select-mail-from'],
        this.emailsCC, this.emailsBCC,
        this.composeMessageForm.value['input-mail-subject'],
        this.composeMessageForm.value['textarea-mail-message']).subscribe({
          next: result => {
            if (result.success) {
              this.sentStatus = 'success';
              this.sentStatusMsg = 'Mail sent successfully!';
              setTimeout(() => {
                this.activeModal.close('Mail sent!')
              }, 3000);

            }
          },
          error: error => {
            this.sentStatus = 'danger';
            this.sentStatusMsg = error;
            /*this.activeModal.close('Error when sending mail!')*/
          }
      });
    }
  }
}
