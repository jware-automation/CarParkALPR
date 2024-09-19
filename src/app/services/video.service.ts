import { Injectable } from '@angular/core';
import { OpenALPR, OpenALPRResult } from '@awesome-cordova-plugins/openalpr/ngx';
import { Platform } from '@ionic/angular';
import { PlateDataService } from './plate-data.service';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private videoStream: MediaStream | null = null;
  public videoStreamStatus: string = 'Not Started';
  public videoStreamError: string = '';
  // public videoFrameCount: number = 0;
  public base64Data: string = '';
  // public allDetectedPlates: string | null = null;
  public detectedPlates: string[] = []; // Array to store detected plates
  public currentPlate: string | null = null; // Holds the current detected plate
  private scanningPaused: boolean = false; // Controls whether to capture new frames
  public currentFrameImage: string | null = null; // Holds the current captured frame as image
  constructor(private platform: Platform, private openALPR: OpenALPR, private plateDataService: PlateDataService) {}

  async startVideoStream(videoElement: HTMLVideoElement): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoElement.srcObject = stream;
      this.videoStream = stream;
      this.videoStreamStatus = 'Started';
      return stream;
    } catch (error) {
      console.error('Error accessing the camera', error);
      this.videoStreamError = 'Error accessing the camera';
      return null;
    }
  }

  async scanVideoStream(videoElement: HTMLVideoElement): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      const captureFrame = async () => {
        if (this.scanningPaused || !this.videoStream) return; // Stop capturing if paused
        
        // Create a canvas to capture the current video frame
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth * 0.95;
        canvas.height = videoElement.videoHeight * 0.95;
      
        const context = canvas.getContext('2d');
        if (!context) return;

        // Draw the current video frame onto the canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert canvas to base64 image
        const capturedPhoto = canvas.toDataURL('image/png');
        this.base64Data = await this.readAsBase64(capturedPhoto);

        this.base64Data = this.base64Data.split(',')[1];
        // this.videoStreamStatus = this.base64Data;
        // this.videoFrameCount++;

        if (this.platform.is('cordova')) {
          // Use OpenALPR if running on Cordova
          try {
            const result: [OpenALPRResult] = await this.openALPR.scan(this.base64Data, {
              country: this.openALPR.Country.US,
              amount: 3,
            });

            if (result.length > 0) {
              // this.allDetectedPlates += result[0].number + ', ';
              this.currentPlate = result[0].number;
              this.scanningPaused = true;
              this.currentFrameImage = capturedPhoto; // Save the current captured image
              this.plateDataService.savePlateData(this.currentPlate, this.currentFrameImage);
              resolve(result[0].number); // Resolve with detected plate
            } else {
              requestAnimationFrame(captureFrame); // Continue scanning if no result
            }
          } catch (error) {
            console.error('ALPR scan failed', error);
            resolve(null); // Handle failure
          }
        } else {
          // Mock results for web browser
          console.log('Cordova not available, using mock result');
          if (Math.floor(Math.random() * 6) !== 3) {
            requestAnimationFrame(captureFrame); // Continue scanning
          } else {
            setTimeout(() => {
              this.currentPlate = 'MOCK123'; // Mock plate number
              this.scanningPaused = true; 
              resolve(this.currentPlate);
            }, 5000); // Simulate a delay for scanning
          }
        }
      };

      captureFrame();
    });
  }

  saveAndStartNewScan(): void {
    if (this.currentPlate) {
      this.detectedPlates.push(this.currentPlate); // Save the current plate to the array
      this.currentPlate = null; // Reset the current plate
    }
    this.scanningPaused = false;
    this.currentFrameImage = null; // Reset current image
    this.scanVideoStream(document.querySelector('video')!); // Start a new scan
  }

  clearAndStartNewScan(): void {
    // this.detectedPlates = []; // Clear the detected plates array
    this.currentPlate = null; // Reset the current plate
    this.currentFrameImage = null; // Reset current image
    this.scanningPaused = false;
    this.scanVideoStream(document.querySelector('video')!); // Start
  }

  private async readAsBase64(photo: string): Promise<string> {
    const response = await fetch(photo);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
    
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

