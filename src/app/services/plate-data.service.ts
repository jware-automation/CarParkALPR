import { Injectable } from '@angular/core';
import { PlateData } from '../models/plate-data.model';
import { Geolocation, Position } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class PlateDataService {
  private plates: PlateData[] = [];
  public currentLocation: string = '';

  async savePlateData(numberPlate: string, image: string, state: string) {
    let location = 'Location not available';
    
    // Get current location
    await this.getCurrentLocation();
    location = this.currentLocation;


    // Get OCR text from base64 image
    // if (imageBase64) {
    //   state = await this.getOcrTextFromBase64(imageBase64);
    // }

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

  
}

