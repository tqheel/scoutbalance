'use strict';
let express = require('express');
let router = express.Router();
let moment = require('moment');
let utils = require('../utils/common');
let Contract = require('../types/Contract');
let contractService = require('../services/contract');
let barcodeService = require('../services/barcode');
let userService = require('../services/users');
let cardAdminPageTitle = 'Tech Chip Honor Card Admin Area';

function processContract(req, contract, next) {
  contractService.logContractSubmission(req, contract, next);
}

function getContract(contractId, next) {
  contractService.getContractById(contractId, function (contract) {
    next(contract);
  });
}

function renderCardStatusPage(contract, contractActivated, dateContractSubmitted, dateCardActivated, res) {
  res.render('tech-card-status', {
    title: 'Troop 212 Technology Chip Honor Card Status Page',
    scoutName: contract.scoutname,
    cardStatus: (contractActivated) ? 'Activated' : 'Not Activated',
    cornersRemaining: (contractActivated) ? contract.corners : 'N/A',
    dateContractSubmitted: moment(dateContractSubmitted).format("MMM Do, YYYY"),
    dateCardActivated: (contractActivated) ? moment(dateCardActivated).format("MMM Do, YYYY") : 'N/A',
    contractId: contract.contractid
  });
}

router.get('/', function (req, res) {
  res.render('policy', { title: 'Troop 212 Policies and Procedures' });
});

router.get('/admin/card/:contractId', function (req, res) {
  if (req.params.contractId) {
    let contractId = req.params.contractId
    contractService.getContractById(contractId, function (contract) {
      if (!contract) {
        res.send('Contract ID not valid.');
      }
      else {
        let dateContractSubmitted = new Date(parseInt(contract.timestamp));
        let dateCardActivated = new Date(parseInt(contract.dateactivated));
        utils.evalSpreadsheetBool(contract.activated, function (contractActivated) {
          res.render('tech-card-admin', {
            title: cardAdminPageTitle,
            scoutName: contract.scoutname,
            cardStatus: (contractActivated) ? 'Activated' : 'Not Activated',
            cardBoolStatus: contractActivated,
            cornersRemaining: (contractActivated) ? contract.corners : 'N/A',
            dateContractSubmitted: moment(dateContractSubmitted).format("MMM Do, YYYY"),
            dateCardActivated: (contractActivated) ? moment(dateCardActivated).format("MMM Do, YYYY") : 'N/A',
            contractId: contract.contractid
          });
        });
      }

    });
  }
  else {
    res.render('tech-card-admin', {
      title: cardAdminPageTitle + " - Error: Contract ID Not Found"
    });
  }
});

router.get('/admin/card', function (req, res) {
  res.render('tech-card-admin', {
    title: cardAdminPageTitle
  });
});

router.get('/tech-policy', function (req, res) {
  res.render('tech-policy', { title: 'Troop 212 Electronic Device Usage Policy' });
});

router.get('/tech-contract', function (req, res) {
  res.render('tech-contract', { title: 'Troop 212 Technology Chip Contract' });
});

router.get('/tech-card-sample', function (req, res) {
  let contract = new Contract(
    'Little Bobby Tables',
    'tqualls@gmail.com',
    "Bobby's Mom",
    'tqualls@gmail.com'
  );
  contract.contractid = 'S7-421-16-1';
  contract.activated = true;
  barcodeService.createBarcodeUrl(req, contract, function (barcodeUrl) {
    res.render('tech-card-sample', {
      title: 'Troop 212 Technology Chip Honor Card',
      scoutName: contract.scoutname,
      barcodeUrl: barcodeUrl
    });
  });
});

router.get('/tech-card/:contractId', function (req, res) {
  getContract(req.params.contractId, function (contract) {
    if (!contract) {
      res.send('Contract ID not valid.');
    }
    else {
      barcodeService.createBarcodeUrl(req, contract, function (barcodeUrl) {
        res.render('tech-card', {
          title: 'Troop 212 Technology Chip Honor Card',
          contractId: contract.contractid,
          scoutName: contract.scoutname,
          barcodeUrl: barcodeUrl
        });
      });
    }

  });
});

router.get('/tech-card-status/:contractId', function (req, res) {
  contractService.getContractById(req.params.contractId, function (contract) {
    if (!contract) {
      res.send('Contract ID not valid.');
    }
    else {
      let dateContractSubmitted = new Date(parseInt(contract.timestamp));
      let dateCardActivated = new Date(parseInt(contract.dateactivated));
      utils.evalSpreadsheetBool(contract.activated, function (contractActivated) {
        renderCardStatusPage(contract, contractActivated, dateContractSubmitted, dateCardActivated, res);
      });
    }

  });
});

router.post('/contract', function (req, res) {
  let contract = new Contract(
    req.body.scoutName,
    req.body.scoutEmail,
    req.body.parentName,
    req.body.parentEmail
  );
  processContract(req, contract, function () {
    res.render('tech-contract-success', {
      title: 'Contract Submitted.'
    });
  });
});

router.post('/admin/tech-card', function (req, res) {
  let contract = new Contract();
  userService.isUserAuthorizedAsAdmin(req.body.adminId, req.body.password, function (isUserAuthAdmin) {
    if (!isUserAuthAdmin) {
      res.redirect('/users/nah');
    }
    else {
      //TOFIX: newCornersCount ends up being a string
      let newCornersCount = contract.corners + req.body.cornersChange;
      let activated = req.body.activation;
      contract.activated = activated;
      contract.corners = newCornersCount;
      contract.contractid = req.body.contractId;
      contractService.updateContract(contract, function (updatedContract) {
        let dateContractSubmitted = new Date(parseInt(contract.timestamp));
        let dateCardActivated = new Date(parseInt(contract.dateactivated));
        utils.evalSpreadsheetBool(contract.activated, function (contractActivated) {
          renderCardStatusPage(updatedContract, contractActivated, dateContractSubmitted, dateCardActivated, res);
        });

      });
    }
  });
});

module.exports = router;