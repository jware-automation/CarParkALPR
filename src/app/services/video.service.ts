import { Injectable } from '@angular/core';
import { OpenALPR, OpenALPRResult } from '@awesome-cordova-plugins/openalpr/ngx';
import { Platform } from '@ionic/angular';
import { PlateDataService } from './plate-data.service';
import { Ocr, TextDetections, DetectTextBase64Options } from '@capacitor-community/image-to-text';


@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private videoStream: MediaStream | null = null;
  public videoStreamStatus: string = '';
  public videoStreamError: string = '';
  public textDetections: any[] = [];
  public detectedText: string = '';
  public detectedState: string = 'No state detected';
  // public videoFrameCount: number = 0;
  public base64Data: string = '';
  // public allDetectedPlates: string | null = null;
  public detectedPlates: string[] = []; // Array to store detected plates
  public currentPlate: string | null = null; // Holds the current detected plate
  // private scanningPaused: boolean = false; // Controls whether to capture new frames
  public currentFrameImage: string | null = null; // Holds the current captured frame as image
  constructor(private platform: Platform, private openALPR: OpenALPR, private plateDataService: PlateDataService) {}

  async startVideoStream(videoElement: HTMLVideoElement): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoElement.srcObject = stream;
      this.videoStream = stream;
      // this.videoStreamStatus = 'Started';
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
        // this.videoStreamStatus = "scan steam";
        if (!this.videoStream) return; // Stop capturing if paused
        
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
        
        if (this.base64Data) {
          try {
            const state = await this.getOcrTextFromBase64(this.base64Data);
          } catch (error) {
            console.error('Error getting OCR text', error);
          }
        }
        if (this.currentPlate == null) {
          if (this.platform.is('cordova') && this.base64Data && !this.currentPlate) {
            // Use OpenALPR if running on Cordova
            try {
              const result: [OpenALPRResult] = await this.openALPR.scan(this.base64Data, {
                country: this.openALPR.Country.US,
                amount: 3,
              });

              if (result.length > 0) {
                // this.allDetectedPlates += result[0].number + ', ';
                this.currentPlate = result[0].number;
                this.currentFrameImage = capturedPhoto; // Save the current captured image
                // this.detectedText = await this.frameTextDetection(capturedPhoto);
                // this.plateDataService.savePlateData(this.currentPlate, this.currentFrameImage);
                resolve(result[0].number); // Resolve with detected plate
              } 
              requestAnimationFrame(captureFrame); // Continue scanning if no result
            } catch (error) {
              console.error('ALPR scan failed', error);
              resolve(null); // Handle failure
            }
          } else {
            if (!this.platform.is('cordova') ){

              console.log('Cordova not available, using mock result');
              if (Math.floor(Math.random() * 6) !== 3) {
                requestAnimationFrame(captureFrame); // Continue scanning
              } else {
                setTimeout(() => {
                  this.currentPlate = 'MOCK123'; // Mock plate number
                  resolve(this.currentPlate);
                }, 5000); // Simulate a delay for scanning
              }
            }
            else{
              this.clearAndStartNewScan();
            }
          }
        }
      };

      try{
        captureFrame();
      } catch (error) {
        this.videoStreamError = 'Error capturing frame';
      }
    });
  }

  saveAndStartNewScan(): void {
    if (this.currentPlate) {
      this.detectedPlates.push(this.currentPlate); // Save the current plate to the array
      if (this.currentFrameImage) {
        this.plateDataService.savePlateData(this.currentPlate, this.currentFrameImage, this.detectedState); // Save the plate data
      }
      this.currentPlate = null; // Reset the current plate
    }
    this.currentFrameImage = null; // Reset current image
    this.detectedState = 'No state detected';
    this.scanVideoStream(document.querySelector('video')!); // Start a new scan
  }

  clearAndStartNewScan(): void {
    // this.detectedPlates = []; // Clear the detected plates array
    this.currentPlate = null; // Reset the current plate
    this.currentFrameImage = null; // Reset current image
    this.detectedState = 'No state detected';
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

  // Method to get OCR text from base64 image data (last detected text)
  async getOcrTextFromBase64(base64Image: string): Promise<string> {
  const usStates: string[] = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  try {
    // Define the OCR options with base64 image data
    const options: DetectTextBase64Options = {
      base64: base64Image,
    };

    // Send the base64 image to OCR
    const data: TextDetections = await Ocr.detectText(options);

    if (data.textDetections.length > 0) {
      // Loop through all detected text blocks
      for (let detection of data.textDetections) {
        const detectedText = detection.text;
        
        for (let state of usStates) {
          if (detectedText.toLowerCase().includes(state.toLowerCase())) {
            console.log(`Detected state: ${state}`);
            this.detectedState = state;
            return state;  // Return the detected state
          }
        }
      }
      return 'State not found';  // Return if no state is matched
    } else {
      return 'No text detected';
    }
  } catch (error) {
    console.error('Error during OCR processing', error);
    return 'OCR failed';
  }
}

  //ocr text detection
  // private frameTextDetection = async (photo: string): Promise<string> => {
  //   const data: TextDetections = await Ocr.detectText({
  //     filename: photo!,
  //   });

  //   console.log(data);

  //   this.textDetections = data.textDetections;
  //   console.log(this.textDetections);
  //   return data.textDetections[0].text;
  // }

  
}

