const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const upload = require('../middleware/upload');
const { userAuth } = require('../middleware/adminAuth'); 

// 1. Unified Claim Creation (NOW accepts a file)
// We add 'upload.single' here because the user sends the image *with* the request
router.post('/request/:postId', userAuth, upload.single('evidenceImage'), verificationController.createClaim);

// 2. Finder Routes (Unchanged)
router.get('/incoming', userAuth, verificationController.getClaimsForFinder);
router.get('/my-claims', userAuth, verificationController.getMyClaims);
router.put('/decision/:claimId', userAuth, verificationController.updateClaimStatus);
router.delete('/:claimId', userAuth, verificationController.deleteClaim);
module.exports = router;