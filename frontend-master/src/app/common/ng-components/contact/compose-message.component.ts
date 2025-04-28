import { Component, HostBinding } from '@angular/core';
import { Router } from '@angular/router';

import { slideInDownAnimation } from './animations';

import { ContactService } from '../../ng-services/contact.service';

@Component({
  templateUrl: './compose-message.component.html',
  styles: [':host { position: relative; bottom: 5%; z-index:11111; }'],
  animations: [slideInDownAnimation]
})
export class ComposeMessageComponent {
  @HostBinding('@routeAnimation') routeAnimation = true;
  @HostBinding('style.display') display = 'block';
  @HostBinding('style.position') position = 'fixed';

  message = '';
  details = '';
  sending = false;

  urlPrefix: string;

  constructor(private router: Router, private contactService: ContactService) {
    this.urlPrefix = this.router.url.split('/')[1];
  }

  send(): void {
    this.sending = true;
    this.details = 'Sending Message...';

    this.contactService.contactAdmin(this.urlPrefix, this.message).subscribe({
      next: result => {
        if (result.success) {
          this.sending = false;
          this.closePopup();
        }
      },
      error: error => {
        if (error.startsWith('Invalid token for user')) {
          this.details = 'Your session may expire. Please go back to the login page and enter your credentials again.';
        } else {
          this.details = error;
        }
        this.sending = false;
      }
    });
  }

  cancel(): void {
    this.closePopup();
  }

  closePopup(): void {
    // Providing a `null` value to the named outlet
    // clears the contents of the named outlet
    this.router.navigate([{ outlets: { contact: null } }]);
  }
}
