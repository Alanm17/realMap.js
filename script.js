'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class Workout {
  date = new Date();
  id = (Date.now() - '').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords; //[lat,lng]
  }
}
class Running extends Workout {
  pace;
  constructor(distance, duration, coords, cadance) {
    super(distance, duration, coords);
    this.cadance = cadance;
    this.calcPace();
  }
  calcPace() {
    // min/ km;
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  speed;
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    // km/h;
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class App {
  #map;
  #mapEvent;
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    form.addEventListener('change', this._toggleElevationField);
  }
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your location!');
        }
      );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE; // bu mapE biz tanlagan locationni mapEventga saqlaydi
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();
    //removing the input fields by making them equal to empty string
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    //displaying the marker in here below code👨‍💻
    console.log(this.#mapEvent.latlng);
    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('Training')
      .openPopup();
  }
}
const app = new App();
