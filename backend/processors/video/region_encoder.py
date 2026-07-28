import torch
import torch.nn as nn
from transformers import ViTModel

class RegionFeatureExtractor(nn.Module):
    """Extract features from region-specific crops using ViT."""
    
    def __init__(self, model_name: str = "WinKawaks/vit-small-patch16-224"):
        """
        Initialize Region Feature Extractor.
        
        Args:
            model_name: Name of the ViT model to use
        """
        super(RegionFeatureExtractor, self).__init__()
        
        # Vision Transformer for region processing
        self.vit = ViTModel.from_pretrained(model_name)
        
        # Get the actual hidden size from the model configuration
        self.feature_dim = self.vit.config.hidden_size
    
    def forward(self, region: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the Region Feature Extractor.
        
        Args:
            region: Region-specific image [B, T, C, H, W]
        
        Returns:
            Region features [B, T, D]
        """
        B, T, C, H, W = region.shape
        region = region.view(B * T, C, H, W)  # [B*T, C, H, W]
        
        # Process region with ViT
        vit_outputs = self.vit(pixel_values=region)
        region_features = vit_outputs.last_hidden_state[:, 0]  # [B*T, D]
        
        # Reshape back to [B, T, D]
        D = region_features.shape[1]
        region_features = region_features.view(B, T, D)
        
        return region_features

class RegionEncoder(nn.Module):
    """Global-Region Encoder that processes all three regions."""
    
    def __init__(self, 
                 region_feature_dim: int = 384,
                 global_feature_dim: int = 768,
                 hidden_size: int = 512):
        """
        Initialize Global-Region Encoder.
        
        Args:
            region_feature_dim: Expected dimension of region features
            global_feature_dim: Dimension of global features
            hidden_size: Hidden size for classification head
        """
        super(RegionEncoder, self).__init__()
        
        # Region feature extractors
        self.head_extractor = RegionFeatureExtractor("WinKawaks/vit-small-patch16-224")
        self.face_extractor = RegionFeatureExtractor("WinKawaks/vit-small-patch16-224")
        self.lip_extractor = RegionFeatureExtractor("WinKawaks/vit-small-patch16-224")
        
        # Get the actual feature dimension from the ViT model
        self.region_feature_dim = self.head_extractor.feature_dim
        
        # Calculate the actual fused feature dimension
        self.fused_feature_dim = self.region_feature_dim * 3 + global_feature_dim
        
        # Temporal modeling
        self.temporal_modeling = nn.LSTM(
            input_size=self.region_feature_dim * 3,
            hidden_size=hidden_size,
            batch_first=True,
            bidirectional=True
        )
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(self.fused_feature_dim, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, 1)
        )
        
        print(f"RegionEncoder initialized with:")
        print(f"  Region feature dim: {self.region_feature_dim}")
        print(f"  Fused feature dim: {self.fused_feature_dim}")
        print(f"  Hidden size: {hidden_size}")
    
    def forward(self, head: torch.Tensor, face: torch.Tensor, 
                lip: torch.Tensor, global_features: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the Global-Region Encoder.
        
        Args:
            head: Head region images [B, T, C, H, W]
            face: Face region images [B, T, C, H, W]
            lip: Lip region images [B, T, C, H, W]
            global_features: Global features [B, T, D]
        
        Returns:
            Region features [B, T, D_region*3]
        """
        # Extract features from each region
        head_features = self.head_extractor(head)  # [B, T, D_region]
        face_features = self.face_extractor(face)  # [B, T, D_region]
        lip_features = self.lip_extractor(lip)     # [B, T, D_region]
        
        # Concatenate region features along feature dimension
        region_features = torch.cat([head_features, face_features, lip_features], dim=2)  # [B, T, D_region*3]
        
        return region_features
    
    def classify(self, fused_features: torch.Tensor) -> torch.Tensor:
        """
        Classify the fused features.
        
        Args:
            fused_features: Fused features [B, T, D]
        
        Returns:
            Classification logits [B, T, 1]
        """
        return self.classifier(fused_features)