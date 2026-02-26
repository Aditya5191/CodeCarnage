# 🛡️ Parallax: An AI-Powered Multi-Modal Misinformation Detection Platform

**Parallax is a state-of-the-art, end-to-end ecosystem designed to combat digital misinformation by providing forensic-grade analysis of content across all major media formats. Powered by a suite of custom deep learning models, this project delivers a robust, scalable, and transparent solution for verifying the authenticity of the digital world.**

This repository is the central hub for all components of the Parallax project, from the backend APIs and advanced AI models to the user-facing frontend and browser extension.

---

# 🏛️ Technical Architecture

Parallax is architected as a modular, multi-modal detection platform where each modality operates independently while contributing to a unified analysis pipeline. This design allows continuous model improvement without disrupting other system components.

---

## 🧠 Intelligent Text Analysis

We integrate advanced language modeling and claim verification techniques to create an authoritative verification engine.

### Claim Extraction & Verification Engine
- A language model identifies the central claim within submitted text.
- The claim is evaluated through structured verification and evidence retrieval pipelines.
- Results are synthesized into a clear, evidence-backed explanation.

### User Value
Rather than labeling content as simply “fake” or “real,” Parallax provides contextual reasoning and verified insights to improve transparency and trust.

---

## 🎥 Multi-Modal Deepfake & Authenticity Detection

Parallax analyzes media across video, image, audio, and text formats using specialized AI pipelines.

### Video Modality
A dual-layer forensic framework:
- **Behavioral Analysis** – Detects unnatural facial movements and micro-expressions.
- **Biological Signal Analysis (rPPG)** – Extracts physiological pulse signals from facial regions to detect synthetic inconsistencies.

### Image Modality
- Specialized detection model for human faces.
- Zero-shot generalized model for non-face AI-generated images.
- Identifies GAN-based and diffusion-based synthetic artifacts.

### Audio Modality
- Lightweight model using MFCC-based feature extraction.
- Detects synthetic speech by analyzing inconsistencies in voiceprints and acoustic signatures.

### Text Misinformation Detection
- Hybrid stylistic + semantic classifier.
- Evaluates linguistic entropy, coherence patterns, and structural artifacts associated with AI-generated text.
- Integrated into the backend API for seamless processing.

---

## 📂 Project Component Breakdown

### Each directory contains a dedicated `README.md` with detailed technical information and usage instructions for that module.

| Component | Directory Path | Description & Key Technologies |
| :--- | :--- | :--- |
| **Video Modality** | `./video_modality_raw_files/` | Deepfake detection using behavioral and biological (rPPG) signal analysis. |
| **Image Modality** | `./Image_modality_raw_files/Zero Shot Detection/` | Face-specific and generalized zero-shot synthetic image detection. |
| **Audio Modality** | `./audio_modality_raw_files/Deepfake Audio Detection/` | MFCC-based synthetic voice detection model. |
| **Text Misinformation** | External Repository | Hybrid semantic + stylistic AI-generated text detection system. |
| **Backend** | `./Backend/` | Central API handling model orchestration and response aggregation. |
| **Frontend** | `./Frontend/` | Interactive web interface for uploading and analyzing content. |
| **Web Extension** | `./Web-Extension/` | Browser extension enabling real-time misinformation detection while browsing. |

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Parallax.git
   cd Parallax
   ```
2. Navigate to the `Backend/` directory and follow its setup guide to deploy the core API.
3. Proceed to the `Frontend/` and Web-Extension/ directories to set up the user-facing components.
