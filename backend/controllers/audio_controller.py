import os
from typing import Tuple, Any
from flask import Blueprint, request, jsonify, Response
from processors.audio.audio_processor import process_audio

audio_bp = Blueprint('audio', __name__)

@audio_bp.route('/', methods=['POST'])
def handle_audio() -> Tuple[Response, int] | Response:
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file uploaded'}), 400

    audio = request.files['audio']
    filename = audio.filename
    if not filename:
        return jsonify({'error': 'Empty filename'}), 400

    os.makedirs('uploads/audio', exist_ok=True)
    save_path = os.path.join('uploads/audio', filename)
    audio.save(save_path)

    results = process_audio(save_path)
    return jsonify(results)
