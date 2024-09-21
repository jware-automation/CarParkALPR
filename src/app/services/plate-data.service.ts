import { Injectable } from '@angular/core';
import { PlateData } from '../models/plate-data.model';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Ocr, TextDetections, DetectTextBase64Options } from '@capacitor-community/image-to-text';

@Injectable({
  providedIn: 'root'
})
export class PlateDataService {
  private plates: PlateData[] = [];
  public currentLocation: string = '';

  async savePlateData(numberPlate: string, image: string, imageBase64: string) {
    let state = 'Nowhere'; // Default state
    let location = 'Location not available';
    
    // Get current location
    await this.getCurrentLocation();
    location = this.currentLocation;

    // Get OCR text from base64 image
    if (imageBase64) {
      state = await this.getOcrTextFromBase64(imageBase64);
    }

    // Create a new plate data object with the detected values
    const newPlateData = new PlateData(numberPlate, image, location, state);
    this.plates.push(newPlateData);
    console.log('Plate data saved:', newPlateData);
  }

  // Method to get all saved plates
  getSavedPlates(): PlateData[] {
    return this.plates;
  }

  // Method to get current location
  async getCurrentLocation(){
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus?.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions();
        if (requestStatus?.location !== 'granted') {
          return;
        }
      }

      let options: PositionOptions = {
        maximumAge: 3000,
        timeout: 10000,
        enableHighAccuracy: true
      };
      
      this.currentLocation = 'Still not available location...';
      const position = await Geolocation.getCurrentPosition(options);
      this.currentLocation = 'Lat ' + position.coords.latitude + ', Long ' + position.coords.longitude;
    } catch (error: any) {
      console.error('Error getting location', error);
      this.currentLocation = 'Location not available';
    }
  }

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

        // Check if the detected text contains any U.S. state name
        for (let state of usStates) {
          if (detectedText.includes(state)) {
            console.log(`Detected state: ${state}`);
            return state;  // Return the first matched state
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

}
