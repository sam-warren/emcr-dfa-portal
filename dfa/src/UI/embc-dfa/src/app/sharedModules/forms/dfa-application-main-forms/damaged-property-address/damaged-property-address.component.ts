import { Component, OnInit, NgModule, Inject, OnDestroy } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  AbstractControl,
  FormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { ProfileDataService } from '../../../../feature-components/profile/profile-data.service';
import { FormCreationService } from 'src/app/core/services/formCreation.service';
import { Subscription } from 'rxjs';
import { DirectivesModule } from '../../../../core/directives/directives.module';
import { CustomValidationService } from 'src/app/core/services/customValidation.service';
import { Router } from '@angular/router';
import { distinctUntilChanged } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import * as globalConst from '../../../../core/services/globalConstants';
import { RegAddress } from 'src/app/core/model/address';
import { AddressFormsModule } from '../../address-forms/address-forms.module';
import { DFAEligibilityDialogComponent } from 'src/app/core/components/dialog-components/dfa-eligibility-dialog/dfa-eligibility-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Profile, ApplicantOption, Address } from 'src/app/core/api/models';
import { DFAApplicationMainDataService } from 'src/app/feature-components/dfa-application-main/dfa-application-main-data.service';
import { TextMaskModule } from 'angular2-text-mask';
import { MatInputModule } from '@angular/material/input';
import { ApplicationService, ProfileService } from 'src/app/core/api/services';
import { DFAApplicationMainMappingService } from 'src/app/feature-components/dfa-application-main/dfa-application-main-mapping.service';

@Component({
  selector: 'app-damaged-property-address',
  templateUrl: './damaged-property-address.component.html',
  styleUrls: ['./damaged-property-address.component.scss']
})
export default class DamagedPropertyAddressComponent implements OnInit, OnDestroy {
  damagedPropertyAddressForm: UntypedFormGroup;
  formBuilder: UntypedFormBuilder;
  damagedPropertyAddressForm$: Subscription;
  formCreationService: FormCreationService;
  private _profileAddress: Address;
  public ApplicantOptions = ApplicantOption;
  readonly phoneMask = [
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    /\d/,
    /\d/
  ];
  vieworedit: string;
  isResidentialTenant: boolean = false;

  constructor(
    @Inject('formBuilder') formBuilder: UntypedFormBuilder,
    @Inject('formCreationService') formCreationService: FormCreationService,
    public customValidator: CustomValidationService,
    private router: Router,
    public dfaApplicationMainDataService: DFAApplicationMainDataService,
    public profileDataService: ProfileDataService,
    public dialog: MatDialog,
    private applicationService: ApplicationService,
    private dfaApplicationMainMapping: DFAApplicationMainMappingService,
    private profileService: ProfileService

  ) {
    this.formBuilder = formBuilder;
    this.formCreationService = formCreationService;
  }

  public get profileAddress(): Address {
    return this._profileAddress;
  }
  public set profileAddress(value: Address) {
    this._profileAddress = value;
  }

