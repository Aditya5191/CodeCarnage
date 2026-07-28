import os
import argparse
import subprocess
import logging
from tqdm import tqdm

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def extract_audio(video_path, output_path, sample_rate=16000):
    """
    Extract audio from video using ffmpeg.
    
    Args:
        video_path: Path to input video file
        output_path: Path to output audio file
        sample_rate: Target audio sample rate
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Check if ffmpeg is available
        subprocess.run(['ffmpeg', '-version'], 
                      stdout=subprocess.DEVNULL, 
                      stderr=subprocess.DEVNULL,
                      check=True)
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Extract audio
        cmd = [
            'ffmpeg',
            '-y',  # Overwrite output file if it exists
            '-i', video_path,
            '-ar', str(sample_rate),  # Audio sample rate
            '-ac', '1',  # Mono audio
            '-f', 'wav',  # WAV format
            output_path
        ]
        result = subprocess.run(cmd, 
                              stdout=subprocess.DEVNULL, 
                              stderr=subprocess.DEVNULL,
                              check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        logger.error(f"FFmpeg extraction failed: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during audio extraction: {str(e)}")
        return False

def process_dataset(video_dir, output_dir, sample_rate=16000):
    """
    Process an entire dataset directory to extract audio.
    
    Args:
        video_dir: Directory containing video files
        output_dir: Directory to save extracted audio
        sample_rate: Target audio sample rate
    """
    # Supported video extensions
    video_extensions = ['.mp4', '.avi', '.mov', '.mkv']
    
    # Find all video files
    video_files = []
    for root, _, files in os.walk(video_dir):
        for file in files:
            if any(file.lower().endswith(ext) for ext in video_extensions):
                video_files.append(os.path.join(root, file))
    
    logger.info(f"Found {len(video_files)} video files to process")

    success_count = 0
    failure_count = 0

    # Clean processing loop with tqdm
    for video_path in tqdm(video_files, desc="Extracting audio", unit="file"):
        rel_path = os.path.relpath(video_path, video_dir)
        audio_path = os.path.join(output_dir, os.path.splitext(rel_path)[0] + '.wav')
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)

        if extract_audio(video_path, audio_path, sample_rate):
            success_count += 1
        else:
            failure_count += 1

    logger.info(f"\n✅ Successfully extracted audio from {success_count}/{len(video_files)} videos")
    if failure_count > 0:
        logger.warning(f"⚠️ Failed to extract audio from {failure_count} videos")


def main():
    parser = argparse.ArgumentParser(description='Extract audio from videos for LipFD dataset')
    parser.add_argument('--video_dir', type=str, required=True,
                        help='Directory containing video files (with 0_real and 1_fake subdirectories)')
    parser.add_argument('--output_dir', type=str, required=True,
                        help='Directory to save extracted audio files')
    parser.add_argument('--sample_rate', type=int, default=16000,
                        help='Audio sample rate (default: 16000)')
    
    args = parser.parse_args()
    
    # Verify input directory exists
    if not os.path.exists(args.video_dir):
        logger.error(f"Input directory does not exist: {args.video_dir}")
        return
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Check for ffmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], 
                      stdout=subprocess.DEVNULL, 
                      stderr=subprocess.DEVNULL,
                      check=True)
        logger.info("FFmpeg is installed and available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.error("FFmpeg is not installed or not in PATH")
        logger.info("Please install FFmpeg from https://ffmpeg.org/download.html")
        logger.info("And add it to your system PATH")
        return
    
    # Process the dataset
    process_dataset(args.video_dir, args.output_dir, args.sample_rate)

if __name__ == "__main__":
    main()