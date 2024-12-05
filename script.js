'use strict'

class Workout {
    date = new Date()
    id = (Date.now() + '').slice(-10)
    clicks = 0

    constructor(distance, duration, coords) {
        this.distance = distance
        this.duration = duration
        this.coords = coords
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(
            1
        )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }

    click() {
        this.clicks++
    }
}

class Running extends Workout {
    type = 'running'
    pace

    constructor(coords, distance, duration, cadence) {
        super(distance, duration, coords)
        this.cadence = cadence
        this.calcPace()
        this._setDescription()
    }

    calcPace() {
        // min/km
        this.pace = this.duration / this.distance
        return this.pace
    }
}

class Cycling extends Workout {
    type = 'cycling'
    speed

    constructor(distance, duration, coords, elevationGain) {
        super(distance, duration, coords)
        this.elevationGain = elevationGain
        this.calcSpeed()
        this._setDescription()
    }

    calcSpeed() {
        // km/h
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}

// Application Architecture

const form = document.querySelector('.form')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__input--type')
const inputDistance = document.querySelector('.form__input--distance')
const inputDuration = document.querySelector('.form__input--duration')
const inputCadence = document.querySelector('.form__input--cadence')
const inputElevation = document.querySelector('.form__input--elevation')
const reset = document.querySelector('.reset')

class App {
    #map
    #mapEvent
    #workout = []

    constructor() {
        this._getPosition()
        this._getlocalStorage()
        reset.addEventListener('click', this._reset.bind(this))
        form.addEventListener('submit', this._newWorkout.bind(this))
        inputType.addEventListener('change', this._toggleElevationField)
        containerWorkouts.addEventListener(
            'click',
            this._moveToPopup.bind(this)
        )
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Could not get your location!')
                }
            )
    }
    _loadMap(position) {
        if (
            !position ||
            !position.coords ||
            !position.coords.latitude ||
            !position.coords.longitude
        ) {
            console.error('Invalid location data:', position)
            return
        }

        const { latitude, longitude } = position.coords
        const coords = [latitude, longitude]

        //if the map is already initialized to prevent reloading it 👇
        if (!this.#map) {
            this.#map = L.map('map').setView(coords, 14)

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(this.#map)

            this.#map.on('click', this._showForm.bind(this))
        }

        this.#workout.forEach((work) => {
            this._renderWorkoutMarker(work)
        })
    }

    _showForm(mapE) {
        this.#mapEvent = mapE /// mapEvent is the property of leaflet map to get the current location data when clicked
        form.classList.remove('hidden')
        inputDistance.focus()
    }
    _hideForm() {
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                ''
        form.style.display = 'none'
        form.classList.add('hidden')
        setTimeout(() => (form.style.display = 'grid'), 1000)
    }

    _toggleElevationField() {
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(e) {
        e.preventDefault()
        const validInputs = (...inputs) =>
            inputs.every((inp) => Number.isFinite(inp))
        const allPositive = (...inputs) => inputs.every((inp) => inp > 0)

        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const { lat, lng } = this.#mapEvent.latlng
        let workout

        if (type === 'running') {
            const cadence = +inputCadence.value
            if (
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            ) {
                return alert('Inputs have to be positive numbers!')
            }
            workout = new Running([lat, lng], distance, duration, cadence)
        }

        if (type === 'cycling') {
            const elevation = +inputElevation.value
            if (
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)
            ) {
                return alert('Inputs have to be positive numbers!')
            }
            workout = new Cycling(distance, duration, [lat, lng], elevation)
        }

        this.#workout.push(workout)

        this._renderWorkoutMarker(workout)

        this._renderWorkout(workout)
        const now = new Date()
        const ID = now.getSeconds()
        // connection with backend . in this i added all needed data and also added time to be more specific
        fetch('http://localhost:3000/workouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: ID,
                workout_name: workout.type,
                distance: workout.distance,
                duration: workout.duration,
                coords: workout.coords,
                cadence:
                    workout.type === 'running' ? workout.cadence : undefined,
                elevation:
                    workout.type === 'cycling'
                        ? workout.elevationGain
                        : undefined,
                workout_date: new Date().toISOString().split('T')[0],
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Workout added:', data)
            })
            .catch((error) => {
                console.error('Error adding workout:', error)
            })

        this._hideForm()

        _setLocalStorage()

        _getlocalStorage()
        this._reset()
    }
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workout))
    }
    _getlocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'))
        if (!data) return // If no data, return early
        this.#workout = data
        this.#workout.forEach((work) => {
            this._renderWorkout(work)
        })
    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(
                `${workout.type === 'running' ? '🏃‍♂️' : '🚴'} ${
                    workout.description
                }`
            )
            .openPopup()
    }

    _renderWorkout(workout) {
        let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
`

        if (workout.type === 'running') {
            html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
  `
        }

        if (workout.type === 'cycling') {
            html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `
        }

        form.insertAdjacentHTML('afterend', html)
    }

    _moveToPopup(e) {
        if (!this.#map) return
        // e.preventDefault();
        const workoutEl = e.target.closest('.workout')

        if (!workoutEl) return

        const workout = this.#workout.find(
            (work) => work.id === workoutEl.dataset.id
        )

        this.#map.setView(workout.coords, 13, {
            animate: true,
            pan: {
                duration: 1,
            },
        })
        // workout.click();
    }

    _reset(e) {
        e.preventDefault()
        localStorage.removeItem('workout')
        location.reload()
    }
}
const app = new App()
