import torch
import torch.nn as nn
from transformers import ViTModel

class GlobalFeatureEncoder(nn.Module):
    """Global Feature Encoder using ViT to process head region and audio."""
    
    def __init__(self, model_name: str = "google/vit-base-patch16-224"):
        """
        Initialize Global Feature Encoder.
        
        Args:
            model_name: Name of the ViT model to use
        """
        super(GlobalFeatureEncoder, self).__init__()
        
        # Vision Transformer for head region processing
        self.vit = ViTModel.from_pretrained(model_name)
        
        # Freeze ViT backbone (optional)
        for param in self.vit.parameters():
            param.requires_grad = False
    
    def forward(self, head_image: torch.Tensor, audio_features: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the Global Feature Encoder.
        
        Args:
            head_image: Head region image [B, C, H, W]
            audio_features: Audio features [B, C, H, W]
        
        Returns:
            Global features [B, D]
        """
        # Process head image with ViT
        vit_outputs = self.vit(pixel_values=head_image)
        global_features = vit_outputs.last_hidden_state[:, 0]  # [B, D]
        
        return global_features