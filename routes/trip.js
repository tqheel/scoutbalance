'use strict';
var express = require('express');
var router = express.Router();
var crudViewname = 'trip';
var detailsViewName = 'trip_details';
var Trip = require('../types/Trip.js');
var scoutingSeason = '2016-2017';
var utils = require('../utils/common.js');
const editMode = 'edit';
const createMode = 'create';
const viewMode = 'view';
const editActionUrl = './';
const createActionUrl = './edit/';
const viewActionUrl = './';


function convertBoolsToYesNo(boolsArray, next) {
        let convertedBoolArray = [];
        for (let i = 0; i < boolsArray.length; i++) {
                utils.convertBoolToYesNo(boolsArray[i], function (yesNoVal) {
                        convertedBoolArray.push(yesNoVal);
                });
        }
        next(convertedBoolArray);
}

function renderTripDetails(trip, res, convertedBoolArray, viewToRender, mode) {
        let self = trip;
        let url = '';
        switch (mode) {
                case editMode:
                        url = editActionUrl;
                        break;
                case viewMode:
                        url = viewActionUrl;
                        break;
                case createMode:
                        url = createActionUrl;
                        break;
                default:
                        throw('Mode is missing. Action URL cannot be set.');
        }
        res.render(viewToRender, {
                url: url,
                mode: mode,
                modeLabel: (mode === editMode) ? 'Edit Trip Details' : 'Create a New Trip',
                tripId: self.tripid,
                name: self.name,
                tripMaster: self.tripmaster,
                destination: self.destination,
                scoutSeason: self.scoutseason,
                departureTime: self.departuretime,
                musterTime: self.mustertime,
                returnTime: self.returntime,
                youthFee: self.youthfee,
                adultFee: self.adultfee,
                reqPermissionSlip: convertedBoolArray[0],
                reqHealthForm: convertedBoolArray[1],
                reqWaiver: convertedBoolArray[2],
                grubMaster: self.grubmaster,
                grubFee: self.grubfee,
                description: self.description,
                buttonLabel: (mode === editMode) ? 'Update' : 'Create'
        });
}

function getTripById(req, res, viewToRender, mode) {
        let trip = new Trip();
        trip.getByTripId(req.params.tripId, function (tripDetails) {
                console.log('Got trip with a name of ' + tripDetails.name);
                trip = tripDetails;
                let boolArray = [
                        trip.reqpermissionslip,
                        trip.reqhealthform,
                        trip.reqwaiver
                ];

                convertBoolsToYesNo(boolArray, function (convertedBoolArray) {
                        renderTripDetails(trip, res, convertedBoolArray, viewToRender, mode);
                });
        });
}

router.get('/', function(req, res) {
        res.send('This should show a list of trip details links.')
});
router.get('/create', function (req, res) {
        res.render(crudViewname, {
                url: createActionUrl,
                mode: createMode,
                title: 'Troop Trips',
                modeLabel: 'Create a New Trip',
                scoutingSeason: scoutingSeason,
                reqPermissionSlip: 'Yes',
                reqHealthForm: 'No',
                reqWaiver: 'No',
                buttonLabel: 'Create'
        });
});

//show read-only view of trip
router.get('/:tripId', function (req, res) {
        getTripById(req, res, detailsViewName, viewMode);
});

//edit an individual trip
router.get('/edit/:tripId', function (req, res) {
        getTripById(req, res, crudViewname, editMode);
});

router.post('/edit', function (req, res) {
        let pageTrip = req.body;
        let trip = new Trip(
                pageTrip.name,
                pageTrip.tripmaster,
                pageTrip.destination,
                pageTrip.scoutseason,
                pageTrip.muster_time,
                pageTrip.departure_time,
                pageTrip.return_time,
                pageTrip.youthfee,
                pageTrip.adultfee,
                pageTrip.reqpermissionslip,
                pageTrip.reqhealthform,
                pageTrip.reqwaiver,
                pageTrip.grubmaster,
                pageTrip.grubfee,
                [], [], [], [],
                pageTrip.description
        );
        //overide the trip ID with the one from the req body
        trip.tripid = pageTrip.tripId;
        trip.update(function() {
                let self = trip;
                //convert bool values before rendering
                let boolArray = [
                        self.reqpermissionslip,
                        self.reqhealthform,
                        self.reqwaiver
                ];

                // convertBoolsToYesNo(boolArray, function (convertedBoolArray) {
                //         renderTripDetails(self, res, convertedBoolArray, detailsViewName, viewMode);
                // });
                res.redirect('/trip/' + self.tripid);
        });
});

router.post('/create', function (req, res) {
        let trip = req.body;
        let newTrip = new Trip(
                trip.name,
                trip.tripmaster,
                trip.destination,
                trip.scoutseason,
                trip.muster_time,
                trip.departure_time,
                trip.return_time,
                trip.youthfee,
                trip.adultfee,
                trip.reqpermissionslip,
                trip.reqhealthform,
                trip.reqwaiver,
                trip.grubmaster,
                trip.grubfee,
                [], [], [], [],
                trip.description
        );
        newTrip.create(function () {
                let self = newTrip;
                //convert bool values before rendering
                let boolArray = [
                        self.reqpermissionslip,
                        self.reqhealthform,
                        self.reqwaiver
                ];

                convertBoolsToYesNo(boolArray, function (convertedBoolArray) {
                        renderTripDetails(self, res, convertedBoolArray, detailsViewName, viewMode);
                });
        });
});

module.exports = router;