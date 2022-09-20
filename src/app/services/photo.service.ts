import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo} from '@capacitor/camera';
import { Filesystem , Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  public photos: UserPhoto[]= [];
  private photoStorage = 'photos';
  constructor() { }

  public async addNewToGallery(){
    //Prendre une photo
    const capturedPhoto = await Camera.getPhoto({
      resultType:CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    //Enregistrer photo et ajout au tableau de photos
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    Storage.set({
      key: this.photoStorage,
      value: JSON.stringify(this.photos),

    });
  }

  public async loadSaved(){
    //Retrieve cached photo array data
    const photoList = await Storage.get({key: this.photoStorage});
    this.photos = JSON.parse(photoList.value) || [];
    //Display the photo by readng into base64 format
    for(const photo of this.photos) {
      //Read each saved photos's data fromthe Filesystem
      const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data,
      });
      //Web platform only: Load the photo as base64 data
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }

  public async savePicture(photo: Photo){
    const base64Data = await this.readAsBase64(photo);

    //Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory:Directory.Data
    });

    //Use webPath to display the new image instead of base64 since it's
    //already loaded in memory
    return {
      filepath: fileName,
      webviewPath:photo.webPath
    };
  }


  private async readAsBase64(photo: Photo) {
    //Fetch the photo,read as blob,then convert to base64 format
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve,reject) =>{
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () =>{
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);

  });
}

export interface UserPhoto {
  filepath: string;
  webviewPath: string;
}
