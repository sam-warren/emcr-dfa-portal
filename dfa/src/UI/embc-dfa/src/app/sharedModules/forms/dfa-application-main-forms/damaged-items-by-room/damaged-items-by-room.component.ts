import { Component, OnInit, NgModule, Inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  AbstractControl,
  Validators,
} from '@angular/forms';
import { CommonModule, KeyValue } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { FormCreationService } from 'src/app/core/services/formCreation.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DirectivesModule } from '../../../../core/directives/directives.module';
import { CustomValidationService } from 'src/app/core/services/customValidation.service';
import { distinctUntilChanged } from 'rxjs/operators';
import { FileUpload } from 'src/app/core/model/dfa-application-main.model';
import { FileCategory, RoomType } from 'src/app/core/api/models';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CoreModule } from 'src/app/core/core.module';
import { DFAApplicationMainService } from 'src/app/feature-components/dfa-application-main/dfa-application-main.service';
import * as constant from 'src/app/core/services/globalConstants'; // referenced in html
import { DFAApplicationMainDataService } from 'src/app/feature-components/dfa-application-main/dfa-application-main-data.service';

@Component({
  selector: 'app-damaged-items-by-room',
  templateUrl: './damaged-items-by-room.component.html',
  styleUrls: ['./damaged-items-by-room.component.scss']
})
export default class DamagedItemsByRoomComponent implements OnInit, OnDestroy {
  damagedRoomsForm: UntypedFormGroup;
  formBuilder: UntypedFormBuilder;
  damagedRoomsForm$: Subscription;
  damagePhotosForm: UntypedFormGroup;
  damagePhotosForm$: Subscription;
  formCreationService: FormCreationService;
  RoomTypes = RoomType;
  showOtherRoomType: boolean = false;
  showGarageHint: boolean = false;
  showDamagedRoomForm: boolean = false;
  damagedRoomsColumnsToDisplay = ['roomType', 'description', 'icons'];
  damagedRoomsDataSource = new BehaviorSubject([]);
  damagedRoomsData = [];
  remainingLength: number = 2000;
  damagedRoomEditIndex: number;
  damagedRoomRowEdit = false;
  damagedRoomEditFlag = false;
  showDamagePhotoForm: boolean = false;
  damagePhotosColumnsToDisplay = ['fileName', 'fileDescription', 'uploadedDate', 'icons'];
  damagePhotosDataSource = new BehaviorSubject([]);
  damagePhotosData = [] as FileUpload[];
  allowedFileTypes = [
    'application/pdf',
    'image/jpg',
    'image/jpeg',
    'image/png'
  ];

  damagePhotoEditIndex: number;
  damagePhotoRowEdit = false;
  damagePhotoEditFlag = false;
  FileCategories = FileCategory;

  constructor(
    @Inject('formBuilder') formBuilder: UntypedFormBuilder,
    @Inject('formCreationService') formCreationService: FormCreationService,
    public customValidator: CustomValidationService,
    private dfaApplicationMainService: DFAApplicationMainService,
    private dfaApplicationMainDataService: DFAApplicationMainDataService
  ) {
    this.formBuilder = formBuilder;
    this.formCreationService = formCreationService;
  }

  ngOnInit(): void {
    this.damagedRoomsForm$ = this.formCreationService
      .getDamagedRoomsForm()
      .subscribe((damagedRooms) => {
        this.damagedRoomsForm = damagedRooms;
      });

    this.damagePhotosForm$ = this.formCreationService
      .getFileUploadsForm()
      .subscribe(fileUploads => {
        this.damagePhotosForm = fileUploads;
      });

    this.dfaApplicationMainService.deleteDamagePhoto.subscribe((damagePhotoToDelete)=> {
      let index = this.damagePhotosData.indexOf(damagePhotoToDelete);
      this.deleteDamagePhotoRow(index);
    })

    this.damagedRoomsForm
    .get('damagedRoom.roomType')
    .valueChanges.pipe(distinctUntilChanged())
    .subscribe((value) => {
      if (value === '') {
        this.damagedRoomsForm.get('damagedRoom.roomType').reset();
      }
      if (value === RoomType.Other) {
        this.showOtherRoomType = true;
        this.showGarageHint = false;
      } else if (value === RoomType.Garage) {
        this.showGarageHint = true;
        this.showOtherRoomType = false;
      } else {
        this.showGarageHint = false;
        this.showOtherRoomType = false;
      }
    });

    this.damagedRoomsForm
      .get('addNewDamagedRoomIndicator')
      .valueChanges.subscribe((value) => this.updateDamagedRoomOnVisibility());
    this.damagedRoomsForm.get('damagedRoom.otherRoomType').setValidators(null);
    this.damagedRoomsDataSource.next(
        this.damagedRoomsForm.get('damagedRooms').value
      );
    this.damagedRoomsData = this.damagedRoomsForm.get('damagedRooms').value;

    this.damagePhotosForm
      .get('addNewFileUploadIndicator')
      .valueChanges.subscribe((value) => this.updateDamagePhotoOnVisibility());
    this.damagePhotosDataSource.next(
        this.damagePhotosForm.get('fileUploads').value
      );
    this.damagePhotosData = this.damagePhotosForm.get('fileUploads').value;

  }