  ngOnInit(): void {
    this.vieworedit = this.dfaApplicationMainDataService.getViewOrEdit();
    this.dfaApplicationMainDataService.getDfaApplicationStart().subscribe(application => {
      if (application) {
        if (!this.profileAddress) {
          this.profileService.profileGetProfile().subscribe(profile => {
            this.profileAddress = {
              addressLine1: profile?.primaryAddress?.addressLine1,
              addressLine2: profile?.primaryAddress?.addressLine2,
              postalCode: profile?.primaryAddress?.postalCode,
              stateProvince: profile?.primaryAddress?.stateProvince ? profile.primaryAddress?.stateProvince : "BC",
              city: profile?.primaryAddress?.city
            }
          })
        }
      }
    });

    this.damagedPropertyAddressForm$ = this.formCreationService
    .getDamagedPropertyAddressForm()
    .subscribe((damagedPropertyAddress) => {
      this.damagedPropertyAddressForm = damagedPropertyAddress;
      this.dfaApplicationMainDataService.getDfaApplicationStart().subscribe(application => {
        if (application) {
          this.isResidentialTenant = (application.appTypeInsurance.applicantOption == Object.keys(this.ApplicantOptions)[Object.values(this.ApplicantOptions).indexOf(this.ApplicantOptions.ResidentialTenant)]);
          if (!this.isResidentialTenant) {
            this.damagedPropertyAddressForm.controls.eligibleForHomeOwnerGrant.setValidators([Validators.required]);
            this.damagedPropertyAddressForm.controls.landlordGivenNames.setValidators([Validators.maxLength(100)]);
            this.damagedPropertyAddressForm.controls.landlordSurname.setValidators([Validators.maxLength(100)]);
            this.damagedPropertyAddressForm.controls.landlordPhone.setValidators([Validators.maxLength(100)]);
          } else if (this.isResidentialTenant) {
            this.damagedPropertyAddressForm.controls.eligibleForHomeOwnerGrant.setValidators(null);
            this.damagedPropertyAddressForm.controls.eligibleForHomeOwnerGrant.setValue('false');
            this.damagedPropertyAddressForm.controls.landlordGivenNames.setValidators([Validators.required, Validators.maxLength(100)]);
            this.damagedPropertyAddressForm.controls.landlordSurname.setValidators([Validators.required, Validators.maxLength(100)]);
            this.damagedPropertyAddressForm.controls.landlordPhone.setValidators([Validators.required, Validators.maxLength(100)]);
          }
        this.damagedPropertyAddressForm.updateValueAndValidity();
        }
      });
    });

    this.damagedPropertyAddressForm
      .get('addressLine1')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('addressLine1').reset();
        }
      });

    this.damagedPropertyAddressForm
      .get('addressLine2')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('addressLine2').reset();
        }
      });

    this.damagedPropertyAddressForm
      .get('community')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('community').reset();
        }
      });

    this.damagedPropertyAddressForm
      .get('stateProvince')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('stateProvince').reset();
        }
      });

    this.damagedPropertyAddressForm
      .get('postalCode')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('postalCode').reset();
        }
      });

    this.damagedPropertyAddressForm
      .get('occupyAsPrimaryResidence')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('occupyAsPrimaryResidence').reset();
        } else if (value === 'false') {
          this.dontOccupyDamagedProperty();
        }
      });

    this.damagedPropertyAddressForm
      .get('onAFirstNationsReserve')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('onAFirstNationsReserve').reset();
        } else if (value == 'true') {
          this.damagedPropertyAddressForm.get('firstNationsReserve').setValidators([Validators.required, Validators.maxLength(100)]);
        } else if (value == 'false') {
          this.damagedPropertyAddressForm.get('firstNationsReserve').setValidators([Validators.maxLength(100)]);
        }
        this.damagedPropertyAddressForm.get('firstNationsReserve').updateValueAndValidity();
        this.damagedPropertyAddressForm.updateValueAndValidity();
      });

    this.damagedPropertyAddressForm
      .get('firstNationsReserve')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('firstNationsReserve').reset();
        }
      });

    this.damagedPropertyAddressForm
      .get('manufacturedHome')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('manufacturedHome').reset();
        }
      });

    this.damagedPropertyAddressForm
      .get('eligibleForHomeOwnerGrant')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('eligibleForHomeOwnerGrant').reset();
        }
      });

      this.damagedPropertyAddressForm
      .get('landlordGivenNames')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('landlordGivenNames').reset();
        }
      });

      this.damagedPropertyAddressForm
      .get('landlordSurname')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('landlordSurname').reset();
        }
      });

      this.damagedPropertyAddressForm
      .get('landlordPhone')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('landlordPhone').reset();
        }
      });

      this.damagedPropertyAddressForm
      .get('landlordEmail')
      .valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value === '') {
          this.damagedPropertyAddressForm.get('landlordEmail').reset();
        }
      });

    this.damagedPropertyAddressForm.get('isPrimaryAndDamagedAddressSame').setValue(false);
    this.onUseProfileAddressChoice(false);

    this.getDamagedPropertyForApplication(this.dfaApplicationMainDataService.getApplicationId());
  }

  getDamagedPropertyForApplication(applicationId: string) {
    this.applicationService.applicationGetApplicationMain({ applicationId: applicationId }).subscribe({
      next: (dfaApplicationMain) => {
        //this.damagedRoomsData = damagedRooms;
        //this.damagedRoomsDataSource.next(this.damagedRoomsData);
        //this.damagedRoomsForm.get('damagedRooms').setValue(this.damagedRoomsData);
        this.dfaApplicationMainMapping.mapDFAApplicationMain(dfaApplicationMain);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  dontOccupyDamagedProperty(): void {
    this.dialog
      .open(DFAEligibilityDialogComponent, {
        data: {
          content: globalConst.dontOccupyDamagedPropertyBody
        },
        height: '260px',
        width: '700px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === 'cancel') {
          this.submitFile();
          }
        else if (result === 'confirm') {
          this.damagedPropertyAddressForm.controls.occupyAsPrimaryResidence.setValue("true");
        }
        else this.damagedPropertyAddressForm.controls.occupyAsPrimaryResidence.setValue(null);
      });
  }

  submitFile(): void {
    this.applicationService
      .applicationUpdateApplication({body: this.dfaApplicationMainDataService.createDFAApplicationMainDTO()})
      .subscribe({
       next: (updateMessage) => {
          this.router.navigate(['/verified-registration/dashboard']);
        },
        error: (error) => {
          console.error(error);
        }
      });
  }

  onUseProfileAddressChoice(choice: any) {
    this.damagedPropertyAddressForm.controls.stateProvince.setValue("BC");
    if (!choice.value) return; // not a radio button change
    if (choice.value == 'true') // yes
    {
      this.damagedPropertyAddressForm.controls.addressLine1.setValue(this.profileAddress.addressLine1);
      this.damagedPropertyAddressForm.controls.addressLine2.setValue(this.profileAddress.addressLine2);
      this.damagedPropertyAddressForm.controls.community.setValue(this.profileAddress.city);
      this.damagedPropertyAddressForm.controls.stateProvince.setValue(this.profileAddress.stateProvince);
      this.damagedPropertyAddressForm.controls.postalCode.setValue(this.profileAddress.postalCode);
    } else { // no
      this.damagedPropertyAddressForm.controls.addressLine1.setValue(null);
      this.damagedPropertyAddressForm.controls.addressLine2.setValue(null);
      this.damagedPropertyAddressForm.controls.community.setValue(null);
      this.damagedPropertyAddressForm.controls.postalCode.setValue(null);
    }
  }

  /**
   * Returns the control of the form
   */
  get damagedPropertyAddressFormControl(): { [key: string]: AbstractControl } {
    return this.damagedPropertyAddressForm.controls;
  }

  ngOnDestroy(): void {
    this.damagedPropertyAddressForm$.unsubscribe();
  }
}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    TextMaskModule,
    MatRadioModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    DirectivesModule,
    AddressFormsModule
  ],
  declarations: [DamagedPropertyAddressComponent]
})
class DamagedPropertyAddressModule {}