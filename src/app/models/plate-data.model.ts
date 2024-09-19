export class PlateData {
  numberPlate: string;
  image: string;
  location: string;
  time: Date;
  state: string;

  constructor(numberPlate: string, image: string, location: string, state: string) {
    this.numberPlate = numberPlate;
    this.image = image;
    this.location = location;
    this.time = new Date(); // Automatically set the current time
    this.state = state; // Hardcoded or dynamic later
  }
}