  calcRemainingChars() {
    this.remainingLength = 2000 - this.damagedRoomsForm.get('description').value?.length;
  }

  addDamagedRoom(): void {
    this.damagedRoomsForm.get('damagedRoom').reset();
    this.damagedRoomsForm.get('damagedRoom.otherRoomType').setValidators(null);
    this.damagedRoomsForm.get('addNewDamagedRoomIndicator').setValue(true);
    this.damagedRoomsForm.get('damagedRoom.deleteFlag').setValue(false);
    this.damagedRoomsForm.get('damagedRoom.applicationId').setValue(this.dfaApplicationMainDataService.dfaApplicationStart.id);
    this.showOtherRoomType = false;
    this.damagedRoomEditFlag = !this.damagedRoomEditFlag;
    this.showDamagedRoomForm = !this.showDamagedRoomForm;
  }

  saveDamagedRooms(): void {
    if (this.damagedRoomsForm.get('damagedRoom').status === 'VALID') {
      if (this.damagedRoomEditIndex !== undefined && this.damagedRoomRowEdit) {
        this.damagedRoomsData[this.damagedRoomEditIndex] =
          this.damagedRoomsForm.get('damagedRoom').value;
        this.damagedRoomRowEdit = !this.damagedRoomRowEdit;
        this.damagedRoomEditIndex = undefined;
      } else {
        this.damagedRoomsData.push(this.damagedRoomsForm.get('damagedRoom').value);
      }
      this.damagedRoomsDataSource.next(this.damagedRoomsData);
      this.damagedRoomsForm.get('damagedRooms').setValue(this.damagedRoomsData);
      this.showDamagedRoomForm = !this.showDamagedRoomForm;
      this.damagedRoomEditFlag = !this.damagedRoomEditFlag;
    } else {
      this.damagedRoomsForm.get('damagedRoom').markAllAsTouched();
    }
  }

  cancelDamagedRooms(): void {
    this.showDamagedRoomForm = !this.showDamagedRoomForm;
    this.damagedRoomEditFlag = !this.damagedRoomEditFlag;
    this.damagedRoomsForm.get('addNewDamagedRoomIndicator').setValue(false);
  }

  deleteDamagedRoomRow(index: number): void {
    this.damagedRoomsData.splice(index, 1);
    this.damagedRoomsDataSource.next(this.damagedRoomsData);
    this.damagedRoomsForm.get('damagedRooms').setValue(this.damagedRoomsData);
    if (this.damagedRoomsData.length === 0) {
      this.damagedRoomsForm
        .get('addNewDamagedRoomIndicator')
        .setValue(false);
    }
  }

   editDamagedRoomRow(element, index): void {
    this.damagedRoomEditIndex = index;
    this.damagedRoomRowEdit = !this.damagedRoomRowEdit;
    this.damagedRoomsForm.get('damagedRoom').setValue(element);
    this.showDamagedRoomForm = !this.showDamagedRoomForm;
    this.damagedRoomEditFlag = !this.damagedRoomEditFlag;
    this.damagedRoomsForm.get('addNewDamagedRoomIndicator').setValue(true);
  }

  // Preserve original property order
  originalOrder = (a: KeyValue<number,string>, b: KeyValue<number,string>): number => {
    return 0;
  }

  onSelectRoomType(roomType: RoomType) {
    if (roomType === this.RoomTypes.Other) {
      this.damagedRoomsForm.get('damagedRoom.otherRoomType').setValidators([Validators.required]);
    } else {
      this.damagedRoomsForm.get('damagedRoom.otherRoomType').setValidators(null);
    }
  }

  addDamagePhoto(): void {
    this.damagePhotosForm.get('fileUpload').reset();
    this.damagePhotosForm.get('fileUpload.modifiedBy').setValue("Applicant");
    this.damagePhotosForm.get('fileUpload.fileType').setValue(this.FileCategories.DamagePhoto);
    this.showDamagePhotoForm = !this.showDamagePhotoForm;
    this.damagePhotoEditFlag = !this.damagePhotoEditFlag;
    this.damagePhotosForm.get('addNewFileUploadIndicator').setValue(true);
    this.damagePhotosForm.get('fileUpload.deleteFlag').setValue(false);
    this.damagePhotosForm.get('fileUpload.applicationId').setValue(this.dfaApplicationMainDataService.dfaApplicationStart.id);
  }

