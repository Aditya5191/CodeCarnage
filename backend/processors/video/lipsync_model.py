import os
import torch
import numpy as np
from processors.video.global_encoder import GlobalFeatureEncoder
from processors.video.region_encoder import RegionEncoder
from processors.video.region_awareness import RegionAwarenessModule
from utils.face_detection import MediaPipeFaceDetector
from utils.model_utils import fuse_features
from torchvision import transforms
import librosa
import cv2
import subprocess
import logging
import random
import math

# ------------------------------
# Setup logger
# ------------------------------
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Define constants for chunk processing (15 seconds, sample 2 chunks)
CHUNK_DURATION_SEC = 15.0
NUM_CHUNKS_TO_SAMPLE = 2

# ------------------------------
# New LipFD Inference (adapted)
# ------------------------------
class LipFDInference:
    def __init__(self, checkpoint_path,
                 window_size=4, frame_rate=25,
                 audio_sample_rate=16000, audio_n_mels=64,
                 audio_win_length=400, audio_hop_length=160,
                 target_audio_length=64, image_size=224):

        self.window_size = window_size
        self.frame_rate = frame_rate
        self.audio_sample_rate = audio_sample_rate
        self.audio_n_mels = audio_n_mels
        self.audio_win_length = audio_win_length
        self.audio_hop_length = audio_hop_length
        self.target_audio_length = target_audio_length
        self.image_size = image_size

        # MediaPipe face detector
        self.face_detector = MediaPipeFaceDetector()

        # Image transforms
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((self.image_size, self.image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])

        # Config (kept static for simplicity)
        config = {
            'model': {
                'backbone': 'google/vit-base-patch16-224',
                'region_feature_dim': 384,
                'global_feature_dim': 768,
                'hidden_size': 512
            }
        }

        # Model loading moved to constructor (as requested)
        self.global_encoder, self.region_encoder, self.region_awareness, self.device = self._load_model(checkpoint_path, config)

        self.global_encoder.eval()
        self.region_encoder.eval()
        self.region_awareness.eval()

    def _load_model(self, checkpoint_path, config):
        """Initializes and loads the LipFD model components."""
        global_encoder = GlobalFeatureEncoder(config['model']['backbone'])
        region_encoder = RegionEncoder(
            region_feature_dim=config['model']['region_feature_dim'],
            global_feature_dim=config['model']['global_feature_dim'],
            hidden_size=config['model']['hidden_size']
        )
        region_awareness = RegionAwarenessModule(
            region_feature_dim=config['model']['region_feature_dim'],
            global_feature_dim=config['model']['global_feature_dim']
        )

        # Checkpoint loading is in place to support the user's provided structure
        if os.path.exists(checkpoint_path):
            try:
                checkpoint = torch.load(checkpoint_path, map_location="cpu")
                global_encoder.load_state_dict(checkpoint['global_encoder'])
                region_encoder.load_state_dict(checkpoint['region_encoder'])
                region_awareness.load_state_dict(checkpoint['region_awareness'])
                logger.info("LipFD model loaded successfully from checkpoint.")
            except Exception as e:
                logger.error(f"Failed to load model state from checkpoint: {e}. Using uninitialized models.")
        else:
             logger.warning(f"Checkpoint not found at {checkpoint_path}. Using uninitialized models.")


        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        return (global_encoder.to(device),
                region_encoder.to(device),
                region_awareness.to(device),
                device)

    def _get_video_duration(self, video_path):
        """Gets the duration of the video using cv2."""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise IOError(f"Could not open video {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps
        cap.release()
        return duration, fps, frame_count

    def _process_audio(self, audio_segment):
        """Processes raw audio segment into a Mel spectrogram tensor."""
        # Ensure minimum length for processing
        if len(audio_segment) < self.audio_win_length:
            audio_segment = np.pad(audio_segment, (0, self.audio_win_length - len(audio_segment)), 'constant')

        # Dynamically determine n_fft
        n_fft = min(512, len(audio_segment) - 1)
        if n_fft <= 0:
             n_fft = 512

        mel_spec = librosa.feature.melspectrogram(
            y=audio_segment, sr=self.audio_sample_rate,
            n_mels=self.audio_n_mels, n_fft=n_fft,
            win_length=self.audio_win_length, hop_length=self.audio_hop_length
        )
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        # Normalize between 0 and 1
        mel_spec_db = (mel_spec_db - mel_spec_db.min()) / (mel_spec_db.max() - mel_spec_db.min() + 1e-6)
        mel_tensor = torch.from_numpy(mel_spec_db).float()

        # Target length padding/trimming
        if mel_tensor.shape[1] < self.target_audio_length:
            pad_width = self.target_audio_length - mel_tensor.shape[1]
            mel_tensor = torch.nn.functional.pad(mel_tensor, (0, pad_width))
        elif mel_tensor.shape[1] > self.target_audio_length:
            mel_tensor = mel_tensor[:, :self.target_audio_length]

        return mel_tensor.unsqueeze(0)


    def _process_chunk(self, video_path, audio_path, start_time_sec, duration_sec):
        """
        Extracts frames and audio segments for a specific video chunk.
        Uses the pre-extracted audio_path for robust librosa loading or simulates silent audio.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise IOError(f"Could not open video {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # 1. Load Audio Chunk
        if audio_path == video_path:
            # Signal to simulate silent audio
            logger.debug(f"Simulating silent audio for chunk {start_time_sec}-{start_time_sec + duration_sec}.")
            audio = np.zeros(int(duration_sec * self.audio_sample_rate), dtype=np.float32)
        else:
            # Load from extracted WAV file (standard path)
            try:
                audio, _ = librosa.load(audio_path, sr=self.audio_sample_rate, 
                                        offset=start_time_sec, duration=duration_sec)
            except Exception as e:
                # Fallback in case of corruption even after extraction
                logger.error(f"Audio loading failed from extracted audio path, falling back to silent audio: {str(e)}")
                audio = np.zeros(int(duration_sec * self.audio_sample_rate))


        # 2. Setup Video Frame Reading
        start_frame_idx = int(start_time_sec * fps)
        num_frames_to_read = int(duration_sec * fps)
        
        # Set video to the starting frame position
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame_idx)

        frames, audio_segments = [], []
        seg_len_audio = int(self.audio_sample_rate / self.frame_rate)
        last_valid_detection = None

        for i in range(num_frames_to_read):
            ret, frame = cap.read()
            if not ret:
                break
            
            # Use original BGR frame for cropping, convert to RGB for MediaPipe/Torch transform
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Face Detection
            face_data = self.face_detector.detect_face(rgb_frame)
            
            if face_data:
                # Get the cropped regions
                # The face detector can optionally take previous detection for stability
                crops = self.face_detector.three_tiered_cropping(rgb_frame, last_valid_detection)

                if crops and all(crop is not None for crop in crops.values()):
                    frames.append(rgb_frame)

                    # Audio segmentation (relative to the chunk's audio array)
                    audio_frame_index = i
                    start_idx = audio_frame_index * seg_len_audio
                    end_idx = min(start_idx + seg_len_audio, len(audio))
                    segment = audio[start_idx:end_idx]
                    
                    # Pad audio segment if needed
                    if len(segment) < seg_len_audio:
                        segment = np.pad(segment, (0, seg_len_audio - len(segment)))
                    audio_segments.append(segment)
                    
                    # Update last valid detection for temporal consistency
                    last_valid_detection = crops
                # else: Cropping failed, skip frame
            # else: No face detected, skip frame

        cap.release()
        
        if len(frames) < self.window_size:
            raise ValueError(f"Chunk starting at {start_time_sec}s has too few valid frames ({len(frames)}) for analysis.")

        logger.info(f"Processed chunk {start_time_sec}-{start_time_sec+duration_sec}s: {len(frames)} valid frames.")
        return frames, audio_segments

    def predict(self, video_path, audio_path):
        """
        Processes random 15-second chunks of the video using batched inference for speed.
        Returns the average probability of being fake (0-1).
        """
        
        try:
            total_duration, fps, frame_count = self._get_video_duration(video_path)
        except Exception as e:
            logger.error(f"Error reading video duration: {e}")
            return 0.5 # Neutral if duration cannot be read
        
        # 1. Video Length Check (Reject if too short)
        if total_duration < CHUNK_DURATION_SEC:
            logger.warning(f"Video duration ({total_duration:.2f}s) is less than the required chunk size ({CHUNK_DURATION_SEC}s). Rejecting analysis.")
            return 0.5 # Neutral/Error prediction for short videos

        # 2. Determine Chunks
        num_total_chunks = math.floor(total_duration / CHUNK_DURATION_SEC)
        
        # Select random chunk indices
        num_to_sample = min(NUM_CHUNKS_TO_SAMPLE, num_total_chunks)
        sampled_indices = random.sample(range(num_total_chunks), num_to_sample)
        
        logger.info(f"Total duration: {total_duration:.2f}s. Total chunks: {num_total_chunks}. Sampling {num_to_sample} chunks: {sampled_indices}")

        # List to hold stacked T=4 tensors for all valid windows across all sampled chunks
        all_window_batches = {'head': [], 'face': [], 'lip': [], 'audio': []}
        
        # 3. Process Sampled Chunks - Collect all window tensors
        for chunk_idx in sampled_indices:
            start_time_sec = chunk_idx * CHUNK_DURATION_SEC
            
            try:
                # Extract data for the current chunk, passing audio_path
                chunk_frames, chunk_audio_segments = self._process_chunk(
                    video_path, audio_path, start_time_sec, CHUNK_DURATION_SEC
                )
            except ValueError as e:
                logger.warning(str(e))
                continue
            except Exception as e:
                logger.error(f"Critical error during chunk processing: {e}")
                continue
                
            # 4. Iterate over window_size within the chunk and prepare window tensors
            for start_idx in range(0, len(chunk_frames) - self.window_size + 1, self.window_size):
                window_frames = chunk_frames[start_idx:start_idx + self.window_size]
                window_audio = chunk_audio_segments[start_idx:start_idx + self.window_size]

                head_crops, face_crops, lip_crops, audio_specs = [], [], [], []

                if len(window_frames) < self.window_size:
                    continue 

                for i in range(self.window_size):
                    crops = self.face_detector.three_tiered_cropping(window_frames[i]) 
                    
                    if crops and all(crop is not None for crop in crops.values()):
                        head_crops.append(self.transform(crops['head']))
                        face_crops.append(self.transform(crops['face']))
                        lip_crops.append(self.transform(crops['lip']))
                        audio_specs.append(self._process_audio(window_audio[i]))
                    else:
                         # Invalid crop, break and skip this entire window
                         break
                else: 
                    # If loop completed without break, the window is valid. Stack and collect.
                    all_window_batches['head'].append(torch.stack(head_crops))   # [T, C, H, W]
                    all_window_batches['face'].append(torch.stack(face_crops))
                    all_window_batches['lip'].append(torch.stack(lip_crops))
                    all_window_batches['audio'].append(torch.cat(audio_specs, dim=0)) # [T, 1, 64, 64]

        # 5. Prepare and Run Batched Inference (Significant Speedup Here)
        if not all_window_batches['head']:
            logger.warning("No valid windows processed across all sampled chunks.")
            return 0.5

        # Concatenate all N valid windows into a single batch [N, T, C, H, W]
        head_batch = torch.stack(all_window_batches['head']).to(self.device)   
        face_batch = torch.stack(all_window_batches['face']).to(self.device)
        lip_batch = torch.stack(all_window_batches['lip']).to(self.device)
        audio_batch = torch.stack(all_window_batches['audio']).to(self.device) # [N, T, 1, 64, 64]
        
        N = head_batch.shape[0] # Total number of windows (the batch size)
        T = self.window_size

        with torch.no_grad():
            # Reshape for Global Encoder (Need to flatten N x T into N*T)
            # Input shape needed: [N*T, C, H, W] and [N*T, 1, 64, 64]
            head_flat = head_batch.view(-1, *head_batch.shape[2:]) 
            audio_flat = audio_batch.view(-1, *audio_batch.shape[2:])
            
            # Run Global Encoder on the flattened N*T batch
            global_features_flat = self.global_encoder(head_flat, audio_flat) # [N*T, D_global]

            # Reshape global features back to [N, T, D_global]
            global_features = global_features_flat.view(N, T, -1) 

            # Run Region and Awareness modules (input shapes: [N, T, ...])
            region_features = self.region_encoder(head_batch, face_batch, lip_batch, global_features)

            weights = self.region_awareness(region_features, global_features)
            fused = fuse_features(region_features, global_features, weights)

            # Classification
            logits = self.region_encoder.classify(fused) # [N, T]
            logits = logits.mean(dim=1) # [N] - Average predictions across time steps

            # Final probability calculation
            all_probs = torch.sigmoid(logits).cpu().numpy().tolist()

        return float(np.mean(all_probs))

# ------------------------------
# New Helper Function for Audio Extraction
# ------------------------------
def _extract_audio_from_video(video_path, sample_rate):
    """
    Extracts the audio track from a video file using ffmpeg to a temporary WAV file.
    Returns the path to the temporary audio file, or None if no audio stream is found.
    """
    # Create a simple unique temporary file name
    temp_audio_path = f"{video_path}_audio_{random.randint(100000, 999999)}.wav"
    logger.info(f"Extracting audio to temporary file: {temp_audio_path}")
    
    # FFmpeg command to extract audio
    command = [
        'ffmpeg', 
        '-i', video_path, 
        '-vn', # No video
        '-acodec', 'pcm_s16le', # WAV format (PCM 16-bit little-endian)
        '-ar', str(sample_rate), # Set sample rate
        '-y', temp_audio_path # Overwrite output file without asking
    ]
    
    try:
        # Use subprocess.run with check=True to catch critical file/FFmpeg errors
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info("Audio extraction successful.")
        return temp_audio_path
    except subprocess.CalledProcessError as e:
        stderr_output = e.stderr.decode('utf8', 'ignore')
        
        # Check for the specific error indicating no audio stream found in the input
        if "Output file does not contain any stream" in stderr_output:
            logger.warning("FFmpeg failed: No audio stream found in video. Proceeding without extracted audio file.")
            # Clean up the temporary file if it was created but is zero-sized
            if os.path.exists(temp_audio_path):
                 os.remove(temp_audio_path)
            return None # Signal that no audio file was created
            
        # For other CalledProcessErrors (e.g., corrupted file, critical system error), re-raise
        logger.error(f"FFmpeg failed to extract audio (Code: {e.returncode}). Output: {stderr_output}")
        raise RuntimeError(f"Failed to extract audio using ffmpeg: Critical error detected.") from e
        
    except FileNotFoundError:
        raise RuntimeError("FFmpeg command not found. Please ensure ffmpeg is installed and available in your system's PATH.")


# ------------------------------
# Unified entrypoint (modified)
# ------------------------------c
def lipsync_process(video_path):
    """
    Unified entrypoint for lip sync processing with model loading in the constructor.
    """
    # Define checkpoint path relative to this file
    temp_audio_path = None
    audio_input_path = None
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        checkpoint_path = os.path.join(script_dir, "models", "checkpoint_epoch_3.pth")
        
        # 1. Initialize the model (loads weights in __init__)
        model = LipFDInference(checkpoint_path)

        # 2. Extract audio once for stability (uses model's default SR)
        temp_audio_path = _extract_audio_from_video(
            video_path, model.audio_sample_rate
        )
        
        # Set the audio input path based on whether extraction was successful.
        if temp_audio_path is None:
             # Use the video path as a signal to _process_chunk to generate silent audio.
             audio_input_path = video_path 
        else:
             audio_input_path = temp_audio_path

        # 3. Pass video and audio path to predict
        prob_fake = model.predict(video_path, audio_input_path)

        # Handle the rejection case for short videos
        total_duration = model._get_video_duration(video_path)[0]
        if prob_fake == 0.5 and total_duration < CHUNK_DURATION_SEC:
             return "reject", 0.0, f"Video is too short (must be >= {CHUNK_DURATION_SEC}s)."

        # Interpret results
        if prob_fake > 0.5:
            label = "fake"
            reason = "voice and lip sync mismatch detected"
            conf = prob_fake
        else:
            label = "real"
            reason = "synchronized lip movement with audio"
            conf = 1.0 - prob_fake

        return label, conf, reason

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Lip sync processing error for {video_path}: {str(e)}\n{error_details}")
        return "error", 0.0, f"Error: {str(e)}"
    finally:
        # 4. Cleanup the temporary audio file
        # We only remove temp_audio_path if it was successfully created (i.e., not None)
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
                logger.info(f"Cleaned up temporary audio file: {temp_audio_path}")
            except Exception as cleanup_e:
                logger.error(f"Failed to clean up temporary audio file {temp_audio_path}: {cleanup_e}")
