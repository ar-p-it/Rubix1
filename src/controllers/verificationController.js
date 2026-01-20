// src/controllers/verificationController.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { Claim, Post, User } = require('../models');
const verificationService = require('../services/verificationService');
require('dotenv').config(); // ✅ LOAD KEYS

// ✅ CONFIGURE CLOUDINARY (Required for deletion to work)
const hasCloudinary =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}


// 1. Unified Create Claim (Create + Score + Save)
exports.createClaim = async (req, res) => {
  try {
    console.log("--- Creating Unified Claim ---");
    console.log("Req Body:", req.body);
    console.log("Req File:", req.file);

    const { postId } = req.params;
    const { additionalDescription, serialNumber } = req.body;
    const claimantId = req.user._id;


    // A. Check if Post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // B. Prevent Duplicate Claims
    const existingClaim = await Claim.findOne({ postId, claimantId });
    if (existingClaim) {
      return res.status(400).json({ message: "You have already claimed this item." });
    }

    // C. Process Image & Calculate Score Immediately
    let imageProofUrl = null;
    if (req.file) {
      // Multer sets .path differently: Cloudinary gives https URL, disk gives local path; normalize to a URL
      if (req.file.path && req.file.path.startsWith('http')) {
        imageProofUrl = req.file.path;
      } else if (req.file.path) {
        // Convert local file system path to served URL under /uploads
        const filename = path.basename(req.file.path);
        imageProofUrl = `/uploads/${filename}`;
      }
    }
    
    // Run the scoring logic NOW
    const scoringResult = verificationService.calculateTrustScore(
      { additionalDescription, serialNumber, imageProofUrl },
      post // We pass the post object for comparison
    );

    // D. Create the Claim Object
    const newClaim = new Claim({
      postId,
      claimantId,
      verifierId: post.authorId,
      status: 'VERIFICATION_SUBMITTED', // Skip 'PENDING', go straight to submitted
      
      // Initialize Verification Data immediately
      verification: {
        additionalDescription,
        serialNumber,
        imageProofUrl,
        systemTrustScore: scoringResult.score
      },

      // Add History
      timeline: [
        { 
          action: 'CLAIM_CREATED', 
          performedBy: claimantId,
          timestamp: new Date()
        },
        { 
          action: 'EVIDENCE_SUBMITTED', 
          performedBy: claimantId, 
          details: `Initial Score: ${scoringResult.score}`,
          timestamp: new Date()
        }
      ]
    });

    await newClaim.save();
    console.log(`Claim Created with Score: ${scoringResult.score}`);
    res.status(201).json({ message: "Claim submitted successfully", claim: newClaim });

  } catch (error) {
    console.error("❌ ERROR CREATING CLAIM:", error);
    res.status(500).json({ message: "Server error creating claim", error: error.message });
  }
};

// 3. Get Claims for Finder
exports.getClaimsForFinder = async (req, res) => {
  try {
    const userId = req.user._id;
    const claims = await Claim.find({ verifierId: userId })
      .populate('postId', 'title description images') 
      .populate('claimantId', 'username email avatarUrl') 
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching claims" });
  }
};

// 3b. Get Claims submitted by the logged-in user (claimant)
exports.getMyClaims = async (req, res) => {
  try {
    const userId = req.user._id;
    const claims = await Claim.find({ claimantId: userId })
      .populate('postId', 'title description images')
      .populate('verifierId', 'username email avatarUrl')
      .sort({ createdAt: -1 });

    return res.json(claims);
  } catch (error) {
    console.error('Error fetching my claims:', error);
    return res.status(500).json({ message: 'Server error fetching my claims' });
  }
};

// 4. Update Status (Accept/Reject)
exports.updateClaimStatus = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status } = req.body; 

    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (claim.verifierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    claim.status = status;
    claim.timeline.push({ action: status, performedBy: req.user._id });

    if (status === 'ACCEPTED') {
      await Post.findByIdAndUpdate(claim.postId, { 
        status: 'RESOLVED',
        resolvedById: claim.claimantId,
        resolvedAt: new Date()
      });
    }

    await claim.save();
    res.json(claim);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating status" });
  }
};  

exports.deleteClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const userId = req.user._id;

    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (claim.claimantId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // BETTER CLOUDINARY CLEANUP
    if (claim.verification && claim.verification.imageProofUrl) {
      const url = claim.verification.imageProofUrl;

      if (url.includes('res.cloudinary.com') && hasCloudinary) {
        const urlParts = url.split('/');
        const fileNameWithExt = urlParts.pop();
        const folderName = 'hackathon-claims';
        const publicId = `${folderName}/${fileNameWithExt.split('.')[0]}`;
        console.log('Deleting Image Public ID:', publicId);
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudError) {
          console.error('Cloudinary Delete Failed:', cloudError);
        }
      } else if (url.includes('/uploads/')) {
        const rel = url.split('/uploads/')[1];
        if (rel) {
          const localPath = path.join(__dirname, '..', '..', 'uploads', rel);
          try {
            if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
          } catch (fsErr) {
            console.error('Local file delete failed:', fsErr);
          }
        }
      }
    }

    await Claim.findByIdAndDelete(claimId);
    res.json({ message: "Claim and proof image deleted successfully" });

  } catch (error) {
    console.error("ERROR DELETING CLAIM:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};