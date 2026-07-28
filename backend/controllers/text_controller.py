from typing import Tuple
from flask import Blueprint, request, jsonify, Response
from processors.text.text_processor import process_text

text_bp = Blueprint('text', __name__)

@text_bp.route('/', methods=['POST'])
def handle_text() -> Tuple[Response, int] | Response:
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data['text']
    results = process_text(text)
    return jsonify(results)
