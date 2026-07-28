# File: controllers/video_controller.py
import os
from typing import Tuple
from flask import Blueprint, request, jsonify, Response
from processors.video.video_processor import process_video

video_bp = Blueprint('video', __name__)

@video_bp.route('/', methods=['POST'])
def handle_video() -> Tuple[Response, int] | Response:
    if 'video' not in request.files:
        return jsonify({'error': 'No video file uploaded'}), 400

    video = request.files['video']
    filename = video.filename
    if not filename:
        return jsonify({'error': 'Empty filename'}), 400
        
    os.makedirs('uploads', exist_ok=True)  # ensure uploads dir exists
    save_path = os.path.join('uploads', filename)
    video.save(save_path)

    results = process_video(save_path)
    return jsonify(results)
