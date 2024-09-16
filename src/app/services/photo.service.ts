import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { OpenALPR, OpenALPROptions, OpenALPRResult } from '@awesome-cordova-plugins/openalpr/ngx';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];
  public openALPRResults: OpenALPRResult[] = [];
  private platform: Platform;

  constructor(platform: Platform, private openALPR: OpenALPR) {
    this.platform = platform;
  }

  public async addNewToGallery() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    let res = '';
    const base64Data = await this.readAsBase64(capturedPhoto);

    this.openALPR.scan(base64Data, {
      country: this.openALPR.Country.US,
      amount: 3
    }).then((result: [OpenALPRResult]) => {

      res = "Success";

      result.sort((a, b) => {
        if (a.confidence > b.confidence) return -1;
        if (a.confidence < b.confidence) return 1;
        return 0;
      })

      this.openALPRResults.push(...result)

      this.photos.unshift({
        filepath: capturedPhoto.format,
        webviewPath: capturedPhoto.webPath!,
        detectionResult: res!,
        resultsArray: result.length!,
        plateNumber: result[0].number!,
        confidence: result[0].confidence!
      });
    })
      .catch(error => {

        res = "Failed";

        this.photos.unshift({
          filepath: "soon...",
          webviewPath: capturedPhoto.webPath!,
          detectionResult: res!
        });

      });
  }

  private async readAsBase64(photo: Photo) {
    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // Read the file into base64 format
      const file = await Filesystem.readFile({
        path: photo.path!
      });

      return file.data;
    }
    else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();

      return await this.convertBlobToBase64(blob) as string;
    }
  }

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  detectionResult?: string;
  resultsArray?: number;
  plateNumber?: string;
  confidence?: number;
}