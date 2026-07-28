import cv2
import numpy as np
import mediapipe as mp
import logging
import traceback

logger = logging.getLogger(__name__)

class MediaPipeFaceDetector:
    """MediaPipe-based face detector for three-tiered cropping with multiple fallback strategies."""
    
    def __init__(self, min_detection_confidence=0.5, max_faces=1, face_recognition_confidence=0.7):
        """Initialize MediaPipe face detector with proper instance creation."""
        try:
            # Initialize MediaPipe solutions
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_face_mesh = mp.solutions.face_mesh
            self.mp_drawing = mp.solutions.drawing_utils
            
            # Create face detection instance (NOT the module itself)
            self.face_detector = self.mp_face_detection.FaceDetection(
                min_detection_confidence=min_detection_confidence,
                model_selection=1  # 1 for full-range model (up to 5m), 0 for short-range (up to 2m)
            )
            
            # Initialize face mesh for better landmark detection
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=max_faces,
                refine_landmarks=True,
                min_detection_confidence=face_recognition_confidence,
                min_tracking_confidence=face_recognition_confidence
            )
            
            logger.info("MediaPipe Face Detector initialized successfully with improved robustness")
        except Exception as e:
            logger.error(f"Failed to initialize MediaPipe Face Detector: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    def detect_face(self, image):
        """Detect face in the image using MediaPipe with multiple fallback strategies."""
        if image is None or image.size == 0:
            logger.error("Received empty image for face detection")
            return None
            
        h, w = image.shape[:2]
        
        # First attempt: Use face detection API
        try:
            detection_results = self.face_detector.process(image)
            
            if detection_results.detections:
                detection = detection_results.detections[0]
                bbox = detection.location_data.relative_bounding_box
                
                # Convert to absolute coordinates with boundary checks
                x = max(0, min(w-1, int(bbox.xmin * w)))
                y = max(0, min(h-1, int(bbox.ymin * h)))
                width = max(0, min(w-x, int(bbox.width * w)))
                height = max(0, min(h-y, int(bbox.height * h)))
                
                # Get keypoints with boundary checks
                keypoints = {}
                
                # Right eye
                right_eye = detection.location_data.relative_keypoints[0]
                keypoints['right_eye'] = (
                    max(0, min(w-1, int(right_eye.x * w))), 
                    max(0, min(h-1, int(right_eye.y * h)))
                )
                
                # Left eye
                left_eye = detection.location_data.relative_keypoints[1]
                keypoints['left_eye'] = (
                    max(0, min(w-1, int(left_eye.x * w))), 
                    max(0, min(h-1, int(left_eye.y * h)))
                )
                
                # Nose tip
                nose_tip = detection.location_data.relative_keypoints[2]
                keypoints['nose_tip'] = (
                    max(0, min(w-1, int(nose_tip.x * w))), 
                    max(0, min(h-1, int(nose_tip.y * h)))
                )
                
                # Mouth center
                mouth_center = detection.location_data.relative_keypoints[3]
                keypoints['mouth_center'] = (
                    max(0, min(w-1, int(mouth_center.x * w))), 
                    max(0, min(h-1, int(mouth_center.y * h)))
                )
                
                return {
                    'bbox': (x, y, width, height),
                    'keypoints': keypoints,
                    'detection_method': 'face_detection'
                }
        except Exception as e:
            logger.debug(f"Face detection API failed: {str(e)}")
        
        # Second attempt: Use face mesh if face detection fails
        try:
            mesh_results = self.face_mesh.process(image)
            
            if mesh_results.multi_face_landmarks:
                face_landmarks = mesh_results.multi_face_landmarks[0]
                
                # Get bounding box from landmarks
                x_coords = [int(landmark.x * w) for landmark in face_landmarks.landmark]
                y_coords = [int(landmark.y * h) for landmark in face_landmarks.landmark]
                x_min, y_min = max(0, min(x_coords)), max(0, min(y_coords))
                x_max, y_max = min(w-1, max(x_coords)), min(h-1, max(y_coords))
                width, height = x_max - x_min, y_max - y_min
                
                # Get key landmarks
                keypoints = {
                    'right_eye': (
                        max(0, min(w-1, int(face_landmarks.landmark[33].x * w))),
                        max(0, min(h-1, int(face_landmarks.landmark[33].y * h)))
                    ),
                    'left_eye': (
                        max(0, min(w-1, int(face_landmarks.landmark[263].x * w))),
                        max(0, min(h-1, int(face_landmarks.landmark[263].y * h)))
                    ),
                    'nose_tip': (
                        max(0, min(w-1, int(face_landmarks.landmark[1].x * w))),
                        max(0, min(h-1, int(face_landmarks.landmark[1].y * h)))
                    ),
                    'mouth_center': (
                        max(0, min(w-1, int(face_landmarks.landmark[13].x * w))),
                        max(0, min(h-1, int(face_landmarks.landmark[13].y * h)))
                    )
                }
                
                return {
                    'bbox': (x_min, y_min, width, height),
                    'keypoints': keypoints,
                    'detection_method': 'face_mesh'
                }
        except Exception as e:
            logger.debug(f"Face mesh processing failed: {str(e)}")
        
        # Third attempt: Simple heuristic if face detection still fails
        try:
            logger.debug("Using heuristic fallback for face detection")
            
            # Simple heuristic: Assume face is in the center (60% of image height)
            face_height = min(h, w) * 0.6
            face_width = face_height * 0.8  # Typical face aspect ratio
            
            # Position face in upper half of image (where faces typically are)
            x = max(0, (w - int(face_width)) // 2)
            y = max(0, (h - int(face_height)) // 3)
            
            # Create approximate keypoints
            keypoints = {
                'right_eye': (int(x + face_width * 0.3), int(y + face_height * 0.25)),
                'left_eye': (int(x + face_width * 0.7), int(y + face_height * 0.25)),
                'nose_tip': (int(x + face_width * 0.5), int(y + face_height * 0.45)),
                'mouth_center': (int(x + face_width * 0.5), int(y + face_height * 0.7))
            }
            
            # Ensure all coordinates are within image boundaries
            for key, (px, py) in keypoints.items():
                keypoints[key] = (max(0, min(w-1, px)), max(0, min(h-1, py)))
            
            return {
                'bbox': (x, y, int(face_width), int(face_height)),
                'keypoints': keypoints,
                'detection_method': 'heuristic'
            }
        except Exception as e:
            logger.debug(f"Heuristic fallback failed: {str(e)}")
        
        # All methods failed
        logger.warning("All face detection methods failed for this frame")
        return None
    
    def three_tiered_cropping(self, image, previous_detection=None):
        """Perform three-tiered cropping with multiple fallback strategies and robust error handling."""
        if image is None or image.size == 0:
            logger.error("Received empty image for three-tiered cropping")
            return None
            
        h, w = image.shape[:2]
        face_data = None
        
        # First attempt: Current frame detection
        try:
            face_data = self.detect_face(image)
        except Exception as e:
            logger.error(f"Error in face detection: {str(e)}")
            logger.error(traceback.format_exc())
        
        # Second attempt: Use previous frame's detection if available and current detection failed
        if face_data is None and previous_detection is not None:
            logger.debug("Using previous frame's detection for temporal consistency")
            face_data = previous_detection
        
        # If all detection methods fail, return None instead of using whole image
        # (Using whole image for face crops would produce meaningless results)
        if face_data is None:
            logger.warning("Face detection failed completely - cannot perform meaningful cropping")
            return None
        
        x, y, width, height = face_data['bbox']
        
        # Ensure bounding box stays within image boundaries
        x = max(0, min(w-1, x))
        y = max(0, min(h-1, y))
        width = max(1, min(width, w - x))
        height = max(1, min(height, h - y))
        
        # 1. Head crop (1.00x scale) - slightly larger than face bbox
        head_scale = 1.00
        head_padding = 0.15  # 15% padding around the face
        
        head_x = max(0, int(x - head_padding * width))
        head_y = max(0, int(y - head_padding * height * 0.5))  # Less padding on top
        head_w = min(w - head_x, int(width * (1 + 2 * head_padding)))
        head_h = min(h - head_y, int(height * (1 + head_padding * 1.5)))  # More padding at bottom
        
        # Ensure minimum size for head crop
        if head_w < 10 or head_h < 10:
            logger.warning("Head crop too small, using whole image")
            head_crop = image
        else:
            head_crop = image[head_y:head_y+head_h, head_x:head_x+head_w]
        
        # 2. Face crop (0.65x scale) - tighter around the face
        face_scale = 0.65
        face_x = max(0, int(x + (1 - face_scale) * width / 2))
        face_y = max(0, int(y + (1 - face_scale) * height / 2))
        face_w = min(w - face_x, int(face_scale * width))
        face_h = min(h - face_y, int(face_scale * height))
        
        # Ensure minimum size for face crop
        if face_w < 10 or face_h < 10:
            logger.warning("Face crop too small, using head crop")
            face_crop = head_crop
        else:
            face_crop = image[face_y:face_y+face_h, face_x:face_x+face_w]
        
        # 3. Lip crop (0.45x scale)
        lip_scale = 0.45
        
        # Use nose tip and mouth center to determine lip region
        if 'nose_tip' in face_data['keypoints'] and 'mouth_center' in face_data['keypoints']:
            nose_x, nose_y = face_data['keypoints']['nose_tip']
            mouth_x, mouth_y = face_data['keypoints']['mouth_center']
            
            # Calculate lip region based on nose and mouth positions
            lip_y = min(h - 1, max(0, int((nose_y + mouth_y) / 2)))
            lip_h = min(h - lip_y, int(lip_scale * height))
            
            # Make lip width proportional to face width
            lip_w = min(w, int(0.7 * width))
            lip_x = max(0, int(x + (width - lip_w) / 2))
        else:
            # Fallback if keypoints not available
            lip_y = min(h - 1, max(0, int(y + height * 0.6)))
            lip_h = min(h - lip_y, int(lip_scale * height))
            lip_w = min(w, int(lip_scale * width))
            lip_x = max(0, int(x + (width - lip_w) / 2))
        
        # Ensure lip crop has valid dimensions
        lip_w = max(10, lip_w)
        lip_h = max(10, lip_h)
        lip_x = max(0, min(w - lip_w, lip_x))
        lip_y = max(0, min(h - lip_h, lip_y))
        
        lip_crop = image[lip_y:lip_y+lip_h, lip_x:lip_x+lip_w]
        
        # Verify all crops are valid
        crops = {
            'head': head_crop,
            'face': face_crop,
            'lip': lip_crop,
            'detection_method': face_data.get('detection_method', 'unknown')
        }
        
        # Log crop dimensions for debugging
        logger.debug(f"Three-tiered cropping dimensions - "
                     f"Head: {head_crop.shape if isinstance(head_crop, np.ndarray) else 'N/A'}, "
                     f"Face: {face_crop.shape if isinstance(face_crop, np.ndarray) else 'N/A'}, "
                     f"Lip: {lip_crop.shape if isinstance(lip_crop, np.ndarray) else 'N/A'}, "
                     f"Method: {face_data.get('detection_method', 'unknown')}")
        
        return crops
    
    def __del__(self):
        """Clean up MediaPipe resources when the object is destroyed."""
        try:
            if hasattr(self, 'face_detector'):
                self.face_detector.close()
            if hasattr(self, 'face_mesh'):
                self.face_mesh.close()
            logger.debug("MediaPipe resources cleaned up")
        except Exception as e:
            logger.debug(f"Error cleaning up MediaPipe resources: {str(e)}")