  saveDamagePhotos(): void {
    if (this.damagePhotosForm.get('fileUpload').status === 'VALID') {
      if (this.damagePhotoEditIndex !== undefined && this.damagePhotoRowEdit) {
        this.damagePhotosData[this.damagePhotoEditIndex] =
          this.damagePhotosForm.get('fileUpload').getRawValue();
        this.damagePhotoRowEdit = !this.damagePhotoRowEdit;
        this.damagePhotoEditIndex = undefined;
      } else {
        this.damagePhotosData.push(this.damagePhotosForm.get('fileUpload').value);
      }
      this.damagePhotosDataSource.next(this.damagePhotosData);
      this.damagePhotosForm.get('fileUploads').setValue(this.damagePhotosData);
      this.showDamagePhotoForm = !this.showDamagePhotoForm;
      this.damagePhotoEditFlag = !this.damagePhotoEditFlag;
    } else {
      this.damagePhotosForm.get('fileUpload').markAllAsTouched();
    }
  }

  cancelDamagePhotos(): void {
    this.showDamagePhotoForm = !this.showDamagePhotoForm;
    this.damagePhotoEditFlag = !this.damagePhotoEditFlag;
    this.damagePhotosForm.get('addNewFileUploadIndicator').setValue(false);
  }

  deleteDamagePhotoRow(index: number): void {
    this.damagePhotosData.splice(index, 1);
    this.damagePhotosDataSource.next(this.damagePhotosData);
    this.damagePhotosForm.get('fileUploads').setValue(this.damagePhotosData);
    if (this.damagePhotosData.length === 0) {
      this.damagePhotosForm
        .get('addNewFileUploadIndicator')
        .setValue(false);
    }
  }

   editDamagePhotoRow(element, index): void {
    this.damagePhotoEditIndex = index;
    this.damagePhotoRowEdit = !this.damagePhotoRowEdit;
    this.damagePhotosForm.get('fileUpload').setValue(element);
    this.showDamagePhotoForm = !this.showDamagePhotoForm;
    this.damagePhotoEditFlag = !this.damagePhotoEditFlag;
    this.damagePhotosForm.get('addNewFileUploadIndicator').setValue(true);
  }

  updateDamagedRoomOnVisibility(): void {
    this.damagedRoomsForm
      .get('damagedRoom.roomType')
      .updateValueAndValidity();
    this.damagedRoomsForm
      .get('damagedRoom.otherRoomType')
      .updateValueAndValidity();
    this.damagedRoomsForm
      .get('damagedRoom.description')
      .updateValueAndValidity();
  }

  updateDamagePhotoOnVisibility(): void {
    this.damagePhotosForm
      .get('fileUpload.fileName')
      .updateValueAndValidity();
    this.damagePhotosForm
      .get('fileUpload.fileDescription')
      .updateValueAndValidity();
    this.damagePhotosForm
      .get('fileUpload.fileType')
      .updateValueAndValidity();
    this.damagePhotosForm
      .get('fileUpload.uploadedDate')
      .updateValueAndValidity();
    this.damagePhotosForm
      .get('fileUpload.modifiedBy')
      .updateValueAndValidity();
    this.damagePhotosForm
      .get('fileUpload.fileData')
      .updateValueAndValidity();
  }

  /**
   * Returns the control of the form
   */
  get damagedRoomsFormControl(): { [key: string]: AbstractControl } {
    return this.damagedRoomsForm.controls;
  }

  updateOnVisibility(): void {
    this.damagedRoomsForm.get('field').updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.damagedRoomsForm$.unsubscribe();
  }

/**
 * Reads the attachment content and encodes it as base64
 *
 * @param event : Attachment drop/browse event
 */
  setFileFormControl(event: any) {
    const reader = new FileReader();
    reader.readAsDataURL(event);
    reader.onload = () => {
      this.damagePhotosForm.get('fileUpload.fileName').setValue(event.name);
      this.damagePhotosForm.get('fileUpload.fileDescription').setValue(event.name);
      this.damagePhotosForm.get('fileUpload.fileData').setValue(reader.result);
      this.damagePhotosForm.get('fileUpload.contentType').setValue(event.type);
      this.damagePhotosForm.get('fileUpload.fileSize').setValue(event.size);
      this.damagePhotosForm.get('fileUpload.uploadedDate').setValue(new Date());
    };
  }
}

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    DirectivesModule,
  ],
  declarations: [DamagedItemsByRoomComponent]
})
class DamagedItemsByRoomModule {}
