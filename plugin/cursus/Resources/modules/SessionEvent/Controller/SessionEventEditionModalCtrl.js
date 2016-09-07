/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/*global Routing*/
/*global Translator*/

export default class SessionEventEditionModalCtrl {
  constructor($http, $uibModalInstance, CourseService, SessionService, title, sessionEvent, callback) {
    this.$http = $http
    this.$uibModalInstance = $uibModalInstance
    this.CourseService = CourseService
    this.callback = callback
    this.title = title
    this.source = sessionEvent
    this.sessionEvent = {
      name: null,
      startDate: null,
      endDate: null,
      description: null,
      location: null,
      locationExtra: null,
      internalLocation: false,
      locationResource: null,
      tutors: []
    }
    this.sessionEventErrors = {
      name: null,
      startDate: null,
      endDate: null
    }
    this.dateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      placeHolder: 'jj/mm/aaaa'
    }
    this.dates = {
      start: {format: 'dd/MM/yyyy', open: false},
      end: {format: 'dd/MM/yyyy', open: false}
    }
    this.tinymceOptions = CourseService.getTinymceConfiguration()
    this.locations = []
    this.location = null
    this.locationResources = []
    this.locationResource = null
    this.tutorsList = SessionService.getTutorsBySession(this.source['session']['id'])
    this.tutors = []
    this.initializeSessionEvent()
  }

  initializeSessionEvent () {
    this.sessionEvent['name'] = this.source['name']
    this.sessionEvent['startDate'] = this.source['startDate'].replace(/\+.*$/, '')
    this.sessionEvent['endDate'] = this.source['endDate'].replace(/\+.*$/, '')

    if (this.source['description']) {
      this.sessionEvent['description'] = this.source['description']
    }

    if (this.source['locationExtra']) {
      this.sessionEvent['locationExtra'] = this.source['locationExtra']
    }

    if (this.source['locationResource']) {
      this.sessionEvent['internalLocation'] = true
    }
    this.CourseService.getLocations().then(d => {
      d.forEach(r => this.locations.push(r))

      if (this.source['location']) {
        const selectedLocation = this.locations.find(l => l['id'] === this.source['location']['id'])
        this.location = selectedLocation
      }
    })
    this.CourseService.getLocationResources().then(d => {
      d.forEach(r => this.locationResources.push(r))

      if (this.source['locationResource']) {
        const selectedResource = this.locationResources.find(lr => lr['id'] === this.source['locationResource']['id'])
        this.locationResource = selectedResource
      }
    })
    this.source['tutors'].forEach(t => {

      const selectedTutor = this.tutorsList.find(tl => t['id'] === tl['userId'])
      this.tutors.push(selectedTutor)
    })
  }

  submit () {
    this.resetErrors()

    if (!this.sessionEvent['name']) {
      this.sessionEventErrors['name'] = Translator.trans('form_not_blank_error', {}, 'cursus')
    } else {
      this.sessionEventErrors['name'] = null
    }

    if (!this.sessionEvent['startDate']) {
      if (this.sessionEvent['startDate'] === null) {
        this.sessionEventErrors['startDate'] = Translator.trans('form_not_blank_error', {}, 'cursus')
      } else {
        this.sessionEventErrors['startDate'] = Translator.trans('form_not_valid_error', {}, 'cursus')
      }
    } else {
      this.sessionEventErrors['startDate'] = null
    }

    if (!this.sessionEvent['endDate']) {
      if (this.sessionEvent['endDate'] === null) {
        this.sessionEventErrors['endDate'] = Translator.trans('form_not_blank_error', {}, 'cursus')
      } else {
        this.sessionEventErrors['endDate'] = Translator.trans('form_not_valid_error', {}, 'cursus')
      }
    } else {
      this.sessionEventErrors['endDate'] = null
    }

    if (this.location) {
      this.sessionEvent['location'] = this.location['id']
    } else {
      this.sessionEvent['location'] = null
    }

    if (this.locationResource) {
      this.sessionEvent['locationResource'] = this.locationResource['id']
    } else {
      this.sessionEvent['locationResource'] = null
    }
    this.sessionEvent['tutors'] = []
    this.tutors.forEach(t => this.sessionEvent['tutors'].push(t['userId']))

    if (this.isValid()) {
      const url = Routing.generate('api_put_session_event_edition', {sessionEvent: this.source['id']})
      this.$http.post(url, {sessionEventDatas: this.sessionEvent}).then(d => {
        this.callback(d['data'])
        this.$uibModalInstance.close()
      })
    }
  }

  resetErrors () {
    for (const key in this.sessionEventErrors) {
      this.sessionEventErrors[key] = null
    }
  }

  isValid () {
    let valid = true

    for (const key in this.sessionEventErrors) {
      if (this.sessionEventErrors[key]) {
        valid = false
        break
      }
    }

    return valid
  }

  openDatePicker (type) {
    if (type === 'start') {
      this.dates['start']['open'] = true
    } else if (type === 'end') {
      this.dates['end']['open'] = true
    }
  }
}
